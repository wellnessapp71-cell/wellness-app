import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import { savePracticeSession } from "@/lib/spiritual-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import { recalcSpiritualScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";

const TEAL = "#30B0C7";

// ─── Breathing Patterns ─────────────────────────────────────────────────────

interface BreathingPattern {
  name: string;
  description: string;
  phases: { label: string; durationMs: number }[];
}

const PATTERNS: Record<string, BreathingPattern> = {
  "4-7-8": {
    name: "4-7-8 Relaxing",
    description:
      "Inhale 4s · Hold 7s · Exhale 8s — calming for sleep & anxiety",
    phases: [
      { label: "Inhale", durationMs: 4000 },
      { label: "Hold", durationMs: 7000 },
      { label: "Exhale", durationMs: 8000 },
      { label: "Pause", durationMs: 2000 },
    ],
  },
  box: {
    name: "Box Breathing",
    description: "4s each: inhale · hold · exhale · hold — grounding & focus",
    phases: [
      { label: "Inhale", durationMs: 4000 },
      { label: "Hold", durationMs: 4000 },
      { label: "Exhale", durationMs: 4000 },
      { label: "Hold", durationMs: 4000 },
    ],
  },
  calm: {
    name: "Calm Breath",
    description: "Inhale 4s · Hold 4s · Exhale 6s — gentle daily reset",
    phases: [
      { label: "Inhale", durationMs: 4000 },
      { label: "Hold", durationMs: 4000 },
      { label: "Exhale", durationMs: 6000 },
      { label: "Pause", durationMs: 2000 },
    ],
  },
};

const DURATION_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
];

type BreathworkState =
  | "select_pattern"
  | "select_duration"
  | "active"
  | "complete";

export default function SpiritualBreathworkScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fourColWidth = Math.floor((contentWidth - 36) / 4);
  const [state, setState] = useState<BreathworkState>("select_pattern");
  const [patternKey, setPatternKey] = useState("4-7-8");
  const [duration, setDuration] = useState(180);

  // Active state
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const scale = useRef(new Animated.Value(0.5)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const pattern = PATTERNS[patternKey] ?? PATTERNS["4-7-8"];
  const currentPhase = pattern.phases[phaseIdx];
  const isExpanding = currentPhase?.label === "Inhale";
  const isContracting = currentPhase?.label === "Exhale";

  const advancePhase = useCallback(() => {
    setPhaseIdx((prev) => {
      const next = (prev + 1) % pattern.phases.length;
      if (next === 0) setCycleCount((c) => c + 1);
      return next;
    });
  }, [pattern.phases.length]);

  // Animate circle for current phase
  useEffect(() => {
    if (!running) return;

    const targetScale = isExpanding ? 1 : isContracting ? 0.5 : 0.75;

    Animated.timing(scale, {
      toValue: targetScale,
      duration: currentPhase.durationMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(advancePhase, currentPhase.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, phaseIdx]);

  // Elapsed timer + auto-finish
  useEffect(() => {
    if (!running) return;

    startTimeRef.current = Date.now();
    elapsedRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(sec);
      if (sec >= duration) {
        finishSession(sec);
      }
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [running, duration]);

  function startBreathing() {
    setPhaseIdx(0);
    setCycleCount(0);
    setElapsed(0);
    scale.setValue(0.5);
    setRunning(true);
    setState("active");
  }

  async function finishSession(finalElapsed?: number) {
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);

    const durationMinutes = Math.round((finalElapsed ?? elapsed) / 60);

    const session = {
      id: `bp_${Date.now().toString(36)}`,
      type: "breathwork" as const,
      contentId: patternKey,
      durationMinutes: Math.max(1, durationMinutes),
      completedAt: new Date().toISOString(),
      rating: null,
    };

    await savePracticeSession(session);

    try {
      await api.post("/spiritual/practice", session);
    } catch (err) {
      recordFailedSync("breathwork practice sync", err);
    }

    try {
      const score = await recalcSpiritualScore();
      await updateScores({ spiritual: score });
    } catch (err) {
      recordFailedSync("spiritual score recalc after breathwork", err);
    }

    setState("complete");
  }

  function handleBack() {
    if (state === "active") {
      // End early
      finishSession();
    } else if (state === "select_duration") {
      setState("select_pattern");
    } else {
      router.back();
    }
  }

  const remaining = Math.max(0, duration - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={handleBack}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">{state === "active" ? "✕" : "‹"}</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          {state === "complete" ? "Session Complete" : "Breathwork"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* ── Pattern selection ── */}
        {state === "select_pattern" && (
          <View className="pt-4 pb-10">
            <Text style={{ fontSize: 48, textAlign: "center" }}>🌬️</Text>
            <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4 mb-1">
              Choose a Pattern
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-6">
              Each pattern targets a different need.
            </Text>

            {Object.entries(PATTERNS).map(([key, p]) => {
              const active = patternKey === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setPatternKey(key)}
                  className="mb-3"
                >
                  <GlassCard
                    className="p-4 flex-row items-center gap-3"
                    style={
                      active ? { borderWidth: 2, borderColor: TEAL } : undefined
                    }
                  >
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: TEAL + "15" }}
                    >
                      <Text style={{ fontSize: 20 }}>🌬️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-black">
                        {p.name}
                      </Text>
                      <Text className="text-[12px] text-[#8A8A8E] mt-0.5">
                        {p.description}
                      </Text>
                    </View>
                    {active && (
                      <Text className="font-bold" style={{ color: TEAL }}>
                        ✓
                      </Text>
                    )}
                  </GlassCard>
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setState("select_duration")}
              className="rounded-2xl py-4 items-center mt-4"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white text-[17px] font-semibold">Next</Text>
            </Pressable>
          </View>
        )}

        {/* ── Duration selection ── */}
        {state === "select_duration" && (
          <View className="pt-4 pb-10">
            <Text className="text-[22px] font-bold text-black tracking-tight text-center mb-2">
              How long?
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-6">
              {pattern.name} — pick your session length.
            </Text>

            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {DURATION_OPTIONS.map((opt) => {
                const active = duration === opt.seconds;
                return (
                  <View key={opt.seconds} style={{ width: fourColWidth }}>
                    <Pressable
                      onPress={() => setDuration(opt.seconds)}
                      className="py-4 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="text-[16px] font-bold"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={startBreathing}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white text-[17px] font-semibold">
                Start Breathing
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Active breathing ── */}
        {state === "active" && (
          <View className="items-center pt-8 pb-10">
            {/* Pattern name */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              {pattern.name}
            </Text>

            {/* Timer */}
            <Text className="text-[32px] font-bold text-black mb-6">
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>

            {/* Breathing circle */}
            <View
              className="items-center justify-center mb-6"
              style={{ width: 220, height: 220 }}
            >
              <Animated.View
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: TEAL + "20",
                  borderWidth: 3,
                  borderColor: TEAL,
                  transform: [{ scale }],
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-[22px] font-bold" style={{ color: TEAL }}>
                  {currentPhase.label}
                </Text>
              </Animated.View>
            </View>

            {/* Cycle count */}
            <Text className="text-[13px] text-[#8A8A8E] mb-6">
              Cycle {cycleCount + 1}
            </Text>

            {/* End early */}
            <Pressable
              onPress={() => finishSession()}
              className="w-full rounded-2xl py-4 items-center bg-[#FF3B30]"
            >
              <Text className="text-white text-[17px] font-semibold">
                End Early
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Complete ── */}
        {state === "complete" && (
          <View className="items-center pt-10 pb-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4 mb-2">
              Breathwork Complete
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-2">
              {pattern.name} · {cycleCount} cycle{cycleCount !== 1 ? "s" : ""}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mb-8">
              Session logged to your practice history.
            </Text>

            <Pressable
              onPress={() => {
                setState("select_pattern");
                setElapsed(0);
                setCycleCount(0);
              }}
              className="w-full rounded-2xl py-4 items-center mb-3"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white text-[17px] font-semibold">
                Try Another Pattern
              </Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <Text
                className="text-[15px] font-medium mt-2"
                style={{ color: TEAL }}
              >
                Return to Hub
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
