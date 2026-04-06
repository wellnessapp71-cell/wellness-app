import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { TrendChart } from "@/components/mental/TrendChart";
import { WeeklyComparisonChart } from "@/components/mental/WeeklyComparisonChart";
import { InsightCard } from "@/components/mental/InsightCard";

import {
  getMentalBaseline,
  getMentalCheckInHistory,
  getRppgHistory,
  getCopingSessions,
  getJournalEntries,
  getLatestWeeklyReview,
  saveWeeklyReview,
  saveMentalPlan,
} from "@/lib/mental-store";
import { api } from "@/lib/api";
import { recordFailedSync, captureError } from "@/lib/error-reporting";
import {
  generateWeeklyReview,
  compareToBaseline,
  generateWeeklyInsight,
} from "@aura/mental-engine";
import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  CopingSession,
  MentalJournalEntry,
  WeeklyReviewData,
  WeeklyTrendData,
  InterventionType,
} from "@aura/types";

const INTERVENTION_LABELS: Record<InterventionType, string> = {
  breathing: "Breathing",
  grounding: "Grounding",
  body_scan: "Body Scan",
  calm_audio: "Calm Audio",
  journal_prompt: "Journaling",
};

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const statCardWidth = Math.floor((safeContentWidth - 24) / 3);

  // Data state
  const [baseline, setBaseline] = useState<MentalBaseline | null>(null);
  const [checkIns, setCheckIns] = useState<MentalDailyCheckIn[]>([]);
  const [scans, setScans] = useState<RppgScanResult[]>([]);
  const [copingSessions, setCopingSessions] = useState<CopingSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<MentalJournalEntry[]>(
    [],
  );
  const [existingReview, setExistingReview] = useState<WeeklyReviewData | null>(
    null,
  );

  // UI state
  const [reflectionText, setReflectionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [newReview, setNewReview] = useState<WeeklyReviewData | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getMentalBaseline();
        const ci = await getMentalCheckInHistory(30);
        const sc = await getRppgHistory();
        const cs = await getCopingSessions();
        const je = await getJournalEntries();
        const lr = await getLatestWeeklyReview();

        setBaseline(bl);
        setCheckIns(ci);
        setScans(sc);
        setCopingSessions(cs);
        setJournalEntries(je);
        setExistingReview(lr);
      })();
    }, []),
  );

  // Compute data for display
  const last7 = checkIns.slice(-7);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const weekScans = scans.filter((s) => s.scannedAtIso >= weekAgo);
  const weekCoping = copingSessions.filter(
    (s) => s.completed && s.completedAtIso >= weekAgo,
  );
  const weekJournals = journalEntries.filter((j) => j.createdAtIso >= weekAgo);

  // Trend data (build from check-ins)
  const moodTrend = buildDailyTrend(last7, (c) => c.moodScore);
  const stressTrend = buildDailyTrend(last7, (c) => c.stressScoreManual);
  const sleepTrend = buildDailyTrend(last7, (c) => c.sleepHours);

  // Most effective intervention
  const interventionCounts = new Map<InterventionType, number>();
  for (const s of weekCoping) {
    interventionCounts.set(
      s.interventionType,
      (interventionCounts.get(s.interventionType) ?? 0) + 1,
    );
  }
  const bestIntervention = [...interventionCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0];

  // Baseline comparison
  const comparison = baseline ? compareToBaseline(baseline, checkIns) : null;

  // Weekly insight
  const trendData: WeeklyTrendData | null =
    existingReview?.trend ??
    (last7.length > 0
      ? {
          moodTrend,
          stressTrend,
          sleepTrend,
          anxietyTrend: buildDailyTrend(last7, (c) => c.anxietyScore),
          energyTrend: buildDailyTrend(last7, (c) => c.energyScore),
          focusTrend: buildDailyTrend(last7, (c) => c.focusScore),
          scanFrequency: weekScans.length,
          copingSessionsCount: weekCoping.length,
          journalEntriesCount: weekJournals.length,
          escalationEvents: last7.filter((c) => c.stressScoreManual >= 8)
            .length,
        }
      : null);
  const insightMessage = trendData ? generateWeeklyInsight(trendData) : null;

  const handleSubmit = useCallback(async () => {
    if (!baseline) return;
    setSubmitting(true);

    try {
      const review = generateWeeklyReview({
        userId: "local",
        baseline,
        checkIns,
        scans,
        copingSessions,
        journalEntries,
        contentProgress: [],
        userNotes: reflectionText.trim() || undefined,
      });

      // Save locally
      await saveWeeklyReview(review);
      if (review.newPlanVersion) {
        await saveMentalPlan(review.newPlanVersion);
      }

      // Sync to API
      try {
        await api.post("/mental/weekly-review", {
          trend: review.trend,
          newPlanVersion: review.newPlanVersion ?? undefined,
          notes: reflectionText.trim() || undefined,
        });
      } catch (err) {
        recordFailedSync("mental weekly review sync", err);
      }

      setNewReview(review);
      setSubmitted(true);
    } catch (err) {
      captureError(err, { context: "mental weekly review engine" });
      setSubmitted(true);
    }

    setSubmitting(false);
  }, [
    baseline,
    checkIns,
    scans,
    copingSessions,
    journalEntries,
    reflectionText,
  ]);

  // ── Submitted success state ──
  if (submitted && newReview) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7]">
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center pt-10 pb-6">
            <Text style={{ fontSize: 60 }}>📊</Text>
            <Text className="text-[28px] font-bold text-black text-center mt-4 tracking-tight">
              Review Saved
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mt-2">
              Your plan has been updated for next week.
            </Text>
          </View>

          {/* Updated plan summary */}
          {newReview.newPlanVersion && (
            <GlassCard className="p-4 mb-4">
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                Updated Plan
              </Text>
              <Text className="text-[15px] font-bold text-black mb-2">
                Focus:{" "}
                {newReview.newPlanVersion.focusAreas.slice(0, 2).join(" · ")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {newReview.newPlanVersion.weeklyGoals
                  .slice(0, 3)
                  .map((goal) => (
                    <View
                      key={goal}
                      className="bg-[#AF52DE10] px-2.5 py-1 rounded-full"
                    >
                      <Text className="text-[11px] font-semibold text-[#AF52DE]">
                        {goal}
                      </Text>
                    </View>
                  ))}
              </View>
            </GlassCard>
          )}

          <Pressable
            onPress={() => router.back()}
            className="rounded-2xl py-4 items-center bg-[#AF52DE] mb-10"
          >
            <Text className="text-white text-[17px] font-semibold">
              Return to Hub
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

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
          Weekly Review
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="pt-4 pb-10">
            {/* Title */}
            <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
              Your week in one view
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mb-5">
              {last7.length} check-in{last7.length !== 1 ? "s" : ""} ·{" "}
              {weekScans.length} scan{weekScans.length !== 1 ? "s" : ""} ·{" "}
              {weekCoping.length} session{weekCoping.length !== 1 ? "s" : ""}
            </Text>

            {/* ── Trend Charts ── */}
            {last7.length > 0 ? (
              <>
                <TrendChart
                  data={moodTrend}
                  label="Mood"
                  color="#AF52DE"
                  unit="/10"
                />
                <TrendChart
                  data={stressTrend}
                  label="Stress"
                  color="#FF3B30"
                  unit="/10"
                  invertGood
                />
                <TrendChart
                  data={sleepTrend}
                  label="Sleep"
                  color="#5856D6"
                  unit="h"
                  barChart
                />
              </>
            ) : (
              <GlassCard className="p-6 mb-4 items-center">
                <Text style={{ fontSize: 32 }}>📋</Text>
                <Text className="text-[15px] text-[#8A8A8E] mt-2 text-center">
                  No check-ins this week. Complete daily check-ins to see your
                  trends.
                </Text>
              </GlassCard>
            )}

            {/* ── Stats Row ── */}
            <View className="flex-row gap-3 mb-4 justify-between">
              <View style={{ width: statCardWidth }}>
                <GlassCard className="p-3 items-center">
                  <Text style={{ fontSize: 22 }}>📸</Text>
                  <Text className="text-[20px] font-bold text-black mt-1">
                    {weekScans.length}
                  </Text>
                  <Text className="text-[11px] text-[#8A8A8E] font-medium">
                    Scans
                  </Text>
                </GlassCard>
              </View>
              <View style={{ width: statCardWidth }}>
                <GlassCard className="p-3 items-center">
                  <Text style={{ fontSize: 22 }}>🧘</Text>
                  <Text className="text-[20px] font-bold text-black mt-1">
                    {weekCoping.length}
                  </Text>
                  <Text className="text-[11px] text-[#8A8A8E] font-medium">
                    Sessions
                  </Text>
                </GlassCard>
              </View>
              <View style={{ width: statCardWidth }}>
                <GlassCard className="p-3 items-center">
                  <Text style={{ fontSize: 22 }}>📔</Text>
                  <Text className="text-[20px] font-bold text-black mt-1">
                    {weekJournals.length}
                  </Text>
                  <Text className="text-[11px] text-[#8A8A8E] font-medium">
                    Journal
                  </Text>
                </GlassCard>
              </View>
            </View>

            {/* Most effective intervention */}
            {bestIntervention && (
              <GlassCard
                className="p-4 mb-4"
                style={{ backgroundColor: "#34C75908" }}
              >
                <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-1">
                  Most Used Intervention
                </Text>
                <Text className="text-[15px] font-bold text-[#34C759]">
                  {INTERVENTION_LABELS[bestIntervention[0]] ??
                    bestIntervention[0]}{" "}
                  ({bestIntervention[1]}×)
                </Text>
              </GlassCard>
            )}

            {/* ── Baseline Comparison ── */}
            {baseline && last7.length > 0 && (
              <WeeklyComparisonChart
                fields={[
                  {
                    label: "Mood",
                    baseline: baseline.moodBase,
                    current: avg(last7, (c) => c.moodScore),
                  },
                  {
                    label: "Stress",
                    baseline: baseline.stressBase,
                    current: avg(last7, (c) => c.stressScoreManual),
                    invertGood: true,
                  },
                  {
                    label: "Sleep",
                    baseline: 7,
                    current: avg(last7, (c) => c.sleepHours),
                  },
                ]}
              />
            )}

            {/* Comparison summary */}
            {comparison && (
              <GlassCard className="p-4 mb-4">
                <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
                  {comparison.summary}
                </Text>
              </GlassCard>
            )}

            {/* ── Weekly Insight ── */}
            {insightMessage && (
              <InsightCard
                icon="💡"
                title="Weekly Insight"
                description={insightMessage}
                level="neutral"
              />
            )}

            {/* ── Reflection ── */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-2 mb-3">
              Reflection
            </Text>
            <Text className="text-[15px] text-[#3C3C43] mb-3 leading-relaxed italic">
              "What helped most this week, and what should change next week?"
            </Text>
            <GlassCard className="p-4 mb-6">
              <TextInput
                value={reflectionText}
                onChangeText={setReflectionText}
                placeholder="Write your reflection here..."
                placeholderTextColor="#C6C6C8"
                multiline
                textAlignVertical="top"
                className="text-[15px] text-black leading-relaxed"
                style={{ minHeight: 100 }}
              />
            </GlassCard>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !baseline}
              className="rounded-2xl py-4 items-center mb-4"
              style={{
                backgroundColor:
                  submitting || !baseline ? "#C6C6C8" : "#AF52DE",
              }}
            >
              <Text className="text-white text-[17px] font-semibold">
                {submitting ? "Generating new plan..." : "Submit & Update Plan"}
              </Text>
            </Pressable>

            {!baseline && (
              <Text className="text-[12px] text-[#8A8A8E] text-center">
                Complete the mental assessment first to enable weekly reviews.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildDailyTrend(
  checkIns: MentalDailyCheckIn[],
  extractor: (c: MentalDailyCheckIn) => number,
): number[] {
  const dayMap = new Map<string, number[]>();
  for (const c of checkIns) {
    const day = c.dateIso.split("T")[0];
    const vals = dayMap.get(day) ?? [];
    vals.push(extractor(c));
    dayMap.set(day, vals);
  }

  const result: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    const vals = dayMap.get(key);
    result.push(
      vals && vals.length > 0
        ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
        : 0,
    );
  }
  return result;
}

function avg(
  checkIns: MentalDailyCheckIn[],
  extractor: (c: MentalDailyCheckIn) => number,
): number {
  if (checkIns.length === 0) return 0;
  const sum = checkIns.reduce((s, c) => s + extractor(c), 0);
  return Math.round((sum / checkIns.length) * 10) / 10;
}
