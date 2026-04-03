import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getSpiritualBaseline,
  getSpiritualCheckInHistory,
  getPracticeSessions,
  getSpiritualJournals,
  getSpiritualContentProgress,
} from "@/lib/spiritual-store";
import { analyzeSpiritualCheckIns } from "@aura/spiritual-engine";
import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualPracticeSession,
  SpiritualJournalEntry,
  SpiritualTrendData,
} from "@aura/types";

const TEAL = "#30B0C7";

type TimeWindow = 7 | 30;

const TREND_ICON: Record<string, string> = {
  improving: "📈",
  stable: "➡️",
  declining: "📉",
};

const TREND_COLOR: Record<string, string> = {
  improving: "#34C759",
  stable: "#8A8A8E",
  declining: "#FF3B30",
};

const DOMAIN_COLORS: Record<string, string> = {
  Meaning: "#FF9500",
  Peace: "#5856D6",
  Mindfulness: TEAL,
  Connection: "#34C759",
  Practice: "#FF2D55",
};

export default function SpiritualInsightsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [window, setWindow] = useState<TimeWindow>(7);
  const [baseline, setBaseline] = useState<SpiritualBaseline | null>(null);
  const [checkIns, setCheckIns] = useState<SpiritualDailyCheckIn[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<
    SpiritualPracticeSession[]
  >([]);
  const [journalEntries, setJournalEntries] = useState<SpiritualJournalEntry[]>(
    [],
  );
  const [contentProgress, setContentProgress] = useState<
    Record<string, number>
  >({});
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 8) / 2);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setBaseline(await getSpiritualBaseline());
        setCheckIns(await getSpiritualCheckInHistory(30));
        setPracticeSessions(await getPracticeSessions());
        setJournalEntries(await getSpiritualJournals());
        setContentProgress(await getSpiritualContentProgress());
      })();
    }, []),
  );

  // ── Filter by window ──
  const cutoffDate = new Date(Date.now() - window * 86400000).toISOString();
  const windowCheckIns = checkIns.filter((c) => c.createdAt >= cutoffDate);
  const windowPractice = practiceSessions.filter(
    (p) => p.completedAt >= cutoffDate,
  );
  const windowJournals = journalEntries.filter(
    (j) => j.createdAt >= cutoffDate,
  );

  // ── Trend Analysis ──
  const trendData: SpiritualTrendData | null = useMemo(() => {
    if (windowCheckIns.length === 0) return null;
    try {
      return analyzeSpiritualCheckIns(windowCheckIns, window);
    } catch {
      return null;
    }
  }, [windowCheckIns, window]);

  // ── Calm Score Sparkline (daily averages) ──
  const calmSparkline = useMemo(() => {
    const dayMap = new Map<string, number[]>();
    for (const c of windowCheckIns) {
      const day = c.date;
      const vals = dayMap.get(day) ?? [];
      vals.push(c.calmScore);
      dayMap.set(day, vals);
    }
    const result: number[] = [];
    for (let i = window - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const vals = dayMap.get(key);
      result.push(
        vals && vals.length > 0
          ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) /
              10
          : 0,
      );
    }
    return result;
  }, [windowCheckIns, window]);

  // ── Practice Minutes by Day ──
  const practiceByDay = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const p of windowPractice) {
      const day = p.completedAt.split("T")[0];
      dayMap.set(day, (dayMap.get(day) ?? 0) + p.durationMinutes);
    }
    const result: number[] = [];
    for (let i = window - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      result.push(dayMap.get(key) ?? 0);
    }
    return result;
  }, [windowPractice, window]);

  const totalPracticeMin = windowPractice.reduce(
    (s, p) => s + p.durationMinutes,
    0,
  );
  const avgCalm =
    windowCheckIns.length > 0
      ? Math.round(
          (windowCheckIns.reduce((s, c) => s + c.calmScore, 0) /
            windowCheckIns.length) *
            10,
        ) / 10
      : 0;
  const checkinDays = new Set(windowCheckIns.map((c) => c.date)).size;
  const completedContent = Object.values(contentProgress).filter(
    (p) => p >= 100,
  ).length;

  // ── AI Insights ──
  const insights = useMemo(() => {
    const items: {
      icon: string;
      title: string;
      desc: string;
      level: "positive" | "warning" | "neutral";
    }[] = [];

    if (!trendData && windowCheckIns.length === 0) {
      items.push({
        icon: "💡",
        title: "Start checking in",
        desc: "Complete daily check-ins to unlock insights about your spiritual patterns.",
        level: "neutral",
      });
      return items;
    }

    // Practice consistency
    if (windowPractice.length >= 3) {
      items.push({
        icon: "🧘",
        title: "Regular practice",
        desc: `${windowPractice.length} sessions (${totalPracticeMin} min) this period. Consistency builds lasting calm.`,
        level: "positive",
      });
    } else if (windowPractice.length === 0) {
      items.push({
        icon: "🌬️",
        title: "Try a practice",
        desc: "No practice sessions this period. Even 1 minute of breathwork can make a difference.",
        level: "warning",
      });
    }

    // Journal consistency
    if (windowJournals.length >= 3) {
      items.push({
        icon: "📔",
        title: "Reflection habit",
        desc: `${windowJournals.length} journal entries. Writing about your inner world strengthens self-awareness.`,
        level: "positive",
      });
    }

    // Calm trend
    if (trendData) {
      if (trendData.overallDirection === "improving") {
        items.push({
          icon: "🌟",
          title: "Calm improving",
          desc: "Your inner calm is trending upward. Keep doing what you're doing!",
          level: "positive",
        });
      } else if (trendData.overallDirection === "declining") {
        items.push({
          icon: "⚠️",
          title: "Calm declining",
          desc: "Your calm trend is dipping. Consider adding a short daily practice or reaching out for support.",
          level: "warning",
        });
      }
    }

    // Check-in streak
    if (checkinDays >= 5) {
      items.push({
        icon: "🔥",
        title: "Streak building",
        desc: `${checkinDays} days checked in this period. Regular awareness is the foundation of growth.`,
        level: "positive",
      });
    }

    // Content progress
    if (completedContent > 0) {
      items.push({
        icon: "📚",
        title: "Learning progress",
        desc: `${completedContent} practice${completedContent !== 1 ? "s" : ""} explored. Each one adds to your toolkit.`,
        level: "positive",
      });
    }

    // Top blocker
    const blockerCounts = new Map<string, number>();
    for (const c of windowCheckIns) {
      for (const b of c.blockers) {
        blockerCounts.set(b, (blockerCounts.get(b) ?? 0) + 1);
      }
    }
    const topBlocker = [...blockerCounts.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (topBlocker && topBlocker[1] >= 2) {
      items.push({
        icon: "🎯",
        title: "Top blocker",
        desc: `"${topBlocker[0].replace(/_/g, " ")}" appeared ${topBlocker[1]}× this period. Awareness is the first step.`,
        level: "neutral",
      });
    }

    if (items.length === 0) {
      items.push({
        icon: "💡",
        title: "Keep going",
        desc: "Check in daily and practice regularly to build meaningful insights.",
        level: "neutral",
      });
    }

    return items;
  }, [
    trendData,
    windowCheckIns,
    windowPractice,
    windowJournals,
    checkinDays,
    completedContent,
    totalPracticeMin,
  ]);

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
        <Text className="text-[20px] font-bold text-black tracking-tight flex-1">
          Insights & Progress
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-10">
          {/* Time window toggle */}
          <View
            className="flex-row justify-between mb-5"
            style={{
              maxWidth: safeContentWidth,
              width: "100%",
              alignSelf: "center",
            }}
          >
            {([7, 30] as TimeWindow[]).map((w) => (
              <View key={w} style={{ width: twoColCardWidth }}>
                <Pressable
                  onPress={() => setWindow(w)}
                  className="py-2.5 rounded-xl items-center"
                  style={{
                    backgroundColor: window === w ? TEAL : "#fff",
                    borderWidth: 1.5,
                    borderColor: window === w ? TEAL : "#E5E5EA",
                  }}
                >
                  <Text
                    className="text-[14px] font-bold"
                    style={{ color: window === w ? "#fff" : "#3C3C43" }}
                  >
                    {w} days
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* ── Summary Stats ── */}
          <View className="flex-row gap-3 mb-5 justify-between">
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-3 items-center">
                <Text className="text-[11px] text-[#8A8A8E] font-semibold">
                  Avg Calm
                </Text>
                <Text className="text-[22px] font-bold text-black">
                  {avgCalm}
                </Text>
                <Text className="text-[10px]" style={{ color: TEAL }}>
                  /10
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-3 items-center">
                <Text className="text-[11px] text-[#8A8A8E] font-semibold">
                  Practice
                </Text>
                <Text className="text-[22px] font-bold text-black">
                  {totalPracticeMin}
                </Text>
                <Text className="text-[10px] text-[#8A8A8E]">min</Text>
              </GlassCard>
            </View>
            <View style={{ width: threeColCardWidth }}>
              <GlassCard className="p-3 items-center">
                <Text className="text-[11px] text-[#8A8A8E] font-semibold">
                  Streak
                </Text>
                <Text className="text-[22px] font-bold text-black">
                  {checkinDays}
                </Text>
                <Text className="text-[10px] text-[#8A8A8E]">days</Text>
              </GlassCard>
            </View>
          </View>

          {/* ── Calm Score Trend ── */}
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Calm Score Trend
          </Text>
          {calmSparkline.some((v) => v > 0) ? (
            <GlassCard className="p-4 mb-5">
              <View className="flex-row items-end h-20 gap-1">
                {calmSparkline.map((v, i) => (
                  <View
                    key={i}
                    className="flex-1 items-center justify-end h-full"
                  >
                    <View
                      className="rounded-t"
                      style={{
                        width: "70%",
                        height: `${Math.max(3, (v / 10) * 100)}%`,
                        backgroundColor:
                          v >= 7
                            ? "#34C759"
                            : v >= 5
                              ? TEAL
                              : v >= 3
                                ? "#FF9500"
                                : v > 0
                                  ? "#FF3B30"
                                  : "#E5E5EA",
                        minHeight: 3,
                      }}
                    />
                  </View>
                ))}
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-[9px] text-[#8A8A8E]">{window}d ago</Text>
                <Text className="text-[9px] text-[#8A8A8E]">Today</Text>
              </View>
              {trendData && (
                <View className="flex-row items-center gap-1.5 mt-2">
                  <Text style={{ fontSize: 14 }}>
                    {TREND_ICON[trendData.overallDirection]}
                  </Text>
                  <Text
                    className="text-[13px] font-semibold capitalize"
                    style={{ color: TREND_COLOR[trendData.overallDirection] }}
                  >
                    {trendData.overallDirection}
                  </Text>
                </View>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-6 mb-5 items-center">
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text className="text-[14px] text-[#8A8A8E] mt-2 text-center">
                No check-in data yet. Check in daily to see trends.
              </Text>
            </GlassCard>
          )}

          {/* ── Practice Minutes Chart ── */}
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Practice Minutes
          </Text>
          {practiceByDay.some((v) => v > 0) ? (
            <GlassCard className="p-4 mb-5">
              <View className="flex-row items-end h-16 gap-1">
                {practiceByDay.map((v, i) => {
                  const maxVal = Math.max(...practiceByDay, 1);
                  return (
                    <View
                      key={i}
                      className="flex-1 items-center justify-end h-full"
                    >
                      <View
                        className="rounded-t"
                        style={{
                          width: "70%",
                          height: `${Math.max(3, (v / maxVal) * 100)}%`,
                          backgroundColor: v > 0 ? "#5856D6" : "#E5E5EA",
                          minHeight: 3,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="flex-row justify-between mt-2 px-1">
                <Text className="text-[9px] text-[#8A8A8E]">{window}d ago</Text>
                <Text className="text-[9px] text-[#8A8A8E]">Today</Text>
              </View>
            </GlassCard>
          ) : (
            <GlassCard className="p-4 mb-5 items-center">
              <Text className="text-[13px] text-[#8A8A8E]">
                No practice sessions yet.
              </Text>
            </GlassCard>
          )}

          {/* ── Domain Breakdown ── */}
          {baseline && (
            <>
              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Domain Breakdown
              </Text>
              <GlassCard className="p-4 mb-5">
                {[
                  {
                    label: "Meaning",
                    score: baseline.meaningScore,
                    icon: "🌟",
                  },
                  { label: "Peace", score: baseline.peaceScore, icon: "🕊️" },
                  {
                    label: "Mindfulness",
                    score: baseline.mindfulnessScore,
                    icon: "🧘",
                  },
                  {
                    label: "Connection",
                    score: baseline.connectionScore,
                    icon: "🤝",
                  },
                  {
                    label: "Practice",
                    score: baseline.practiceScore,
                    icon: "🌿",
                  },
                ].map((d) => (
                  <View key={d.label} className="flex-row items-center mb-3">
                    <Text style={{ fontSize: 16, width: 24 }}>{d.icon}</Text>
                    <Text className="text-[14px] font-medium text-black flex-1">
                      {d.label}
                    </Text>
                    <Text className="text-[15px] font-bold text-black mr-3">
                      {d.score}
                    </Text>
                    <View className="w-20 h-2 bg-[#E5E5EA] rounded-full">
                      <View
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, d.score)}%`,
                          backgroundColor: DOMAIN_COLORS[d.label] ?? TEAL,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </GlassCard>
            </>
          )}

          {/* ── AI Insights ── */}
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Insights
          </Text>
          {insights.map((insight, i) => (
            <GlassCard
              key={i}
              className="p-4 mb-3"
              style={{
                borderLeftWidth: 3,
                borderLeftColor:
                  insight.level === "positive"
                    ? "#34C759"
                    : insight.level === "warning"
                      ? "#FF9500"
                      : TEAL,
              }}
            >
              <View className="flex-row items-center gap-2 mb-1">
                <Text style={{ fontSize: 16 }}>{insight.icon}</Text>
                <Text className="text-[14px] font-bold text-black">
                  {insight.title}
                </Text>
              </View>
              <Text className="text-[13px] text-[#3C3C43] leading-relaxed">
                {insight.desc}
              </Text>
            </GlassCard>
          ))}

          {/* ── Low calm warning ── */}
          {avgCalm > 0 && avgCalm <= 3 && (
            <GlassCard
              className="p-4 mb-4"
              style={{ borderLeftWidth: 3, borderLeftColor: "#FF3B30" }}
            >
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-1">
                Low Calm Alert
              </Text>
              <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
                Your average calm score is {avgCalm}/10. Consider reaching out —
                the Get Help button can connect you with support.
              </Text>
            </GlassCard>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
