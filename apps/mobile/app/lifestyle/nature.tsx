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
import {
  getNatureLogs,
  getRoutineCompletions,
  getLifestyleBaseline,
  getLifestyleCheckIns,
} from "@/lib/lifestyle-store";
import type {
  NatureLog,
  RoutineCompletion,
  LifestyleBaseline,
} from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Leaf,
  Sun,
  TreePine,
  Plus,
  CheckCircle2,
} from "lucide-react-native";

const THEME = "#34C759";

export default function NatureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [todayOutdoorMin, setTodayOutdoorMin] = useState(0);
  const [weekOutdoorDays, setWeekOutdoorDays] = useState(0);
  const [recentNatureLogs, setRecentNatureLogs] = useState<NatureLog[]>([]);
  const [todayRoutines, setTodayRoutines] = useState<RoutineCompletion[]>([]);
  const [routineStreak, setRoutineStreak] = useState(0);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  const todayDate = new Date().toISOString().split("T")[0];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        // Nature logs
        const natureLogs = await getNatureLogs();
        const todayNature = natureLogs.filter((l) => l.date === todayDate);
        setTodayOutdoorMin(
          todayNature.reduce((s, l) => s + l.outdoorMinutes, 0),
        );
        setRecentNatureLogs(natureLogs.slice(-14).reverse());

        // Weekly outdoor days from check-ins
        const checkIns = await getLifestyleCheckIns();
        const recent = checkIns.slice(-7);
        setWeekOutdoorDays(recent.filter((c) => c.gotOutdoors).length);

        // Routine completions
        const routines = await getRoutineCompletions();
        setTodayRoutines(routines.filter((r) => r.date === todayDate));

        // Compute streak
        const completedRoutines = routines.filter((r) => r.completed);
        if (completedRoutines.length > 0) {
          const latest = completedRoutines[completedRoutines.length - 1];
          setRoutineStreak(latest.streakDay);
        }
      })();
    }, []),
  );

  const scoreColor =
    (baseline?.natureScore ?? 0) >= 80
      ? "#34C759"
      : (baseline?.natureScore ?? 0) >= 60
        ? "#FFCC00"
        : (baseline?.natureScore ?? 0) >= 40
          ? "#FF9500"
          : "#FF3B30";

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
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">
            Nature & Routine
          </Text>
          <View className="w-10" />
        </Animated.View>

        {/* Score */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: THEME + "15" }}
            >
              <Leaf size={28} color={THEME} strokeWidth={2} />
            </View>
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Nature & Routine Score
            </Text>
            <Text
              className="text-[48px] font-bold tracking-tighter"
              style={{ color: scoreColor }}
            >
              {baseline?.natureScore ?? "—"}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Today Stats */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Today
          </Text>
          <View className="flex-row gap-3 justify-between">
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <TreePine size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {todayOutdoorMin}m
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Outdoors
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Sun size={20} color="#FF9500" strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {weekOutdoorDays}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Days / 7
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <CheckCircle2 size={20} color="#5856D6" strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {routineStreak}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Streak
                </Text>
              </GlassCard>
            </View>
          </View>
        </Animated.View>

        {/* Nature Actions */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Nature
          </Text>
          <View className="gap-3">
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: "#FF9500" }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#FF950015" }}
              >
                <Sun size={22} color="#FF9500" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Morning Light
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Get daylight within 30 min of waking
                </Text>
              </View>
            </GlassCard>
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: THEME }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: THEME + "15" }}
              >
                <TreePine size={22} color={THEME} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Nature Break
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Spend 10 minutes outdoors
                </Text>
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* Today's Routines */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Routines
          </Text>
          {todayRoutines.length > 0 ? (
            <View className="gap-2">
              {todayRoutines.map((r) => (
                <GlassCard
                  key={r.id}
                  className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                >
                  <CheckCircle2
                    size={20}
                    color={r.completed ? "#34C759" : "#C7C7CC"}
                    strokeWidth={2}
                  />
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#1C1C1E]">
                      {r.habitName}
                    </Text>
                    <Text className="text-[11px] text-[#8A8A8E] capitalize">
                      {r.routineType} routine
                    </Text>
                  </View>
                  {r.completed && (
                    <Text className="text-[12px] font-bold text-[#34C759]">
                      Day {r.streakDay}
                    </Text>
                  )}
                </GlassCard>
              ))}
            </View>
          ) : (
            <GlassCard className="p-5 items-center border border-black/5 bg-white/60">
              <Text className="text-[14px] text-[#8A8A8E] text-center">
                No routines logged today. Complete your morning or evening
                routine to build your streak.
              </Text>
            </GlassCard>
          )}
        </Animated.View>

        {/* Recent Nature Logs */}
        {recentNatureLogs.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Recent Nature Time
            </Text>
            <View className="gap-2">
              {recentNatureLogs.slice(0, 7).map((log) => (
                <GlassCard
                  key={log.id}
                  className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                >
                  <Leaf size={16} color={THEME} strokeWidth={2} />
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-[#1C1C1E]">
                      {log.date}
                    </Text>
                    <Text className="text-[11px] text-[#8A8A8E]">
                      {log.outdoorMinutes}m outdoor · {log.lightMinutes}m light
                      {log.moodAfterScore
                        ? ` · Mood: ${log.moodAfterScore}/10`
                        : ""}
                    </Text>
                  </View>
                </GlassCard>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Premium */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(800).springify()}
        >
          <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
            <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Premium
            </Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">
              Pattern Insights
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
              Nature exposure vs mood correlations and optimal routine timing
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
