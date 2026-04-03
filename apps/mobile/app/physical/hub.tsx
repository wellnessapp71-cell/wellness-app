import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { getProfile } from "@/lib/user-store";
import type { UserProfile } from "@/lib/user-store";
import {
  generateFitnessTag,
  calculateMacroRequirements,
  projectGoal,
  getRecoverySuggestion,
  getStreakRewards,
  getMotivationalMessage,
} from "@/lib/fitness-engine";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import {
  ChevronLeft,
  Flame,
  Dumbbell,
  Zap,
  Footprints,
  CalendarDays,
  Droplets,
  ClipboardCheck,
  Scale,
  Activity,
  ChevronRight,
  Utensils,
} from "lucide-react-native";

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#34C759",
  intermediate: "#FF9500",
  advanced: "#FF2D55",
  expert: "#AF52DE",
};

const RECOVERY_COLORS: Record<string, string> = {
  rest: "#FF3B30",
  active_recovery: "#FF9500",
  light_workout: "#FFCC00",
  normal: "#34C759",
};

export default function PhysicalHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const p = await getProfile();
        setProfileState(p);
      })();
    }, []),
  );

  const physicalScore = profile?.scorePhysical ?? 50;
  const fitnessLevel = profile?.fitnessLevel ?? "intermediate";
  const activityLevel = profile?.activityLevel ?? "moderate";
  const exerciseDays = profile?.exerciseDaysPerWeek ?? 3;
  const waterGlasses = profile?.waterGlassesPerDay ?? 6;
  const streakDays = profile?.streakDays ?? 0;
  const totalWorkouts = profile?.totalWorkouts ?? 0;
  const totalCaloriesBurned = profile?.totalCaloriesBurned ?? 0;

  const levelColor = LEVEL_COLORS[fitnessLevel] ?? "#FF2D55";

  const fitnessTag = generateFitnessTag({
    fitnessLevel: fitnessLevel as any,
    goals: ["fat_loss"],
    hasGymAccess: profile?.hasGymAccess ?? false,
    hasHomeEquipment: profile?.hasHomeEquipment ?? false,
  });

  const weightKg = profile?.currentWeightKg ?? 70;
  const targetWeightKg = profile?.targetWeightKg ?? weightKg;
  const macros = calculateMacroRequirements({
    weightKg,
    heightCm: profile?.heightCm ?? 170,
    age: profile?.age ?? 28,
    gender: (profile?.gender as any) ?? "other",
    activityLevel,
    goal:
      targetWeightKg < weightKg
        ? "lose"
        : targetWeightKg > weightKg
          ? "gain"
          : "maintain",
  });

  const goalProjection =
    targetWeightKg !== weightKg
      ? projectGoal({
          goalType: targetWeightKg < weightKg ? "weight_loss" : "weight_gain",
          currentWeightKg: weightKg,
          targetWeightKg,
          weeklyDeficitOrSurplus: targetWeightKg < weightKg ? -3500 : 3500,
        })
      : null;

  const recoverySuggestion = getRecoverySuggestion({
    lastCheckIn: null as any,
    streakDays,
    recentSessionsCount: 0,
    lastSessionCompletionPercent: undefined,
  });

  const recoveryColor = RECOVERY_COLORS[recoverySuggestion.type] ?? "#34C759";

  const motivationalMessage = getMotivationalMessage({
    streakDays,
    fitnessLevel: fitnessLevel as any,
  });

  const streakRewards = getStreakRewards(streakDays);
  const nextReward = streakRewards.find(
    (r: { unlocked: boolean }) => !r.unlocked,
  );

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFAFC]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          className="pt-6 flex-row items-center justify-between mb-8"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </Pressable>
          <View
            className="px-4 py-1.5 rounded-full border"
            style={{
              backgroundColor: levelColor + "15",
              borderColor: levelColor + "30",
            }}
          >
            <Text
              className="font-bold text-[12px] uppercase tracking-widest"
              style={{ color: levelColor }}
            >
              {fitnessLevel}
            </Text>
          </View>
        </Animated.View>

        {/* Title + score */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(800).springify()}
          className="mb-6"
        >
          <Text className="text-[34px] font-bold text-[#1C1C1E] tracking-tight leading-tight">
            Physical
          </Text>
          <Text
            className="text-[34px] font-bold tracking-tight leading-tight"
            style={{ color: "#FF2D55" }}
          >
            Wellbeing
          </Text>
          <View className="flex-row items-center gap-3 mt-3">
            <Text className="text-[17px] text-[#8A8A8E] font-medium">
              Your score
            </Text>
            <View className="bg-[#FF2D55] px-3 py-1 rounded-full shadow-sm shadow-[#FF2D55]/30">
              <Text className="text-white font-bold text-[15px] tracking-wide">
                {physicalScore}
                <Text className="text-white/70">/100</Text>
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Fitness Tag */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-6"
        >
          <GlassCard className="p-5 border border-black/5 bg-white/60">
            <Text className="text-[11px] font-bold text-[#FF2D55] uppercase tracking-widest mb-1.5">
              Fitness Tag
            </Text>
            <Text className="text-[18px] font-bold text-[#1C1C1E] leading-snug">
              {fitnessTag.label}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Motivational message */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard
            className="p-5"
            style={{
              backgroundColor: "#FF2D5508",
              borderColor: "#FF2D5520",
              borderWidth: 1,
            }}
          >
            <Text className="text-[15px] text-[#FF2D55] font-semibold italic leading-relaxed text-center">
              "{motivationalMessage}"
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Stats row */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify()}
          className="flex-row gap-3 mb-3 justify-between"
        >
          {[
            {
              label: "Streak",
              value: `${streakDays}d`,
              Icon: Flame,
              color: "#FF9500",
            },
            {
              label: "Workouts",
              value: `${totalWorkouts}`,
              Icon: Dumbbell,
              color: "#AF52DE",
            },
            {
              label: "Burned",
              value: `${totalCaloriesBurned}`,
              Icon: Zap,
              color: "#FFCC00",
            },
          ].map((stat) => {
            const IconComp = stat.Icon;
            return (
              <View key={stat.label} style={{ width: threeColCardWidth }}>
                <GlassCard className="p-4 border border-black/5 bg-white/60 items-center">
                  <IconComp
                    size={22}
                    color={stat.color}
                    strokeWidth={2.5}
                    className="mb-2"
                  />
                  <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-1">
                    {stat.label}
                  </Text>
                  <Text className="text-[18px] font-bold text-[#1C1C1E]">
                    {stat.value}
                  </Text>
                </GlassCard>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(350).duration(800).springify()}
          className="flex-row gap-3 mb-8 justify-between"
        >
          {[
            {
              label: "Activity",
              value: activityLevel.replace("_", " "),
              Icon: Footprints,
              color: "#FF2D55",
            },
            {
              label: "Exercise",
              value: `${exerciseDays}/wk`,
              Icon: CalendarDays,
              color: "#007AFF",
            },
            {
              label: "Water",
              value: `${waterGlasses}g`,
              Icon: Droplets,
              color: "#5AC8FA",
            },
          ].map((stat) => {
            const IconComp = stat.Icon;
            return (
              <View key={stat.label} style={{ width: threeColCardWidth }}>
                <GlassCard className="p-4 border border-black/5 bg-white/60 items-center">
                  <IconComp
                    size={22}
                    color={stat.color}
                    strokeWidth={2.5}
                    className="mb-2"
                  />
                  <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-1">
                    {stat.label}
                  </Text>
                  <Text
                    className="text-[14px] font-bold text-[#1C1C1E] capitalize"
                    numberOfLines={1}
                  >
                    {stat.value}
                  </Text>
                </GlassCard>
              </View>
            );
          })}
        </Animated.View>

        {/* Macro Targets */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800).springify()}
          className="mb-6"
        >
          <GlassCard className="p-5 border border-black/5 bg-white/60">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-[12px] font-bold text-[#FF9500] uppercase tracking-widest">
                Daily Targets
              </Text>
              <Text className="text-[24px] font-bold text-[#1C1C1E]">
                {macros.calories}{" "}
                <Text className="text-[14px] text-[#8A8A8E]">kcal</Text>
              </Text>
            </View>
            <View className="flex-row justify-between bg-[#FAFAFC] p-3 rounded-2xl border border-black/[0.03]">
              {[
                {
                  label: "Protein",
                  value: `${macros.proteinGrams}g`,
                  color: "#007AFF",
                },
                {
                  label: "Carbs",
                  value: `${macros.carbsGrams}g`,
                  color: "#FF9500",
                },
                {
                  label: "Fat",
                  value: `${macros.fatGrams}g`,
                  color: "#FF2D55",
                },
              ].map((m) => (
                <View key={m.label} className="flex-row items-center gap-2">
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <Text className="text-[14px] text-[#1C1C1E] font-bold">
                    {m.value}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Recovery Suggestion */}
        <Animated.View
          entering={FadeInDown.delay(450).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard
            className="p-5 overflow-hidden border border-black/5 bg-white/60"
            style={{ borderLeftWidth: 4, borderLeftColor: recoveryColor }}
          >
            <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-1.5">
              Recovery Status
            </Text>
            <Text className="text-[18px] font-bold text-[#1C1C1E] mb-1">
              {recoverySuggestion.title}
            </Text>
            <Text className="text-[14px] text-[#3C3C43] leading-5">
              {recoverySuggestion.description}
            </Text>
            {recoverySuggestion.suggestedActivity && (
              <View className="mt-3 bg-black/5 p-2.5 rounded-xl">
                <Text className="text-[13px] text-[#1C1C1E] font-semibold text-center">
                  💡 {recoverySuggestion.suggestedActivity}
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3 justify-between">
            <Pressable
              onPress={() => router.push("/physical/checkin")}
              style={{ width: threeColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <ClipboardCheck size={28} color="#FF9500" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-0.5">
                  Check-in
                </Text>
                <Text className="text-[11px] text-[#8A8A8E]">Daily mood</Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/physical/weight-log")}
              style={{ width: threeColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Scale size={28} color="#007AFF" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-0.5">
                  Weight
                </Text>
                <Text className="text-[11px] text-[#8A8A8E]">Track body</Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/physical/progress")}
              style={{ width: threeColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Activity size={28} color="#FF2D55" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-0.5">
                  Dashboard
                </Text>
                <Text className="text-[11px] text-[#8A8A8E]">Full stats</Text>
              </GlassCard>
            </Pressable>
          </View>
        </Animated.View>

        {/* Plan options */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800).springify()}
          className="mb-10"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Build Your Plan
          </Text>

          <Pressable
            onPress={() => router.push("/physical/plan-setup")}
            className="mb-4"
          >
            <GlassCard className="p-5 flex-row items-center gap-4 bg-white/60 border border-black/5 shadow-sm shadow-black/5">
              <View className="w-14 h-14 rounded-2xl items-center justify-center bg-[#FF2D55]/10">
                <Dumbbell size={28} color="#FF2D55" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-0.5">
                  Workout Plan
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mb-2 leading-tight">
                  Tailored weekly routine based on your goals
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {["Library", "Schedule", "Sets"].map((tag) => (
                    <View
                      key={tag}
                      className="bg-[#FF2D55]/10 px-2 py-1 rounded-[6px]"
                    >
                      <Text className="text-[10px] font-bold text-[#FF2D55] uppercase">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <ChevronRight size={24} color="#D1D1D6" />
            </GlassCard>
          </Pressable>

          <Pressable onPress={() => router.push("/physical/nutrition-setup")}>
            <GlassCard className="p-5 flex-row items-center gap-4 bg-white/60 border border-black/5 shadow-sm shadow-black/5">
              <View className="w-14 h-14 rounded-2xl items-center justify-center bg-[#34C759]/10">
                <Utensils size={28} color="#34C759" strokeWidth={2} />
              </View>
              <View className="flex-1">
                <Text className="text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-0.5">
                  Nutrition Plan
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mb-2 leading-tight">
                  Calorie targets, macros & meal ideas
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {["Macros", "Goals", "Meals"].map((tag) => (
                    <View
                      key={tag}
                      className="bg-[#34C759]/10 px-2 py-1 rounded-[6px]"
                    >
                      <Text className="text-[10px] font-bold text-[#34C759] uppercase">
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <ChevronRight size={24} color="#D1D1D6" />
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Redo assessment */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(800).springify()}
        >
          <Pressable
            onPress={() => router.push("/physical/questionnaire")}
            className="mb-6 items-center"
          >
            <Text className="text-[15px] text-[#1C1C1E] font-semibold opacity-60">
              Redo Fitness Assessment
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
