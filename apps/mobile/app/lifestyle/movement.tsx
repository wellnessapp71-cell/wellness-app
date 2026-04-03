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
import { getMovementLogs, getLifestyleBaseline } from "@/lib/lifestyle-store";
import type { MovementLog, LifestyleBaseline } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Footprints,
  Plus,
  PersonStanding,
  StretchHorizontal,
} from "lucide-react-native";

const THEME = "#FF9500";

const BREAK_ICONS: Record<string, string> = {
  walk: "🚶",
  stretch: "🤸",
  stand: "🧍",
  stairs: "🪜",
  micro_activity: "⚡",
};

export default function MovementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [todayLogs, setTodayLogs] = useState<MovementLog[]>([]);
  const [recentLogs, setRecentLogs] = useState<MovementLog[]>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weeklyDays, setWeeklyDays] = useState(0);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  const todayDate = new Date().toISOString().split("T")[0];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        const logs = await getMovementLogs();
        const today = logs.filter((l) => l.date === todayDate);
        setTodayLogs(today);
        setTodayMinutes(today.reduce((s, l) => s + l.activeMinutes, 0));
        setRecentLogs(logs.slice(-20).reverse());

        // Count unique active days in last 7 days
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffStr = cutoff.toISOString().split("T")[0];
        const activeDays = new Set(
          logs.filter((l) => l.date >= cutoffStr).map((l) => l.date),
        );
        setWeeklyDays(activeDays.size);
      })();
    }, []),
  );

  const scoreColor =
    (baseline?.movementScore ?? 0) >= 80
      ? "#34C759"
      : (baseline?.movementScore ?? 0) >= 60
        ? "#FFCC00"
        : (baseline?.movementScore ?? 0) >= 40
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
            Movement
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
              <Footprints size={28} color={THEME} strokeWidth={2} />
            </View>
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Movement Score
            </Text>
            <Text
              className="text-[48px] font-bold tracking-tighter"
              style={{ color: scoreColor }}
            >
              {baseline?.movementScore ?? "—"}
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
                <Footprints size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {todayMinutes}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Active Min
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <PersonStanding size={20} color="#34C759" strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {todayLogs.length}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Breaks
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <StretchHorizontal size={20} color="#5856D6" strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {weeklyDays}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Active Days
                </Text>
              </GlassCard>
            </View>
          </View>
        </Animated.View>

        {/* Quick Start Actions */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Quick Start
          </Text>
          <View className="gap-3">
            {[
              {
                icon: "🚶",
                label: "3-min Walk",
                desc: "Get up and move around",
                color: "#34C759",
              },
              {
                icon: "🤸",
                label: "Stretch Now",
                desc: "Quick desk stretches",
                color: "#5856D6",
              },
              {
                icon: "🧍",
                label: "Stand Up",
                desc: "Stand for 1 minute",
                color: THEME,
              },
              {
                icon: "⚡",
                label: "Micro Activity",
                desc: "Quick burst of movement",
                color: "#FF2D55",
              },
            ].map((action) => (
              <Pressable
                key={action.label}
                onPress={() => router.push("/lifestyle/log-movement")}
              >
                <GlassCard
                  className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
                  style={{ borderLeftWidth: 3, borderLeftColor: action.color }}
                >
                  <View
                    className="w-11 h-11 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: action.color + "15" }}
                  >
                    <Text style={{ fontSize: 22 }}>{action.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-[#1C1C1E]">
                      {action.label}
                    </Text>
                    <Text className="text-[13px] text-[#8A8A8E]">
                      {action.desc}
                    </Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Log Movement */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(800).springify()}
          className="mb-8"
        >
          <Pressable onPress={() => router.push("/lifestyle/log-movement")}>
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: "#007AFF" }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#007AFF15" }}
              >
                <Plus size={22} color="#007AFF" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Log Movement
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Record activity type and duration
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Recent Logs */}
        {recentLogs.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Recent Activity
            </Text>
            <View className="gap-2">
              {recentLogs.slice(0, 10).map((log) => (
                <GlassCard
                  key={log.id}
                  className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                >
                  <Text style={{ fontSize: 16 }}>
                    {BREAK_ICONS[log.breakType ?? "walk"] ?? "🚶"}
                  </Text>
                  <View className="flex-1">
                    <Text className="text-[13px] font-bold text-[#1C1C1E] capitalize">
                      {log.breakType?.replace("_", " ") ?? "Activity"}
                    </Text>
                    <Text className="text-[11px] text-[#8A8A8E]">
                      {log.date}
                    </Text>
                  </View>
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: THEME }}
                  >
                    {log.activeMinutes}m
                  </Text>
                </GlassCard>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Link to Physical */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(800).springify()}
        >
          <Pressable onPress={() => router.push("/physical/hub")}>
            <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
              <Text className="text-[15px] font-bold text-[#007AFF] text-center">
                Go to Physical Module for deeper workouts →
              </Text>
            </GlassCard>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
