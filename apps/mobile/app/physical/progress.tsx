import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getWeightHistory,
  getSessionLogs,
  type WeightEntryLocal,
  type SessionLogRef,
} from "@/lib/onboarding-store";
import { getProfile } from "@/lib/user-store";
import type { UserProfile } from "@/lib/user-store";
import { getStreakRewards, getMotivationalMessage } from "@/lib/fitness-engine";

export default function ProgressDashboardScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntryLocal[]>([]);
  const [sessions, setSessions] = useState<SessionLogRef[]>([]);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [p, wh, sl] = await Promise.all([
          getProfile(),
          getWeightHistory(),
          getSessionLogs(),
        ]);
        setProfile(p);
        setWeightHistory(wh);
        setSessions(sl);
      })();
    }, []),
  );

  const fitnessLevel = profile?.fitnessLevel ?? "intermediate";
  const streakDays = profile?.streakDays ?? 0;
  const totalWorkouts = profile?.totalWorkouts ?? 0;
  const totalCaloriesBurned = profile?.totalCaloriesBurned ?? 0;

  const streakRewards = getStreakRewards(streakDays);
  const motivationalMessage = getMotivationalMessage({
    streakDays,
    fitnessLevel: fitnessLevel as any,
  });

  // Weekly sessions (last 7 days)
  const now = Date.now();
  const weekSessions = sessions.filter(
    (s) => now - new Date(s.dateIso).getTime() < 7 * 86400000,
  );
  const weekCompletion =
    weekSessions.length > 0
      ? Math.round(
          weekSessions.reduce((sum, s) => sum + s.completionPercent, 0) /
            weekSessions.length,
        )
      : 0;

  // Weight chart data
  const recentWeights = weightHistory.slice(-14);
  const minW =
    recentWeights.length > 0
      ? Math.min(...recentWeights.map((e) => e.weightKg))
      : 0;
  const maxW =
    recentWeights.length > 0
      ? Math.max(...recentWeights.map((e) => e.weightKg))
      : 100;
  const rangeW = Math.max(1, maxW - minW);

  // Day-by-day activity (last 7 days)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().split("T")[0];
    const daySessions = sessions.filter((s) => s.dateIso === iso);
    return {
      label: dayNames[d.getDay()],
      date: iso,
      count: daySessions.length,
      avgCompletion:
        daySessions.length > 0
          ? Math.round(
              daySessions.reduce((s, x) => s + x.completionPercent, 0) /
                daySessions.length,
            )
          : 0,
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          Progress Dashboard
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Motivational */}
        <GlassCard
          className="p-4 mt-4 mb-4"
          style={{ backgroundColor: "#007AFF08" }}
        >
          <Text className="text-[14px] text-[#007AFF] font-medium italic">
            "{motivationalMessage}"
          </Text>
        </GlassCard>

        {/* Key Stats */}
        <View className="flex-row gap-3 mb-4 justify-between">
          <View style={{ width: threeColCardWidth }}>
            <GlassCard className="p-4 items-center">
              <Text className="text-[28px] font-bold text-[#FF9500]">
                {streakDays}
              </Text>
              <Text className="text-[11px] text-[#8A8A8E] font-semibold uppercase mt-1">
                Day Streak
              </Text>
            </GlassCard>
          </View>
          <View style={{ width: threeColCardWidth }}>
            <GlassCard className="p-4 items-center">
              <Text className="text-[28px] font-bold text-[#007AFF]">
                {totalWorkouts}
              </Text>
              <Text className="text-[11px] text-[#8A8A8E] font-semibold uppercase mt-1">
                Workouts
              </Text>
            </GlassCard>
          </View>
          <View style={{ width: threeColCardWidth }}>
            <GlassCard className="p-4 items-center">
              <Text className="text-[28px] font-bold text-[#FF2D55]">
                {totalCaloriesBurned}
              </Text>
              <Text className="text-[11px] text-[#8A8A8E] font-semibold uppercase mt-1">
                Calories
              </Text>
            </GlassCard>
          </View>
        </View>

        {/* Weekly completion */}
        <GlassCard className="p-4 mb-4">
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
            This Week
          </Text>
          <View className="flex-row items-center gap-3">
            <Text className="text-[28px] font-bold text-black">
              {weekCompletion}%
            </Text>
            <View className="flex-1">
              <View className="h-3 bg-[#E5E5EA] rounded-full overflow-hidden">
                <View
                  className="h-3 rounded-full bg-[#34C759]"
                  style={{ width: `${weekCompletion}%` }}
                />
              </View>
            </View>
            <Text className="text-[13px] text-[#8A8A8E]">
              {weekSessions.length} sessions
            </Text>
          </View>
        </GlassCard>

        {/* 7-Day Activity */}
        <GlassCard className="p-4 mb-4">
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            7-Day Activity
          </Text>
          <View className="flex-row gap-2 items-end h-[80px]">
            {last7Days.map((day, i) => {
              const height =
                day.count > 0
                  ? Math.max(20, (day.avgCompletion / 100) * 70)
                  : 8;
              return (
                <View key={i} className="flex-1 items-center">
                  <View
                    className="w-full rounded-t-lg"
                    style={{
                      height,
                      backgroundColor: day.count > 0 ? "#007AFF" : "#E5E5EA",
                      borderRadius: 4,
                    }}
                  />
                  <Text className="text-[10px] text-[#8A8A8E] mt-1 font-semibold">
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Weight Trend */}
        {recentWeights.length >= 2 && (
          <GlassCard className="p-4 mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
                Weight Trend
              </Text>
              <Pressable onPress={() => router.push("/physical/weight-log")}>
                <Text className="text-[13px] text-[#007AFF] font-medium">
                  View All
                </Text>
              </Pressable>
            </View>
            <View className="h-[80px] flex-row items-end gap-1">
              {recentWeights.map((e, i) => {
                const pct = ((e.weightKg - minW) / rangeW) * 100;
                const h = Math.max(8, (pct / 100) * 70);
                return (
                  <View key={i} className="flex-1 items-center">
                    <View
                      className="w-full"
                      style={{
                        height: h,
                        backgroundColor:
                          i === recentWeights.length - 1
                            ? "#AF52DE"
                            : "#AF52DE60",
                        borderRadius: 3,
                      }}
                    />
                  </View>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-[10px] text-[#8A8A8E]">
                {minW.toFixed(1)}kg
              </Text>
              <Text className="text-[10px] text-[#8A8A8E]">
                {maxW.toFixed(1)}kg
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Streak Rewards */}
        <Text className="text-[17px] font-bold text-black tracking-tight mb-3">
          Streak Rewards
        </Text>
        <View className="gap-2 mb-4">
          {streakRewards.map(
            (reward: {
              streakDays: number;
              title: string;
              description: string;
              coins: number;
              unlocked: boolean;
            }) => (
              <GlassCard
                key={reward.streakDays}
                className="p-3 flex-row items-center gap-3"
                style={{ opacity: reward.unlocked ? 1 : 0.5 }}
              >
                <Text style={{ fontSize: 24 }}>
                  {reward.unlocked ? "🏆" : "🔒"}
                </Text>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-black">
                    {reward.title}
                  </Text>
                  <Text className="text-[12px] text-[#8A8A8E]">
                    {reward.description}
                  </Text>
                </View>
                <Text className="text-[13px] font-bold text-[#FF9500]">
                  {reward.coins} coins
                </Text>
              </GlassCard>
            ),
          )}
        </View>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <>
            <Text className="text-[17px] font-bold text-black tracking-tight mb-3">
              Recent Sessions
            </Text>
            <View className="gap-2 mb-10">
              {sessions
                .slice(-10)
                .reverse()
                .map((s, i) => (
                  <GlassCard
                    key={i}
                    className="p-3 flex-row justify-between items-center"
                  >
                    <View>
                      <Text className="text-[15px] font-semibold text-black capitalize">
                        {s.focus?.replace("_", " ") ?? s.day}
                      </Text>
                      <Text className="text-[12px] text-[#8A8A8E]">
                        {s.dateIso} · {s.durationMinutes}min ·{" "}
                        {s.caloriesBurned} kcal
                      </Text>
                    </View>
                    <Text
                      className="text-[15px] font-bold"
                      style={{
                        color:
                          s.completionPercent >= 80
                            ? "#34C759"
                            : s.completionPercent >= 50
                              ? "#FF9500"
                              : "#FF3B30",
                      }}
                    >
                      {s.completionPercent}%
                    </Text>
                  </GlassCard>
                ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
