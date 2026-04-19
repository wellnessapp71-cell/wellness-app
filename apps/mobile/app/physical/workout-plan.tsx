import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getActiveWorkoutPlan } from "@/lib/plan-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const BODY_PART_COLORS: Record<string, string> = {
  chest: "#007AFF",
  back: "#34C759",
  legs: "#FF9500",
  arms: "#AF52DE",
  shoulders: "#30B0C7",
  core: "#FF2D55",
  cardio: "#FF9500",
  full_body: "#8E8E93",
};

export default function WorkoutPlanScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const [plan, setPlan] = useState<any>(null);
  const [planType, setPlanType] = useState<string>("gym");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        let stored: any = null;

        // 1. Deep link: fetch from backend by planId
        if (planId) {
          try {
            const remote = await api.get<any>(`/plans/${planId}`);
            if (remote?.content) {
              stored = typeof remote.content === "string"
                ? JSON.parse(remote.content)
                : remote.content;
            }
          } catch (err) {
            recordFailedSync("fetch plan by id", err);
          }
        }

        // 2. Fall back to plan-store (active plan)
        if (!stored) {
          const active = await getActiveWorkoutPlan();
          if (active?.content) {
            stored = active.content;
            if (!planId) setActivePlanId(active.planId);
          }
        }
        if (planId) setActivePlanId(planId);

        // 3. Fall back to last generated plan (legacy)
        if (!stored) {
          const raw = await AsyncStorage.getItem("@aura/last_generated_plan");
          stored = raw ? JSON.parse(raw) : null;
        }

        setPlan(stored);
        setPlanType(stored?.planType ?? "gym");
        // Auto-select first available day
        if (stored?.sessions) {
          const firstDay = Object.keys(stored.sessions)[0];
          setSelectedDay(firstDay ?? null);
        } else if (stored?.weekSessions || stored?.schedule) {
          const firstDay = Object.keys(stored.weekSessions ?? stored.schedule ?? {})[0];
          setSelectedDay(firstDay ?? null);
        }
        setLoading(false);
      })();
    }, [planId])
  );

  async function submitFeedback() {
    if (!activePlanId || feedbackRating === 0) return;
    setSubmittingFeedback(true);
    try {
      await api.post(`/plans/${activePlanId}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment || undefined,
        wouldRecommend: feedbackRating >= 4,
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      recordFailedSync("submit plan feedback", err);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7] items-center justify-center">
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7]">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[17px] text-[#8A8A8E] text-center">
            No plan found. Go back and generate one!
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 bg-[#007AFF] px-6 py-3 rounded-2xl"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Normalise sessions for both workout & yoga
  const sessions: Record<string, any> =
    plan.sessions ?? plan.weekSessions ?? plan.schedule ?? {};
  const days = Object.keys(sessions);
  const currentSession = selectedDay ? sessions[selectedDay] : null;

  // For yoga: poses array; for gym: exercises array
  const items: any[] =
    currentSession?.exercises ??
    currentSession?.poses ??
    currentSession?.flow ??
    [];

  const isYoga = planType === "yoga";
  const totalCal = plan.totalCaloriesTarget ?? plan.estimatedCaloriesBurned ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <View className="flex-1 mx-3">
          <Text className="text-[20px] font-bold text-black tracking-tight">
            {isYoga ? "🧘 Yoga Plan" : "🏋️ Workout Plan"}
          </Text>
          <Text className="text-[13px] text-[#8A8A8E]">
            {days.length} sessions · {totalCal > 0 ? `~${totalCal} kcal/week` : ""}
          </Text>
        </View>
        <Pressable
          onPress={() => router.replace("/physical/plan-setup")}
          className="bg-[#007AFF15] px-3 py-1.5 rounded-full"
        >
          <Text className="text-[#007AFF] font-semibold text-[13px]">Redo</Text>
        </Pressable>
      </View>

      {/* Day picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="pl-6 mb-4"
        style={{ flexGrow: 0 }}
      >
        {days.map((day) => {
          const session = sessions[day];
          const focus = session?.focus ?? session?.type ?? "";
          const isSelected = selectedDay === day;
          return (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              className="mr-3 items-center"
            >
              <View
                className="w-14 h-14 rounded-2xl items-center justify-center mb-1"
                style={{
                  backgroundColor: isSelected
                    ? (isYoga ? "#AF52DE" : "#007AFF")
                    : "#fff",
                  borderWidth: 1.5,
                  borderColor: isSelected
                    ? (isYoga ? "#AF52DE" : "#007AFF")
                    : "#E5E5EA",
                }}
              >
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: isSelected ? "#fff" : "#000" }}
                >
                  {DAY_LABELS[day] ?? day.slice(0, 3)}
                </Text>
              </View>
              <Text
                className="text-[10px] font-semibold uppercase"
                style={{ color: isSelected ? (isYoga ? "#AF52DE" : "#007AFF") : "#8A8A8E" }}
                numberOfLines={1}
              >
                {focus?.replace("_", " ") ?? "Rest"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Session detail */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {currentSession ? (
          <View>
            {/* Session header */}
            <GlassCard className="p-4 mb-4 flex-row justify-between items-center">
              <View>
                <Text className="text-[18px] font-bold text-black capitalize">
                  {currentSession.focus?.replace("_", " ") ?? currentSession.type ?? "Session"}
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mt-0.5">
                  {currentSession.durationMinutes ?? 45} min
                  {currentSession.estimatedCaloriesBurned
                    ? ` · ~${currentSession.estimatedCaloriesBurned} kcal`
                    : ""}
                </Text>
              </View>
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: (isYoga ? "#AF52DE" : "#007AFF") + "20" }}
              >
                <Text
                  className="font-semibold text-[13px]"
                  style={{ color: isYoga ? "#AF52DE" : "#007AFF" }}
                >
                  {currentSession.durationMinutes ?? 45} min
                </Text>
              </View>
            </GlassCard>

            {/* Start workout button (gym only) */}
            {!isYoga && items.length > 0 && (
              <Pressable
                onPress={() => router.push("/physical/workout-session")}
                className="bg-[#34C759] rounded-2xl py-4 items-center mb-4"
              >
                <Text className="text-white text-[17px] font-bold">Start Workout Session</Text>
              </Pressable>
            )}

            {/* Exercises / poses */}
            {items.length === 0 ? (
              <GlassCard className="p-4 items-center">
                <Text className="text-[#8A8A8E]">Rest day — no exercises.</Text>
              </GlassCard>
            ) : (
              <View className="gap-3 mb-10">
                {items.map((item: any, idx: number) => {
                  const name = item.name ?? item.poseName ?? `Exercise ${idx + 1}`;
                  const sets = item.sets;
                  const reps = item.reps;
                  const metric = item.metric ?? "reps";
                  const duration = item.durationSeconds ?? item.holdSeconds;
                  const bodyParts: string[] = item.bodyParts ?? item.benefits ?? [];
                  const instructions: string[] = item.instructions ?? [];
                  const tips: string[] = item.tips ?? [];
                  const cpm = item.caloriesPerMinute;

                  return (
                    <GlassCard key={idx} className="p-4">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1 mr-3">
                          <Text className="text-[17px] font-bold text-black tracking-tight">
                            {name}
                          </Text>
                          {sets && reps && (
                            <Text className="text-[14px] text-[#8A8A8E] mt-0.5">
                              {sets} sets × {reps} {metric === "seconds" ? "sec" : "reps"}
                            </Text>
                          )}
                          {duration && !sets && (
                            <Text className="text-[14px] text-[#8A8A8E] mt-0.5">
                              {duration}s hold
                            </Text>
                          )}
                        </View>
                        {cpm && (
                          <View className="bg-[#FF950020] px-2 py-1 rounded-lg">
                            <Text className="text-[11px] font-bold text-[#FF9500]">
                              {cpm} kcal/min
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Body part chips */}
                      {bodyParts.length > 0 && (
                        <View className="flex-row flex-wrap gap-1.5 mb-2">
                          {bodyParts.map((bp: string) => (
                            <View
                              key={bp}
                              className="px-2 py-0.5 rounded"
                              style={{
                                backgroundColor:
                                  (BODY_PART_COLORS[bp] ?? "#8E8E93") + "20",
                              }}
                            >
                              <Text
                                className="text-[11px] font-semibold capitalize"
                                style={{ color: BODY_PART_COLORS[bp] ?? "#8E8E93" }}
                              >
                                {bp.replace("_", " ")}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Instructions */}
                      {instructions.length > 0 && (
                        <View className="mt-2">
                          {instructions.map((inst: string, i: number) => (
                            <View key={i} className="flex-row gap-2 mb-1">
                              <Text className="text-[#007AFF] font-bold text-[13px]">{i + 1}.</Text>
                              <Text className="text-[13px] text-[#3C3C43] flex-1">{inst}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Tips */}
                      {tips.length > 0 && (
                        <View className="mt-2 bg-[#FF950010] rounded-xl p-3">
                          {tips.map((tip: string, i: number) => (
                            <Text key={i} className="text-[13px] text-[#FF9500] font-medium">
                              💡 {tip}
                            </Text>
                          ))}
                        </View>
                      )}
                    </GlassCard>
                  );
                })}
              </View>
            )}

            {/* Generate New Plan */}
            <Pressable
              onPress={() => router.push("/physical/plan-setup")}
              className="mb-4"
            >
              <GlassCard className="p-4 flex-row items-center justify-center gap-2">
                <Text className="text-[15px] font-semibold text-[#007AFF]">
                  Generate New Plan
                </Text>
              </GlassCard>
            </Pressable>

            {/* Rate This Plan */}
            {activePlanId && (
              <GlassCard className="p-5 mb-10">
                {feedbackSubmitted ? (
                  <View className="items-center py-2">
                    <Text className="text-[17px] font-bold text-[#34C759]">Thanks for your feedback!</Text>
                    <Text className="text-[13px] text-[#8A8A8E] mt-1">Your rating helps us improve.</Text>
                  </View>
                ) : (
                  <View>
                    <Text className="text-[15px] font-bold text-black mb-3">Rate This Plan</Text>
                    <View className="flex-row gap-2 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable key={star} onPress={() => setFeedbackRating(star)}>
                          <Text style={{ fontSize: 28 }}>
                            {star <= feedbackRating ? "★" : "☆"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <TextInput
                      placeholder="Any comments? (optional)"
                      value={feedbackComment}
                      onChangeText={setFeedbackComment}
                      multiline
                      className="bg-[#F2F2F7] rounded-xl p-3 text-[14px] text-black mb-3"
                      style={{ minHeight: 60, textAlignVertical: "top" }}
                      placeholderTextColor="#8A8A8E"
                    />
                    <Pressable
                      onPress={submitFeedback}
                      disabled={feedbackRating === 0 || submittingFeedback}
                      className="rounded-xl py-3 items-center"
                      style={{
                        backgroundColor: feedbackRating > 0 ? "#1C1C1E" : "#D1D1D6",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: feedbackRating > 0 ? 0.15 : 0,
                        shadowRadius: 8,
                        elevation: feedbackRating > 0 ? 3 : 0,
                      }}
                    >
                      <Text
                        className="font-semibold text-[15px]"
                        style={{ color: feedbackRating > 0 ? "#fff" : "#8A8A8E" }}
                      >
                        {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </GlassCard>
            )}
          </View>
        ) : (
          <GlassCard className="p-6 items-center">
            <Text className="text-[#8A8A8E]">Select a day above to see exercises.</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
