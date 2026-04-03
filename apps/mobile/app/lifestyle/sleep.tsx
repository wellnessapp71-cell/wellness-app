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
  getSleepLogs,
  getLifestyleBaseline,
  getLifestyleCheckIns,
} from "@/lib/lifestyle-store";
import type { SleepLog, LifestyleBaseline } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Moon,
  Plus,
  Clock,
  BedDouble,
  AlarmClock,
} from "lucide-react-native";

const THEME = "#5856D6";

export default function SleepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [weeklyAvg, setWeeklyAvg] = useState(0);
  const [weeklyQuality, setWeeklyQuality] = useState(0);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        const logs = await getSleepLogs();
        setSleepLogs(logs.slice(-14).reverse());

        // Compute 7-day averages from check-ins
        const checkIns = await getLifestyleCheckIns();
        const recent = checkIns.slice(-7);
        if (recent.length > 0) {
          setWeeklyAvg(
            Math.round(
              (recent.reduce((s, c) => s + c.sleepHours, 0) / recent.length) *
                10,
            ) / 10,
          );
          setWeeklyQuality(
            Math.round(
              (recent.reduce((s, c) => s + c.sleepQuality, 0) / recent.length) *
                10,
            ) / 10,
          );
        }
      })();
    }, []),
  );

  const scoreColor =
    (baseline?.sleepScore ?? 0) >= 80
      ? "#34C759"
      : (baseline?.sleepScore ?? 0) >= 60
        ? "#FFCC00"
        : (baseline?.sleepScore ?? 0) >= 40
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
            Sleep & Recovery
          </Text>
          <View className="w-10" />
        </Animated.View>

        {/* Score Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: THEME + "15" }}
            >
              <Moon size={28} color={THEME} strokeWidth={2} />
            </View>
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Sleep Score
            </Text>
            <Text
              className="text-[48px] font-bold tracking-tighter"
              style={{ color: scoreColor }}
            >
              {baseline?.sleepScore ?? "—"}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Weekly Averages */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            This Week
          </Text>
          <View className="flex-row gap-3 justify-between">
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Clock size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {weeklyAvg || "—"}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Avg Hours
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <BedDouble size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {weeklyQuality || "—"}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Avg Quality
                </Text>
              </GlassCard>
            </View>
          </View>
        </Animated.View>

        {/* 7-day sparkline (simple bar chart) */}
        {sleepLogs.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Duration Trend
            </Text>
            <GlassCard className="p-4 border border-black/5 bg-white/60">
              <View className="flex-row items-end gap-2 h-24">
                {sleepLogs
                  .slice(0, 7)
                  .reverse()
                  .map((log, i) => {
                    const h = log.durationMinutes / 60;
                    const barH = Math.max(8, (h / 10) * 96);
                    const barColor =
                      h >= 7 ? "#34C759" : h >= 6 ? "#FFCC00" : "#FF3B30";
                    return (
                      <View key={i} className="flex-1 items-center">
                        <View
                          className="w-full rounded-t-lg"
                          style={{ height: barH, backgroundColor: barColor }}
                        />
                        <Text className="text-[9px] text-[#8A8A8E] font-bold mt-1">
                          {Math.round(h * 10) / 10}h
                        </Text>
                      </View>
                    );
                  })}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Actions
          </Text>
          <View className="gap-3">
            <Pressable onPress={() => router.push("/lifestyle/log-sleep")}>
              <GlassCard
                className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
                style={{ borderLeftWidth: 3, borderLeftColor: THEME }}
              >
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: THEME + "15" }}
                >
                  <Plus size={22} color={THEME} strokeWidth={2.5} />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-[#1C1C1E]">
                    Log Sleep
                  </Text>
                  <Text className="text-[13px] text-[#8A8A8E]">
                    Record last night's sleep
                  </Text>
                </View>
              </GlassCard>
            </Pressable>
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: "#FF9500" }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#FF950015" }}
              >
                <AlarmClock size={22} color="#FF9500" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Bedtime Reminder
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Set a consistent bedtime alarm
                </Text>
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* Recent Logs */}
        {sleepLogs.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Recent Logs
            </Text>
            <View className="gap-2">
              {sleepLogs.slice(0, 7).map((log) => (
                <GlassCard
                  key={log.id}
                  className="p-4 flex-row items-center border border-black/5 bg-white/60"
                >
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#1C1C1E]">
                      {log.date}
                    </Text>
                    <Text className="text-[12px] text-[#8A8A8E] mt-0.5">
                      {log.bedtime} → {log.wakeTime} · Quality:{" "}
                      {log.qualityScore}/10
                    </Text>
                  </View>
                  <Text
                    className="text-[18px] font-bold"
                    style={{ color: THEME }}
                  >
                    {Math.round((log.durationMinutes / 60) * 10) / 10}h
                  </Text>
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
              Advanced Sleep Reports
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
              Detailed sleep stage analysis and personalised recommendations
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
