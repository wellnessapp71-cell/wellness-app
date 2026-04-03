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
import { TrendChart, Sparkline } from "@/components/mental/TrendChart";
import { InsightCard } from "@/components/mental/InsightCard";
import type { InsightLevel } from "@/components/mental/InsightCard";
import {
  getMentalBaseline,
  getMentalCheckInHistory,
  getRppgHistory,
  getCopingSessions,
  getJournalEntries,
  getContentProgress,
} from "@/lib/mental-store";
import { analyzeCheckInTrends, compareToBaseline } from "@aura/mental-engine";
import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  CopingSession,
  MentalJournalEntry,
  TrendAnalysis,
  FieldTrend,
  InterventionType,
} from "@aura/types";

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

const FIELD_COLORS: Record<string, string> = {
  Mood: "#AF52DE",
  Stress: "#FF3B30",
  Anxiety: "#FF9500",
  Energy: "#34C759",
  Focus: "#007AFF",
  Sleep: "#5856D6",
};

export default function InsightsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [window, setWindow] = useState<TimeWindow>(7);
  const [baseline, setBaseline] = useState<MentalBaseline | null>(null);
  const [checkIns, setCheckIns] = useState<MentalDailyCheckIn[]>([]);
  const [scans, setScans] = useState<RppgScanResult[]>([]);
  const [copingSessions, setCopingSessions] = useState<CopingSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<MentalJournalEntry[]>(
    [],
  );
  const [contentProgress, setContentProgress] = useState<
    Record<string, number>
  >({});
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setBaseline(await getMentalBaseline());
        setCheckIns(await getMentalCheckInHistory(30));
        setScans(await getRppgHistory());
        setCopingSessions(await getCopingSessions());
        setJournalEntries(await getJournalEntries());
        setContentProgress(await getContentProgress());
      })();
    }, []),
  );

  // ── Trend Analysis ──
  const analysis: TrendAnalysis | null = useMemo(() => {
    if (checkIns.length === 0) return null;
    return analyzeCheckInTrends("local", checkIns, window);
  }, [checkIns, window]);

  // Baseline comparison
  const comparison = useMemo(() => {
    if (!baseline || checkIns.length === 0) return null;
    return compareToBaseline(baseline, checkIns);
  }, [baseline, checkIns]);

  // ── Scan data for overlay
  const cutoffDate = new Date(Date.now() - window * 86400000).toISOString();
  const windowScans = scans.filter((s) => s.scannedAtIso >= cutoffDate);
  const windowCoping = copingSessions.filter(
    (s) => s.completed && s.completedAtIso >= cutoffDate,
  );
  const windowJournals = journalEntries.filter(
    (j) => j.createdAtIso >= cutoffDate,
  );

  // ── AI Insights ──
  const insights = useMemo(() => {
    const items: {
      icon: string;
      title: string;
      description: string;
      level: InsightLevel;
    }[] = [];

    if (!analysis) return items;

    // Sleep-stress correlation
    const sleepField = analysis.fields.find((f) => f.field === "Sleep");
    const stressField = analysis.fields.find((f) => f.field === "Stress");
    if (
      sleepField &&
      stressField &&
      sleepField.average >= 7 &&
      stressField.average <= 5
    ) {
      items.push({
        icon: "😴",
        title: "Sleep is protecting you",
        description: `Your stress improved on days you slept at least 7 hours. Average sleep: ${sleepField.average.toFixed(1)}h.`,
        level: "positive",
      });
    }

    // Coping effectiveness
    if (windowCoping.length >= 3) {
      const sessions = windowCoping.length;
      items.push({
        icon: "🧘",
        title: "Regular practice paying off",
        description: `You've completed ${sessions} calming sessions this period. Regular practice is correlated with lower stress.`,
        level: "positive",
      });
    }

    // Journal consistency
    if (windowJournals.length >= 3) {
      items.push({
        icon: "📔",
        title: "Journaling consistency",
        description: `${windowJournals.length} journal entries this period. Writing about emotions helps process them effectively.`,
        level: "positive",
      });
    }

    // Mood trend
    const moodField = analysis.fields.find((f) => f.field === "Mood");
    if (moodField) {
      if (moodField.direction === "declining") {
        items.push({
          icon: "⚠️",
          title: "Mood trending down",
          description: `Your mood has been declining over the last ${window} days. Consider scheduling a counselor session or trying a new intervention.`,
          level: "warning",
        });
      } else if (moodField.direction === "improving") {
        items.push({
          icon: "🌟",
          title: "Mood improving",
          description: `Your mood trend is positive — up ${Math.abs(moodField.changePercent)}% over the period. Keep up what you're doing!`,
          level: "positive",
        });
      }
    }

    // Stress escalation
    if (stressField && stressField.average >= 7) {
      items.push({
        icon: "🆘",
        title: "Sustained high stress",
        description: `Average stress is ${stressField.average.toFixed(1)}/10. Consider reaching out — the Get Help button can connect you with a counselor.`,
        level: "critical",
      });
    }

    // Top triggers
    if (analysis.topTriggers.length > 0) {
      const triggerStr = analysis.topTriggers
        .slice(0, 2)
        .map((t) => t.tag.replace("_", " "))
        .join(" and ");
      items.push({
        icon: "🎯",
        title: "Top stress triggers",
        description: `Your most common triggers are ${triggerStr}. Awareness is the first step to managing them.`,
        level: "neutral",
      });
    }

    // Scan frequency
    if (windowScans.length >= 2) {
      items.push({
        icon: "📸",
        title: "Regular scanning",
        description: `${windowScans.length} stress scans this period. Regular scanning helps you stay aware of your stress patterns.`,
        level: "positive",
      });
    }

    // Content progress
    const completedModules = Object.values(contentProgress).filter(
      (p) => p >= 100,
    ).length;
    if (completedModules > 0) {
      items.push({
        icon: "📚",
        title: "Learning progress",
        description: `You've completed ${completedModules} learning module${completedModules !== 1 ? "s" : ""}. Each lesson builds your resilience toolkit.`,
        level: "positive",
      });
    }

    // If no insights generated, add a default
    if (items.length === 0) {
      items.push({
        icon: "💡",
        title: "Keep going",
        description:
          "Check in daily and use the tools to build meaningful insights about your patterns.",
        level: "neutral",
      });
    }

    return items;
  }, [
    analysis,
    windowCoping,
    windowJournals,
    windowScans,
    contentProgress,
    window,
  ]);

  // ── Build rPPG scan trend (daily stress index for overlay) ──
  const scanStressTrend = useMemo(() => {
    const dayMap = new Map<string, number[]>();
    for (const s of windowScans) {
      const day = s.scannedAtIso.split("T")[0];
      const vals = dayMap.get(day) ?? [];
      vals.push(s.stressIndex);
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
          ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
          : 0,
      );
    }
    return result;
  }, [windowScans, window]);

  // Build activity sparklines
  const copingByDay = useMemo(
    () =>
      buildDailyCounts(
        windowCoping.map((s) => s.completedAtIso),
        window,
      ),
    [windowCoping, window],
  );
  const scanByDay = useMemo(
    () =>
      buildDailyCounts(
        windowScans.map((s) => s.scannedAtIso),
        window,
      ),
    [windowScans, window],
  );

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
                    backgroundColor: window === w ? "#AF52DE" : "#fff",
                    borderWidth: 1.5,
                    borderColor: window === w ? "#AF52DE" : "#E5E5EA",
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

          {/* ── Trend Summary Cards ── */}
          {analysis && (
            <View className="mb-4">
              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Trend Overview
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {analysis.fields.map((field) => (
                  <TrendSummaryChip key={field.field} field={field} />
                ))}
              </View>
            </View>
          )}

          {/* ── Trend Charts ── */}
          {analysis ? (
            <>
              {analysis.fields.map((field) => (
                <TrendChart
                  key={field.field}
                  data={padToWindow(field.values, window)}
                  label={field.field}
                  color={FIELD_COLORS[field.field] ?? "#AF52DE"}
                  unit={field.field === "Sleep" ? "h" : "/10"}
                  invertGood={
                    field.field === "Stress" || field.field === "Anxiety"
                  }
                  barChart={field.field === "Sleep"}
                />
              ))}

              {/* rPPG Scan stress overlay */}
              {scanStressTrend.some((v) => v > 0) && (
                <TrendChart
                  data={scanStressTrend}
                  label="rPPG Stress"
                  color="#FF2D55"
                  unit="/100"
                  invertGood
                />
              )}
            </>
          ) : (
            <GlassCard className="p-6 mb-4 items-center">
              <Text style={{ fontSize: 32 }}>📋</Text>
              <Text className="text-[15px] text-[#8A8A8E] mt-2 text-center">
                Complete daily check-ins to see your trend charts.
              </Text>
            </GlassCard>
          )}

          {/* ── Activity Sparklines ── */}
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-2 mb-3">
            Activity
          </Text>
          <View className="flex-row gap-3 mb-5 justify-between">
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-3">
                <Text className="text-[12px] text-[#8A8A8E] font-semibold mb-1">
                  Scan Frequency
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[18px] font-bold text-black">
                    {windowScans.length}
                  </Text>
                  <Sparkline data={scanByDay} color="#FF2D55" />
                </View>
              </GlassCard>
            </View>
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-3">
                <Text className="text-[12px] text-[#8A8A8E] font-semibold mb-1">
                  Sessions
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[18px] font-bold text-black">
                    {windowCoping.length}
                  </Text>
                  <Sparkline data={copingByDay} color="#34C759" />
                </View>
              </GlassCard>
            </View>
          </View>

          {/* ── Baseline Comparison ── */}
          {comparison && (
            <GlassCard className="p-4 mb-5">
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                Progress vs Baseline
              </Text>
              <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
                {comparison.summary}
              </Text>
              <View className="flex-row gap-4 mt-3">
                <View className="flex-row items-center gap-1">
                  <Text className="text-[13px]">😊</Text>
                  <Text
                    className="text-[13px] font-bold"
                    style={{
                      color:
                        comparison.moodChange > 0
                          ? "#34C759"
                          : comparison.moodChange < 0
                            ? "#FF3B30"
                            : "#8A8A8E",
                    }}
                  >
                    Mood {comparison.moodChange > 0 ? "+" : ""}
                    {comparison.moodChange.toFixed(1)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-[13px]">😤</Text>
                  <Text
                    className="text-[13px] font-bold"
                    style={{
                      color:
                        comparison.stressChange > 0
                          ? "#34C759"
                          : comparison.stressChange < 0
                            ? "#FF3B30"
                            : "#8A8A8E",
                    }}
                  >
                    Stress {comparison.stressChange > 0 ? "−" : "+"}
                    {Math.abs(comparison.stressChange).toFixed(1)}
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* ── AI Insights ── */}
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Insights
          </Text>
          {insights.map((insight, i) => (
            <InsightCard
              key={i}
              icon={insight.icon}
              title={insight.title}
              description={insight.description}
              level={insight.level}
            />
          ))}

          {/* ── Escalation Timeline ── */}
          {analysis &&
            (() => {
              const stressField = analysis.fields.find(
                (f) => f.field === "Stress",
              );
              const escalations = stressField
                ? stressField.values.filter((v) => v >= 8).length
                : 0;
              if (escalations === 0) return null;
              return (
                <GlassCard
                  className="p-4 mb-4"
                  style={{ borderLeftWidth: 3, borderLeftColor: "#FF3B30" }}
                >
                  <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-1">
                    Escalation Events
                  </Text>
                  <Text className="text-[20px] font-bold text-[#FF3B30]">
                    {escalations} high-stress day{escalations !== 1 ? "s" : ""}
                  </Text>
                  <Text className="text-[13px] text-[#8A8A8E] mt-1">
                    Days with stress ≥ 8/10. Consider reaching out to a
                    counselor if this persists.
                  </Text>
                </GlassCard>
              );
            })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function TrendSummaryChip({ field }: { field: FieldTrend }) {
  const icon = TREND_ICON[field.direction] ?? "➡️";
  const color = TREND_COLOR[field.direction] ?? "#8A8A8E";
  const fieldColor = FIELD_COLORS[field.field] ?? "#AF52DE";

  return (
    <GlassCard className="px-3 py-2 flex-row items-center gap-2">
      <View
        className="w-2.5 h-2.5 rounded-full"
        style={{ backgroundColor: fieldColor }}
      />
      <Text className="text-[12px] font-semibold text-black">
        {field.field}
      </Text>
      <Text className="text-[12px] font-bold" style={{ color }}>
        {field.average.toFixed(1)} {icon}
      </Text>
    </GlassCard>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function padToWindow(values: number[], windowDays: number): number[] {
  if (values.length >= windowDays) return values.slice(-windowDays);
  // For 7-day window the analyzer already gives exact values
  // For 30-day, pad front with zeros
  const padded = new Array(windowDays - values.length).fill(0);
  return [...padded, ...values];
}

function buildDailyCounts(dates: string[], windowDays: number): number[] {
  const dayMap = new Map<string, number>();
  for (const d of dates) {
    const key = d.split("T")[0];
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }
  const result: number[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push(dayMap.get(key) ?? 0);
  }
  return result;
}
