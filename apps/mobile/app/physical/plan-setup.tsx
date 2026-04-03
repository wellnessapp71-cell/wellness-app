import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, getAuth } from "@/lib/user-store";
import { api } from "@/lib/api";

type PlanType = "gym" | "yoga";
type Goal = string;

const GYM_GOALS = [
  { value: "muscle_gain", label: "💪 Muscle Gain" },
  { value: "fat_loss", label: "🔥 Fat Loss" },
  { value: "strength", label: "🏋️ Strength" },
  { value: "endurance", label: "🏃 Endurance" },
];

const YOGA_GOALS = [
  { value: "flexibility", label: "🤸 Flexibility" },
  { value: "stress_reduction", label: "🧘 Stress Relief" },
  { value: "strength", label: "💪 Strength" },
  { value: "balance", label: "⚖️ Balance" },
];

const SESSION_LENGTHS = [30, 45, 60];

export default function PlanSetupScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [planType, setPlanType] = useState<PlanType>("gym");
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>(["muscle_gain"]);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 8) / 2);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  const goals = planType === "gym" ? GYM_GOALS : YOGA_GOALS;

  function toggleGoal(g: Goal) {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  async function handleGenerate() {
    if (selectedGoals.length === 0) {
      setError("Please select at least one goal.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const profile = await getProfile();
      const auth = await getAuth();
      const userId = auth?.userId ?? "default";

      let plan: any;
      if (planType === "gym") {
        plan = await api.post<any>("/workout", {
          profile: {
            userId,
            age: profile?.age ?? 28,
            gender: profile?.gender ?? "other",
            currentWeightKg: profile?.currentWeightKg ?? 70,
            hasHomeEquipment: profile?.hasHomeEquipment ?? false,
            hasGymAccess: profile?.hasGymAccess ?? true,
            goals: selectedGoals,
            fitnessLevel: profile?.fitnessLevel ?? "intermediate",
            fitnessSublevel: 2,
          },
          options: { sessionMinutes },
        });
      } else {
        plan = await api.post<any>("/yoga", {
          profile: {
            userId,
            fitnessLevel: profile?.fitnessLevel ?? "intermediate",
            goals: selectedGoals,
          },
          options: { sessionMinutes },
        });
      }

      // Store generated plan for detail screen
      await AsyncStorage.setItem(
        "@aura/last_generated_plan",
        JSON.stringify({ ...plan, planType }),
      );

      router.push("/physical/workout-plan");
    } catch (err: any) {
      setError(
        err?.message ?? "Failed to generate plan. Is the backend running?",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 flex-row items-center gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <Text className="text-[22px] font-bold text-black tracking-tight">
            Build Your Plan
          </Text>
        </View>

        {/* Plan type selector */}
        <View className="mb-6">
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Plan Type
          </Text>
          <View className="flex-row bg-white rounded-2xl p-1 gap-1">
            {(["gym", "yoga"] as PlanType[]).map((t) => (
              <View key={t} style={{ width: twoColCardWidth }}>
                <Pressable
                  onPress={() => {
                    setPlanType(t);
                    setSelectedGoals([]);
                  }}
                  className="py-3 rounded-xl items-center"
                  style={{
                    backgroundColor: planType === t ? "#007AFF" : "transparent",
                  }}
                >
                  <Text
                    className="font-bold text-[16px]"
                    style={{ color: planType === t ? "#fff" : "#8A8A8E" }}
                  >
                    {t === "gym" ? "🏋️ Gym" : "🧘 Yoga"}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        {/* Goals */}
        <View className="mb-6">
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Your Goals
          </Text>
          <View className="gap-2">
            {goals.map((g) => (
              <Pressable
                key={g.value}
                onPress={() => toggleGoal(g.value)}
                className="bg-white rounded-xl px-4 py-3.5 flex-row items-center gap-3"
                style={{
                  borderWidth: 1.5,
                  borderColor: selectedGoals.includes(g.value)
                    ? "#007AFF"
                    : "transparent",
                }}
              >
                <View
                  className="w-5 h-5 rounded-md border-2 items-center justify-center"
                  style={{
                    borderColor: selectedGoals.includes(g.value)
                      ? "#007AFF"
                      : "#C6C6C8",
                    backgroundColor: selectedGoals.includes(g.value)
                      ? "#007AFF"
                      : "transparent",
                  }}
                >
                  {selectedGoals.includes(g.value) && (
                    <Text className="text-white text-[12px] font-bold">✓</Text>
                  )}
                </View>
                <Text className="text-[16px] font-semibold text-black">
                  {g.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Session length */}
        <View className="mb-8">
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Session Length
          </Text>
          <View className="flex-row gap-3 justify-between">
            {SESSION_LENGTHS.map((mins) => (
              <Pressable
                key={mins}
                onPress={() => setSessionMinutes(mins)}
                className="py-4 rounded-xl items-center"
                style={{
                  width: threeColCardWidth,
                  backgroundColor: sessionMinutes === mins ? "#007AFF" : "#fff",
                  borderWidth: 1.5,
                  borderColor: sessionMinutes === mins ? "#007AFF" : "#E5E5EA",
                }}
              >
                <Text
                  className="font-bold text-[18px]"
                  style={{ color: sessionMinutes === mins ? "#fff" : "#000" }}
                >
                  {mins}
                </Text>
                <Text
                  className="text-[12px] font-medium"
                  style={{
                    color: sessionMinutes === mins ? "#ffffff90" : "#8A8A8E",
                  }}
                >
                  min
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {error ? (
          <GlassCard className="p-4 mb-4">
            <Text className="text-[#FF3B30] font-medium text-center">
              {error}
            </Text>
          </GlassCard>
        ) : null}
      </ScrollView>

      {/* Generate CTA */}
      <View className="px-6 pb-6 pt-2">
        {loading ? (
          <GlassCard className="p-4 items-center gap-2 flex-row justify-center">
            <ActivityIndicator color="#007AFF" />
            <Text className="text-[15px] font-medium text-[#8A8A8E]">
              Generating your plan…
            </Text>
          </GlassCard>
        ) : (
          <Pressable
            onPress={handleGenerate}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: "#007AFF" }}
          >
            <Text className="text-white text-[17px] font-semibold">
              Generate {planType === "gym" ? "Workout" : "Yoga"} Plan ✨
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
