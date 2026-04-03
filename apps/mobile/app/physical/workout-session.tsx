import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Vibration,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { addSessionLog } from "@/lib/onboarding-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "@/lib/user-store";
import {
  adaptWorkoutTargets,
  updateFatigueState,
  type FatigueState,
} from "@/lib/fitness-engine";
import { api } from "@/lib/api";
import CameraRepTracker from "@/components/camera-rep-tracker";

type SessionFeedback =
  | "too_easy"
  | "just_right"
  | "too_hard"
  | "could_not_finish";

interface SetResult {
  setNumber: number;
  targetReps: number;
  actualReps: number;
  restSeconds: number;
}

interface ExerciseResult {
  exerciseName: string;
  sets: SetResult[];
  targetSets: number;
  targetReps: number;
  completionPercent: number;
  caloriesBurned: number;
  adaptationApplied: boolean;
  adaptedSets?: number;
  adaptedReps?: number;
}

type Phase = "pre" | "exercising" | "resting" | "feedback" | "done";

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const twoColCardWidth = Math.floor((contentWidth - 12) / 2);
  const threeColCardWidth = Math.floor((contentWidth - 24) / 3);
  const [userId, setUserId] = useState<string>("default");
  const [plan, setPlan] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("pre");

  // Input mode: manual or camera
  const [inputMode, setInputMode] = useState<"manual" | "camera">("manual");

  // Current set input
  const [repsInput, setRepsInput] = useState("");

  // Rest timer
  const [restTime, setRestTime] = useState(0);
  const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const REST_DURATION = 60; // seconds

  // Session tracking
  const [exerciseResults, setExerciseResults] = useState<ExerciseResult[]>([]);
  const [currentSets, setCurrentSets] = useState<SetResult[]>([]);
  const [fatigueState, setFatigueState] = useState<FatigueState>({
    currentFatigueLevel: 0,
    performanceTrend: [],
    totalVolumeCompleted: 0,
    timeElapsedMinutes: 0,
    strugglingExercises: [],
  });
  const [sessionStart] = useState(Date.now());
  const [adaptedTargets, setAdaptedTargets] = useState<{
    sets: number;
    reps: number;
  } | null>(null);
  const [feedback, setFeedback] = useState<SessionFeedback>("just_right");

  // Elapsed time for exercising phase
  const [exerciseElapsed, setExerciseElapsed] = useState(0);
  const exerciseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Refs for stable closures ──
  // We keep refs in sync with state so that interval callbacks always
  // have access to the latest values without stale closures.
  const setIdxRef = useRef(0);
  const currentSetsRef = useRef<SetResult[]>([]);
  const exerciseIdxRef = useRef(0);
  const exercisesRef = useRef<any[]>([]);
  const adaptedTargetsRef = useRef<{ sets: number; reps: number } | null>(null);
  const fatigueStateRef = useRef<FatigueState>(fatigueState);
  const exerciseResultsRef = useRef<ExerciseResult[]>([]);
  const inputModeRef = useRef<"manual" | "camera">("manual");

  // Keep refs in sync
  useEffect(() => {
    setIdxRef.current = setIdx;
  }, [setIdx]);
  useEffect(() => {
    currentSetsRef.current = currentSets;
  }, [currentSets]);
  useEffect(() => {
    exerciseIdxRef.current = exerciseIdx;
  }, [exerciseIdx]);
  useEffect(() => {
    exercisesRef.current = exercises;
  }, [exercises]);
  useEffect(() => {
    adaptedTargetsRef.current = adaptedTargets;
  }, [adaptedTargets]);
  useEffect(() => {
    fatigueStateRef.current = fatigueState;
  }, [fatigueState]);
  useEffect(() => {
    exerciseResultsRef.current = exerciseResults;
  }, [exerciseResults]);
  useEffect(() => {
    inputModeRef.current = inputMode;
  }, [inputMode]);

  // Load plan and pick today's session
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [raw, auth] = await Promise.all([
          AsyncStorage.getItem("@aura/last_generated_plan"),
          getAuth(),
        ]);
        if (auth?.userId) setUserId(auth.userId);
        const storedPlan = raw ? JSON.parse(raw) : null;
        setPlan(storedPlan);

        if (storedPlan?.sessions) {
          const dayNames = [
            "sunday",
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
          ];
          const today = dayNames[new Date().getDay()];
          const session = storedPlan.sessions[today];
          if (session?.exercises?.length) {
            setExercises(session.exercises);
          } else {
            // Fall back to first available session
            const firstDay = Object.keys(storedPlan.sessions).find(
              (d: string) => storedPlan.sessions[d]?.exercises?.length > 0,
            );
            if (firstDay) setExercises(storedPlan.sessions[firstDay].exercises);
          }
        }
      })();
    }, []),
  );

  // Rest timer effect — uses refs to avoid stale closures
  useEffect(() => {
    if (phase === "resting") {
      setRestTime(REST_DURATION);
      restTimerRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            clearInterval(restTimerRef.current!);
            restTimerRef.current = null;
            Vibration.vibrate(500);
            // Use refs for the latest values
            advanceAfterRestFromRef();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [phase]);

  // Exercise elapsed timer
  useEffect(() => {
    if (phase === "exercising" && inputMode === "manual") {
      const start = Date.now();
      setExerciseElapsed(0);
      exerciseTimerRef.current = setInterval(() => {
        setExerciseElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => {
      if (exerciseTimerRef.current) {
        clearInterval(exerciseTimerRef.current);
        exerciseTimerRef.current = null;
      }
    };
  }, [phase, setIdx, inputMode]);

  const currentExercise = exercises[exerciseIdx];
  const totalSets = adaptedTargets?.sets ?? currentExercise?.sets ?? 3;
  const totalReps = adaptedTargets?.reps ?? currentExercise?.reps ?? 12;

  /** Get current total sets from refs (for use in interval callbacks) */
  function getTotalSetsFromRef() {
    const ex = exercisesRef.current[exerciseIdxRef.current];
    return adaptedTargetsRef.current?.sets ?? ex?.sets ?? 3;
  }

  /** Advance after rest using refs — safe to call from interval */
  function advanceAfterRestFromRef() {
    const curSetIdx = setIdxRef.current;
    const curTotalSets = getTotalSetsFromRef();
    const nextSet = curSetIdx + 1;
    if (nextSet < curTotalSets) {
      setSetIdx(nextSet);
      setPhase("exercising");
      setRepsInput("");
    } else {
      finishExerciseFromRef();
    }
  }

  function skipRest() {
    if (restTimerRef.current) clearInterval(restTimerRef.current);
    restTimerRef.current = null;
    advanceAfterRestFromRef();
  }

  function logSet() {
    const actual = parseInt(repsInput) || 0;
    const setResult: SetResult = {
      setNumber: setIdx + 1,
      targetReps: totalReps,
      actualReps: actual,
      restSeconds: REST_DURATION,
    };
    const newSets = [...currentSets, setResult];
    setCurrentSets(newSets);
    currentSetsRef.current = newSets;

    // Update fatigue
    const elapsed = (Date.now() - sessionStart) / 60000;
    const newFatigue = updateFatigueState({
      state: fatigueState,
      actualReps: actual,
      targetReps: totalReps,
      exerciseName: currentExercise.name,
      timeElapsedMinutes: elapsed,
    });
    setFatigueState(newFatigue);
    fatigueStateRef.current = newFatigue;

    // Check adaptation for next exercise
    if (exerciseIdx + 1 < exercises.length) {
      const nextEx = exercises[exerciseIdx + 1];
      const adapted = adaptWorkoutTargets({
        exerciseIndex: exerciseIdx + 1,
        exercise: nextEx,
        originalExercises: exercises,
        fatigueState: newFatigue,
      });
      if (adapted.adaptation) {
        setAdaptedTargets({
          sets: adapted.adaptedSets,
          reps: adapted.adaptedReps,
        });
      } else {
        setAdaptedTargets(null);
      }
    }

    setRepsInput("");

    // If this was the last set, finish the exercise
    if (setIdx + 1 >= totalSets) {
      finishExerciseWithSets(newSets);
    } else {
      setPhase("resting");
    }
  }

  function finishExerciseWithSets(sets: SetResult[]) {
    const curExercise = exercises[exerciseIdx];
    const curTotalReps = adaptedTargets?.reps ?? curExercise?.reps ?? 12;
    const totalTarget = sets.length * curTotalReps;
    const totalActual = sets.reduce((s, r) => s + r.actualReps, 0);
    const completion = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const cal = Math.round(totalActual * 0.5);

    const result: ExerciseResult = {
      exerciseName: curExercise.name,
      sets,
      targetSets: curExercise.sets ?? 3,
      targetReps: curExercise.reps ?? 12,
      completionPercent: Math.round(completion),
      caloriesBurned: cal,
      adaptationApplied: adaptedTargets !== null,
      adaptedSets: adaptedTargets?.sets,
      adaptedReps: adaptedTargets?.reps,
    };

    const newResults = [...exerciseResults, result];
    setExerciseResults(newResults);
    exerciseResultsRef.current = newResults;
    setPhase("feedback");
  }

  /** Finish exercise using refs — safe to call from interval */
  function finishExerciseFromRef() {
    const sets = currentSetsRef.current;
    const idx = exerciseIdxRef.current;
    const curExercise = exercisesRef.current[idx];
    const curTotalReps =
      adaptedTargetsRef.current?.reps ?? curExercise?.reps ?? 12;
    const totalTarget = sets.length * curTotalReps;
    const totalActual = sets.reduce((s, r) => s + r.actualReps, 0);
    const completion = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const cal = Math.round(totalActual * 0.5);

    const result: ExerciseResult = {
      exerciseName: curExercise?.name ?? "Exercise",
      sets,
      targetSets: curExercise?.sets ?? 3,
      targetReps: curExercise?.reps ?? 12,
      completionPercent: Math.round(completion),
      caloriesBurned: cal,
      adaptationApplied: adaptedTargetsRef.current !== null,
      adaptedSets: adaptedTargetsRef.current?.sets,
      adaptedReps: adaptedTargetsRef.current?.reps,
    };

    setExerciseResults((prev) => {
      const newResults = [...prev, result];
      exerciseResultsRef.current = newResults;
      return newResults;
    });
    setPhase("feedback");
  }

  function handleFeedback(fb: SessionFeedback) {
    setFeedback(fb);
    const nextIdx = exerciseIdx + 1;
    if (nextIdx < exercises.length) {
      setExerciseIdx(nextIdx);
      setSetIdx(0);
      setCurrentSets([]);
      currentSetsRef.current = [];
      setRepsInput("");
      setPhase("exercising");
    } else {
      setPhase("done");
      saveSession();
    }
  }

  async function saveSession() {
    const allResults = exerciseResultsRef.current;
    const totalCal = allResults.reduce((s, e) => s + e.caloriesBurned, 0);
    const totalCompletion =
      allResults.length > 0
        ? allResults.reduce((s, e) => s + e.completionPercent, 0) /
          allResults.length
        : 0;
    const durationMinutes = Math.round((Date.now() - sessionStart) / 60000);
    const today = new Date().toISOString().split("T")[0];

    const sessionLog = {
      sessionId: `s_${Date.now().toString(36)}`,
      userId,
      day: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ][new Date().getDay()],
      dateIso: today,
      focus: currentExercise?.bodyParts?.[0] ?? "general",
      exercises: allResults.map((r) => ({
        exerciseName: r.exerciseName,
        sets: r.sets,
        targetSets: r.targetSets,
        targetReps: r.targetReps,
        metric: "reps",
        completionPercent: r.completionPercent,
        caloriesBurned: r.caloriesBurned,
        adaptationApplied: r.adaptationApplied,
      })),
      totalDurationMinutes: durationMinutes,
      totalCaloriesBurned: totalCal,
      completionPercent: Math.round(totalCompletion),
    };

    // Save locally
    await addSessionLog({
      sessionId: sessionLog.sessionId,
      dateIso: today,
      day: sessionLog.day,
      focus: sessionLog.focus,
      completionPercent: sessionLog.completionPercent,
      caloriesBurned: totalCal,
      durationMinutes,
    });

    // Sync to server
    try {
      await api.post("/workout/log", sessionLog);
    } catch {
      // Offline-first
    }
  }

  /** Format seconds as m:ss */
  function fmtTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  // Total session elapsed
  const sessionElapsed = Math.floor((Date.now() - sessionStart) / 1000);

  // ── Renders ──

  if (!exercises.length) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7]">
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 48 }}>🏋️</Text>
          <Text className="text-[17px] text-[#8A8A8E] text-center mt-4">
            No workout plan found. Generate a plan first!
          </Text>
          <Pressable
            onPress={() => router.replace("/physical/plan-setup")}
            className="mt-4 bg-[#007AFF] px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-semibold">Create Plan</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "pre") {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7]">
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 60 }}>💪</Text>
          <Text className="text-[28px] font-bold text-black mt-4 text-center">
            Ready to Train?
          </Text>
          <Text className="text-[15px] text-[#8A8A8E] mt-2 text-center">
            {exercises.length} exercises today
          </Text>

          {/* Exercise preview */}
          <View className="w-full mt-6 gap-2">
            {exercises.slice(0, 5).map((ex: any, i: number) => (
              <GlassCard
                key={i}
                className="p-3 flex-row justify-between items-center"
              >
                <Text className="text-[15px] font-semibold text-black">
                  {ex.name}
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  {ex.sets}×{ex.reps}
                </Text>
              </GlassCard>
            ))}
            {exercises.length > 5 && (
              <Text className="text-[13px] text-[#8A8A8E] text-center">
                +{exercises.length - 5} more
              </Text>
            )}
          </View>

          <Pressable
            onPress={() => setPhase("exercising")}
            className="mt-8 bg-[#007AFF] px-10 py-4 rounded-2xl"
          >
            <Text className="text-white text-[17px] font-bold">
              Start Workout
            </Text>
          </Pressable>
          <Pressable onPress={() => router.back()} className="mt-3">
            <Text className="text-[#007AFF] text-[15px] font-medium">
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (phase === "done") {
    const totalCal = exerciseResults.reduce((s, e) => s + e.caloriesBurned, 0);
    const avgCompletion =
      exerciseResults.length > 0
        ? Math.round(
            exerciseResults.reduce((s, e) => s + e.completionPercent, 0) /
              exerciseResults.length,
          )
        : 0;
    const durationMinutes = Math.round((Date.now() - sessionStart) / 60000);
    const adaptations = exerciseResults.filter(
      (e) => e.adaptationApplied,
    ).length;

    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7]">
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center pt-10 pb-6">
            <Text style={{ fontSize: 60 }}>🎉</Text>
            <Text className="text-[28px] font-bold text-black mt-4">
              Workout Complete!
            </Text>
          </View>

          {/* Summary stats */}
          <View
            className="flex-row justify-between mb-4"
            style={{
              maxWidth: contentWidth,
              width: "100%",
              alignSelf: "center",
            }}
          >
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center">
                <Text className="text-[24px] font-bold text-[#007AFF]">
                  {avgCompletion}%
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-semibold uppercase mt-1">
                  Completion
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center">
                <Text className="text-[24px] font-bold text-[#FF9500]">
                  {totalCal}
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-semibold uppercase mt-1">
                  Calories
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center">
                <Text className="text-[24px] font-bold text-[#34C759]">
                  {durationMinutes}
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-semibold uppercase mt-1">
                  Minutes
                </Text>
              </GlassCard>
            </View>
          </View>

          {adaptations > 0 && (
            <GlassCard
              className="p-3 mb-4 flex-row items-center gap-2"
              style={{ backgroundColor: "#FF950010" }}
            >
              <Text style={{ fontSize: 18 }}>⚙️</Text>
              <Text className="text-[13px] text-[#FF9500] font-medium">
                {adaptations} exercise(s) adapted based on fatigue
              </Text>
            </GlassCard>
          )}

          {/* Fatigue level */}
          <GlassCard className="p-4 mb-4">
            <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              Session Fatigue
            </Text>
            <View className="h-3 bg-[#E5E5EA] rounded-full overflow-hidden">
              <View
                className="h-3 rounded-full"
                style={{
                  width: `${Math.round(fatigueState.currentFatigueLevel * 100)}%`,
                  backgroundColor:
                    fatigueState.currentFatigueLevel > 0.7
                      ? "#FF3B30"
                      : fatigueState.currentFatigueLevel > 0.4
                        ? "#FF9500"
                        : "#34C759",
                }}
              />
            </View>
            <Text className="text-[12px] text-[#8A8A8E] mt-1">
              {Math.round(fatigueState.currentFatigueLevel * 100)}% fatigue
            </Text>
          </GlassCard>

          {/* Exercise breakdown */}
          <Text className="text-[17px] font-bold text-black tracking-tight mb-3">
            Exercise Breakdown
          </Text>
          <View className="gap-2 mb-6">
            {exerciseResults.map((r, i) => (
              <GlassCard key={i} className="p-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-[15px] font-semibold text-black flex-1">
                    {r.exerciseName}
                  </Text>
                  <Text
                    className="text-[13px] font-bold"
                    style={{
                      color:
                        r.completionPercent >= 80
                          ? "#34C759"
                          : r.completionPercent >= 50
                            ? "#FF9500"
                            : "#FF3B30",
                    }}
                  >
                    {r.completionPercent}%
                  </Text>
                </View>
                <Text className="text-[12px] text-[#8A8A8E] mt-1">
                  {r.sets.map((s) => s.actualReps).join(" / ")} reps ·{" "}
                  {r.caloriesBurned} kcal
                  {r.adaptationApplied ? " · adapted" : ""}
                </Text>
              </GlassCard>
            ))}
          </View>

          <Pressable
            onPress={() => router.replace("/physical/hub")}
            className="bg-[#007AFF] rounded-2xl py-4 items-center mb-10"
          >
            <Text className="text-white text-[17px] font-bold">
              Back to Hub
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (phase === "feedback") {
    const lastResult = exerciseResults[exerciseResults.length - 1];
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7]">
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 48 }}>
            {(lastResult?.completionPercent ?? 0) >= 80 ? "💪" : "👊"}
          </Text>
          <Text className="text-[22px] font-bold text-black mt-4">
            {currentExercise.name} Done!
          </Text>
          <Text className="text-[15px] text-[#8A8A8E] mt-1">
            {lastResult?.completionPercent ?? 0}% completion ·{" "}
            {lastResult?.caloriesBurned ?? 0} kcal
          </Text>

          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-8 mb-3">
            How did it feel?
          </Text>
          <View className="w-full gap-2">
            {(
              [
                { value: "too_easy", label: "Too Easy", emoji: "😎" },
                { value: "just_right", label: "Just Right", emoji: "👍" },
                { value: "too_hard", label: "Too Hard", emoji: "😤" },
                {
                  value: "could_not_finish",
                  label: "Couldn't Finish",
                  emoji: "😵",
                },
              ] as const
            ).map((fb) => (
              <Pressable
                key={fb.value}
                onPress={() => handleFeedback(fb.value)}
                className="bg-white rounded-2xl py-4 px-5 flex-row items-center gap-3"
                style={{ borderWidth: 1.5, borderColor: "#E5E5EA" }}
              >
                <Text style={{ fontSize: 24 }}>{fb.emoji}</Text>
                <Text className="text-[17px] font-semibold text-black">
                  {fb.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-[13px] text-[#8A8A8E] mt-4">
            {exerciseIdx + 1 < exercises.length
              ? `${exercises.length - exerciseIdx - 1} exercise(s) remaining`
              : "This was the last exercise!"}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera mode: full-screen camera rep tracker ──
  if (inputMode === "camera" && phase === "exercising") {
    return (
      <CameraRepTracker
        exerciseName={currentExercise.name}
        bodyParts={currentExercise.bodyParts}
        targetReps={totalReps}
        onSetComplete={(reps, _elapsed) => {
          const actual = reps;
          const setResult: SetResult = {
            setNumber: setIdx + 1,
            targetReps: totalReps,
            actualReps: actual,
            restSeconds: REST_DURATION,
          };
          const newSets = [...currentSets, setResult];
          setCurrentSets(newSets);
          currentSetsRef.current = newSets;

          // Update fatigue
          const elapsedMin = (Date.now() - sessionStart) / 60000;
          const newFatigue = updateFatigueState({
            state: fatigueState,
            actualReps: actual,
            targetReps: totalReps,
            exerciseName: currentExercise.name,
            timeElapsedMinutes: elapsedMin,
          });
          setFatigueState(newFatigue);
          fatigueStateRef.current = newFatigue;

          // Adapt next exercise
          if (exerciseIdx + 1 < exercises.length) {
            const nextEx = exercises[exerciseIdx + 1];
            const adapted = adaptWorkoutTargets({
              exerciseIndex: exerciseIdx + 1,
              exercise: nextEx,
              originalExercises: exercises,
              fatigueState: newFatigue,
            });
            if (adapted.adaptation) {
              setAdaptedTargets({
                sets: adapted.adaptedSets,
                reps: adapted.adaptedReps,
              });
            } else {
              setAdaptedTargets(null);
            }
          }

          if (setIdx + 1 >= totalSets) {
            finishExerciseWithSets(newSets);
          } else {
            // Advance setIdx so next set shows correctly
            setSetIdx(setIdx + 1);
            setPhase("resting");
          }
        }}
        onCancel={() => setInputMode("manual")}
      />
    );
  }

  // ── Exercising / Resting phase (manual or between camera sets) ──
  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Top bar */}
      <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <View className="items-center flex-1">
          <Text className="text-[13px] text-[#8A8A8E] font-semibold">
            Exercise {exerciseIdx + 1}/{exercises.length}
          </Text>
          {phase === "exercising" && inputMode === "manual" && (
            <Text className="text-[11px] text-[#007AFF] font-medium mt-0.5">
              ⏱ {fmtTime(exerciseElapsed)}
            </Text>
          )}
        </View>
        <View className="w-9" />
      </View>

      {/* Progress bar */}
      <View className="px-6 mb-4">
        <View className="h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
          <View
            className="h-2 rounded-full bg-[#007AFF]"
            style={{
              width: `${((exerciseIdx + setIdx / totalSets) / exercises.length) * 100}%`,
            }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Exercise info */}
        <GlassCard className="p-5 mb-4">
          <Text className="text-[24px] font-bold text-black tracking-tight">
            {currentExercise.name}
          </Text>
          {currentExercise.bodyParts?.length > 0 && (
            <View className="flex-row gap-1.5 mt-2">
              {currentExercise.bodyParts.map((bp: string) => (
                <View key={bp} className="bg-[#007AFF15] px-2 py-0.5 rounded">
                  <Text className="text-[11px] font-semibold text-[#007AFF] capitalize">
                    {bp.replace("_", " ")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Adaptation notice */}
          {adaptedTargets && (
            <View className="mt-3 bg-[#FF950015] rounded-xl p-3">
              <Text className="text-[13px] text-[#FF9500] font-semibold">
                Adapted: {adaptedTargets.sets}×{adaptedTargets.reps} (was{" "}
                {currentExercise.sets}×{currentExercise.reps})
              </Text>
              <Text className="text-[11px] text-[#8A8A8E] mt-0.5">
                Adjusted based on fatigue (
                {Math.round(fatigueState.currentFatigueLevel * 100)}%)
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Set tracker */}
        <View className="flex-row gap-2 mb-4">
          {Array.from({ length: totalSets }).map((_, i) => {
            const done = i < currentSets.length;
            const isActive = i === setIdx && phase === "exercising";
            return (
              <View
                key={i}
                className="flex-1 h-2 rounded-full"
                style={{
                  backgroundColor: done
                    ? "#34C759"
                    : isActive
                      ? "#007AFF"
                      : "#E5E5EA",
                }}
              />
            );
          })}
        </View>

        {phase === "resting" ? (
          <View className="items-center py-10">
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              Rest Timer
            </Text>
            <Text className="text-[64px] font-bold text-black">
              {restTime}s
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mt-2">
              Set {currentSets.length}/{totalSets} complete
            </Text>
            <Pressable
              onPress={skipRest}
              className="mt-6 bg-[#007AFF15] px-6 py-3 rounded-2xl"
            >
              <Text className="text-[#007AFF] font-semibold text-[15px]">
                Skip Rest
              </Text>
            </Pressable>

            {/* During rest, allow switching input mode for next set */}
            <View
              className="flex-row justify-between mt-6 w-full px-4"
              style={{ maxWidth: contentWidth, alignSelf: "center" }}
            >
              <View style={{ width: twoColCardWidth }}>
                <Pressable
                  onPress={() => setInputMode("manual")}
                  className="py-2.5 rounded-xl items-center"
                  style={{
                    backgroundColor:
                      inputMode === "manual" ? "#007AFF" : "#fff",
                    borderWidth: 1.5,
                    borderColor: inputMode === "manual" ? "#007AFF" : "#E5E5EA",
                  }}
                >
                  <Text
                    className="font-semibold text-[13px]"
                    style={{
                      color: inputMode === "manual" ? "#fff" : "#3C3C43",
                    }}
                  >
                    Manual Next
                  </Text>
                </Pressable>
              </View>
              <View style={{ width: twoColCardWidth }}>
                <Pressable
                  onPress={() => setInputMode("camera")}
                  className="py-2.5 rounded-xl items-center flex-row justify-center gap-1.5"
                  style={{
                    backgroundColor:
                      inputMode === "camera" ? "#34C759" : "#fff",
                    borderWidth: 1.5,
                    borderColor: inputMode === "camera" ? "#34C759" : "#E5E5EA",
                  }}
                >
                  <Text style={{ fontSize: 14 }}>📷</Text>
                  <Text
                    className="font-semibold text-[13px]"
                    style={{
                      color: inputMode === "camera" ? "#fff" : "#3C3C43",
                    }}
                  >
                    Camera Next
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View>
            {/* Mode toggle: Manual vs Camera */}
            <View
              className="flex-row justify-between mb-4"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              <View style={{ width: twoColCardWidth }}>
                <Pressable
                  onPress={() => setInputMode("manual")}
                  className="py-3 rounded-xl items-center"
                  style={{
                    backgroundColor:
                      inputMode === "manual" ? "#007AFF" : "#fff",
                    borderWidth: 1.5,
                    borderColor: inputMode === "manual" ? "#007AFF" : "#E5E5EA",
                  }}
                >
                  <Text
                    className="font-semibold text-[14px]"
                    style={{
                      color: inputMode === "manual" ? "#fff" : "#3C3C43",
                    }}
                  >
                    Manual Input
                  </Text>
                </Pressable>
              </View>
              <View style={{ width: twoColCardWidth }}>
                <Pressable
                  onPress={() => setInputMode("camera")}
                  className="py-3 rounded-xl items-center flex-row justify-center gap-1.5"
                  style={{
                    backgroundColor:
                      inputMode === "camera" ? "#34C759" : "#fff",
                    borderWidth: 1.5,
                    borderColor: inputMode === "camera" ? "#34C759" : "#E5E5EA",
                  }}
                >
                  <Text style={{ fontSize: 16 }}>📷</Text>
                  <Text
                    className="font-semibold text-[14px]"
                    style={{
                      color: inputMode === "camera" ? "#fff" : "#3C3C43",
                    }}
                  >
                    Camera AI
                  </Text>
                </Pressable>
              </View>
            </View>

            <GlassCard className="p-5 items-center mb-4">
              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-1">
                Set {setIdx + 1} of {totalSets}
              </Text>
              <Text className="text-[40px] font-bold text-[#007AFF]">
                Target: {totalReps} reps
              </Text>
            </GlassCard>

            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              Reps Completed
            </Text>
            <View className="flex-row items-center gap-3 mb-4">
              <TextInput
                value={repsInput}
                onChangeText={setRepsInput}
                placeholder={String(totalReps)}
                placeholderTextColor="#C6C6C8"
                keyboardType="number-pad"
                className="flex-1 bg-white rounded-xl px-4 py-4 text-[24px] text-black text-center font-bold"
              />
            </View>

            <Pressable
              onPress={logSet}
              disabled={!repsInput}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: repsInput ? "#34C759" : "#C6C6C8" }}
            >
              <Text className="text-white text-[17px] font-bold">
                {setIdx + 1 >= totalSets ? "Finish Exercise" : "Log Set & Rest"}
              </Text>
            </Pressable>

            {/* Previous sets */}
            {currentSets.length > 0 && (
              <View className="mt-4">
                <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  Logged Sets
                </Text>
                <View className="flex-row gap-2">
                  {currentSets.map((s, i) => (
                    <GlassCard key={i} className="flex-1 p-2 items-center">
                      <Text className="text-[11px] text-[#8A8A8E]">
                        Set {s.setNumber}
                      </Text>
                      <Text className="text-[17px] font-bold text-black">
                        {s.actualReps}
                      </Text>
                      <Text className="text-[10px] text-[#8A8A8E]">
                        /{s.targetReps}
                      </Text>
                    </GlassCard>
                  ))}
                </View>
              </View>
            )}

            {/* Tips */}
            {currentExercise.tips?.length > 0 && (
              <View className="mt-4 bg-[#FF950010] rounded-xl p-3">
                {currentExercise.tips.map((tip: string, i: number) => (
                  <Text
                    key={i}
                    className="text-[13px] text-[#FF9500] font-medium"
                  >
                    {tip}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
