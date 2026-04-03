import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { getHydrationLogs, getLifestyleBaseline, getLifestyleCheckIns } from "@/lib/lifestyle-store";
import type { HydrationLog, LifestyleBaseline } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, Droplets, Plus, Bell } from "lucide-react-native";

const THEME = "#5AC8FA";
const GOAL_ML = 2500;

export default function HydrationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayLogs, setTodayLogs] = useState<HydrationLog[]>([]);
  const [dailyTotals, setDailyTotals] = useState<{ date: string; ml: number }[]>([]);

  const todayDate = new Date().toISOString().split("T")[0];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        const logs = await getHydrationLogs();
        const today = logs.filter((l) => l.date === todayDate);
        setTodayLogs(today.reverse());
        setTodayTotal(today.reduce((s, l) => s + l.volumeMl, 0));

        // Build 14-day history
        const dayMap = new Map<string, number>();
        for (const log of logs) {
          dayMap.set(log.date, (dayMap.get(log.date) ?? 0) + log.volumeMl);
        }
        const history: { date: string; ml: number }[] = [];
        for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const key = d.toISOString().split("T")[0];
          history.push({ date: key, ml: dayMap.get(key) ?? 0 });
        }
        setDailyTotals(history);
      })();
    }, []),
  );

  const scoreColor = (baseline?.hydrationScore ?? 0) >= 80 ? "#34C759"
    : (baseline?.hydrationScore ?? 0) >= 60 ? "#FFCC00"
    : (baseline?.hydrationScore ?? 0) >= 40 ? "#FF9500" : "#FF3B30";

  const progress = Math.min(100, Math.round((todayTotal / GOAL_ML) * 100));

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800).springify()} className="pt-6 flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </Pressable>
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Hydration</Text>
          <View className="w-10" />
        </Animated.View>

        {/* Score + Goal Ring */}
        <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-8">
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <View className="flex-row items-center gap-6">
              {/* Score */}
              <View className="items-center">
                <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">Score</Text>
                <Text className="text-[42px] font-bold tracking-tighter" style={{ color: scoreColor }}>
                  {baseline?.hydrationScore ?? "—"}
                </Text>
              </View>
              {/* Goal Ring */}
              <View className="items-center">
                <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">Today</Text>
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{ borderWidth: 6, borderColor: progress >= 100 ? "#34C759" : THEME }}
                >
                  <Text className="text-[18px] font-bold" style={{ color: progress >= 100 ? "#34C759" : THEME }}>
                    {todayTotal}
                  </Text>
                  <Text className="text-[9px] text-[#8A8A8E] font-bold">/ {GOAL_ML}ml</Text>
                </View>
              </View>
            </View>
            <View className="w-full h-2 rounded-full bg-[#E5E5EA] mt-5">
              <View
                className="h-2 rounded-full"
                style={{ width: `${progress}%`, backgroundColor: progress >= 100 ? "#34C759" : THEME }}
              />
            </View>
          </GlassCard>
        </Animated.View>

        {/* Quick Log */}
        <Animated.View entering={FadeInDown.delay(150).duration(800).springify()} className="mb-8">
          <Pressable onPress={() => router.push("/lifestyle/log-water")}>
            <GlassCard className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60" style={{ borderLeftWidth: 3, borderLeftColor: THEME }}>
              <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: THEME + "15" }}>
                <Plus size={22} color={THEME} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">Log Water</Text>
                <Text className="text-[13px] text-[#8A8A8E]">One-tap hydration tracking</Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* 14-day History Chart */}
        {dailyTotals.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="mb-8">
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Two-Week History
            </Text>
            <GlassCard className="p-4 border border-black/5 bg-white/60">
              <View className="flex-row items-end gap-1 h-24">
                {dailyTotals.map((d, i) => {
                  const barH = Math.max(4, (d.ml / GOAL_ML) * 96);
                  const barColor = d.ml >= GOAL_ML ? "#34C759" : d.ml > 0 ? THEME : "#E5E5EA";
                  return (
                    <View key={i} className="flex-1 items-center">
                      <View
                        className="w-full rounded-t-sm"
                        style={{ height: Math.min(96, barH), backgroundColor: barColor }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-[9px] text-[#8A8A8E] font-bold">14d ago</Text>
                <Text className="text-[9px] text-[#8A8A8E] font-bold">Today</Text>
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Reminder */}
        <Animated.View entering={FadeInDown.delay(250).duration(800).springify()} className="mb-8">
          <GlassCard className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60">
            <View className="w-11 h-11 rounded-2xl items-center justify-center" style={{ backgroundColor: "#FF950015" }}>
              <Bell size={22} color="#FF9500" strokeWidth={2.5} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-bold text-[#1C1C1E]">Hydration Reminders</Text>
              <Text className="text-[13px] text-[#8A8A8E]">Set hourly water reminders</Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Today's Logs */}
        {todayLogs.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} className="mb-8">
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">Today's Drinks</Text>
            <View className="gap-2">
              {todayLogs.map((log) => (
                <GlassCard key={log.id} className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60">
                  <Droplets size={16} color={THEME} strokeWidth={2} />
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-[#1C1C1E] capitalize">{log.drinkType}</Text>
                    <Text className="text-[11px] text-[#8A8A8E]">
                      {log.createdAt.split("T")[1]?.slice(0, 5) ?? ""}
                      {log.caffeineFlag ? " · ☕ Caffeine" : ""}
                    </Text>
                  </View>
                  <Text className="text-[15px] font-bold" style={{ color: THEME }}>{log.volumeMl}ml</Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Premium */}
        <Animated.View entering={FadeInDown.delay(350).duration(800).springify()}>
          <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
            <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">Premium</Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">Smart Goal Adjustment</Text>
            <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
              AI-adjusted daily targets based on activity, weather, and patterns
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
