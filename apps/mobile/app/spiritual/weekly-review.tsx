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
import {
  getSpiritualBaseline,
  getSpiritualCheckInHistory,
  getPracticeSessions,
  getSpiritualJournals,
  getLatestSpiritualWeeklyReview,
  saveSpiritualWeeklyReview,
  saveSpiritualPlan,
} from "@/lib/spiritual-store";
import { updateProfile } from "@/lib/user-store";
import { api } from "@/lib/api";
import {
  generateSpiritualWeeklyReview,
  shouldChangePlan,
  generateWeeklyInsight,
  generateSpiritualPlan,
} from "@aura/spiritual-engine";
import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualPracticeSession,
  SpiritualJournalEntry,
  SpiritualWeeklyReview,
  SpiritualPracticeType,
  SpiritualBlockerTag,
} from "@aura/types";
import { SPIRITUAL_PRACTICE_TYPES, SPIRITUAL_BLOCKER_TAGS } from "@aura/types";

const TEAL = "#30B0C7";

const FREQUENCY_LABELS = [
  "Never",
  "Rarely",
  "Sometimes",
  "Often",
  "Very often",
];

const PRACTICE_LABELS: Record<string, { emoji: string; label: string }> = {
  meditation: { emoji: "🧘", label: "Meditation" },
  breathwork: { emoji: "🌬️", label: "Breathwork" },
  prayer: { emoji: "🙏", label: "Prayer" },
  gratitude: { emoji: "💛", label: "Gratitude" },
  journaling: { emoji: "📝", label: "Journaling" },
  nature: { emoji: "🌳", label: "Nature" },
  soundscape: { emoji: "🎵", label: "Soundscape" },
  silent_sitting: { emoji: "🤫", label: "Silent Sitting" },
  kindness_act: { emoji: "💗", label: "Kindness" },
};

const BLOCKER_LABELS: Record<string, { emoji: string; label: string }> = {
  work: { emoji: "💼", label: "Work" },
  conflict: { emoji: "⚡", label: "Conflict" },
  phone_overload: { emoji: "📱", label: "Phone" },
  loneliness: { emoji: "😞", label: "Loneliness" },
  worry: { emoji: "😰", label: "Worry" },
  health: { emoji: "🤒", label: "Health" },
  other: { emoji: "❓", label: "Other" },
};

const INTENSITY_OPTIONS = [
  {
    value: "increase" as const,
    label: "Increase",
    emoji: "📈",
    desc: "I want more",
  },
  {
    value: "keep" as const,
    label: "Keep same",
    emoji: "➡️",
    desc: "This is right",
  },
  {
    value: "reduce" as const,
    label: "Reduce",
    emoji: "📉",
    desc: "I need less",
  },
];

export default function SpiritualWeeklyReviewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const statCardWidth = Math.floor((safeContentWidth - 24) / 3);
  const threeColCardWidth = Math.floor((safeContentWidth - 16) / 3);

  // ── Data state ──
  const [baseline, setBaseline] = useState<SpiritualBaseline | null>(null);
  const [checkIns, setCheckIns] = useState<SpiritualDailyCheckIn[]>([]);
  const [practiceSessions, setPracticeSessions] = useState<
    SpiritualPracticeSession[]
  >([]);
  const [journalEntries, setJournalEntries] = useState<SpiritualJournalEntry[]>(
    [],
  );

  // ── Form state (8 questions) ──
  const [calmFreq, setCalmFreq] = useState(2);
  const [presenceFreq, setPresenceFreq] = useState(2);
  const [practiceRecovery, setPracticeRecovery] = useState(2);
  const [gratitudeFreq, setGratitudeFreq] = useState(2);
  const [connectionFreq, setConnectionFreq] = useState(2);
  const [helpedMost, setHelpedMost] = useState<SpiritualPracticeType | null>(
    null,
  );
  const [hurtMost, setHurtMost] = useState<SpiritualBlockerTag | null>(null);
  const [planIntensity, setPlanIntensity] = useState<
    "increase" | "keep" | "reduce"
  >("keep");

  // ── UI state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedReview, setSavedReview] = useState<SpiritualWeeklyReview | null>(
    null,
  );
  const [insightText, setInsightText] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setBaseline(await getSpiritualBaseline());
        setCheckIns(await getSpiritualCheckInHistory(7));
        setPracticeSessions(await getPracticeSessions());
        setJournalEntries(await getSpiritualJournals());
      })();
    }, []),
  );

  // ── Computed stats ──
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weekPractice = practiceSessions.filter((s) => s.completedAt >= weekAgo);
  const weekJournals = journalEntries.filter((j) => j.createdAt >= weekAgo);
  const totalPracticeMin = weekPractice.reduce(
    (s, p) => s + p.durationMinutes,
    0,
  );
  const avgCalm =
    checkIns.length > 0
      ? Math.round(
          (checkIns.reduce((s, c) => s + c.calmScore, 0) / checkIns.length) *
            10,
        ) / 10
      : 0;

  async function handleSubmit() {
    if (!baseline) return;
    setSubmitting(true);

    try {
      const now = new Date();
      const weekStart = new Date(now.getTime() - 7 * 86400000)
        .toISOString()
        .split("T")[0];
      const weekEnd = now.toISOString().split("T")[0];

      // Compute score change
      const previousScore = baseline.totalScore;
      const newCalmAvg = avgCalm * 10; // scale 0-100
      const calmScoreChange = Math.round(newCalmAvg - previousScore);

      // Build engagement summary
      const engagementParts = [];
      if (checkIns.length > 0)
        engagementParts.push(`${checkIns.length} check-ins`);
      if (weekPractice.length > 0)
        engagementParts.push(
          `${weekPractice.length} practices (${totalPracticeMin}min)`,
        );
      if (weekJournals.length > 0)
        engagementParts.push(`${weekJournals.length} journal entries`);

      const review: SpiritualWeeklyReview = {
        id: `swr_${Date.now().toString(36)}`,
        weekStart,
        weekEnd,
        calmFrequency: calmFreq,
        presenceFrequency: presenceFreq,
        practiceRecovery,
        gratitudeFrequency: gratitudeFreq,
        connectionFrequency: connectionFreq,
        whatHelpedMost: helpedMost,
        whatHurtMost: hurtMost,
        planIntensity,
        calmScoreChange,
        engagementSummary: engagementParts.join(" · ") || null,
        createdAt: now.toISOString(),
      };

      // Save locally
      await saveSpiritualWeeklyReview(review);

      // Generate new plan if needed
      const currentPlan = generateSpiritualPlan(baseline, checkIns);
      if (shouldChangePlan(review, currentPlan)) {
        const newPlan = generateSpiritualPlan(baseline, checkIns);
        await saveSpiritualPlan(newPlan);
      }

      // Update spiritual score
      const updatedScore = Math.max(
        0,
        Math.min(100, baseline.totalScore + calmScoreChange),
      );
      await updateProfile({ scoreSpiritual: updatedScore });

      // Generate insight
      try {
        const insight = generateWeeklyInsight(review, baseline);
        setInsightText(insight);
      } catch {
        // engine may not produce insight
      }

      // Sync to API
      try {
        await api.post("/spiritual/weekly-review", review);
      } catch {
        /* offline-first */
      }

      setSavedReview(review);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }

    setSubmitting(false);
  }

  // ── Submitted success state ──
  if (submitted) {
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

          {/* Score change */}
          {savedReview && (
            <GlassCard
              className="p-5 items-center mb-4"
              style={{ borderTopWidth: 3, borderTopColor: TEAL }}
            >
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                Calm Score Change
              </Text>
              <Text
                className="text-[32px] font-bold"
                style={{
                  color:
                    savedReview.calmScoreChange > 0
                      ? "#34C759"
                      : savedReview.calmScoreChange < 0
                        ? "#FF3B30"
                        : "#8A8A8E",
                }}
              >
                {savedReview.calmScoreChange > 0 ? "+" : ""}
                {savedReview.calmScoreChange}
              </Text>
              {savedReview.engagementSummary && (
                <Text className="text-[13px] text-[#8A8A8E] mt-1 text-center">
                  {savedReview.engagementSummary}
                </Text>
              )}
            </GlassCard>
          )}

          {/* Insight */}
          {insightText && (
            <GlassCard
              className="p-4 mb-4"
              style={{ borderLeftWidth: 3, borderLeftColor: TEAL }}
            >
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-1">
                💡 Weekly Insight
              </Text>
              <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
                {insightText}
              </Text>
            </GlassCard>
          )}

          <Pressable
            onPress={() => router.back()}
            className="rounded-2xl py-4 items-center mb-10"
            style={{ backgroundColor: TEAL }}
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
            <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
              Your week at a glance
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mb-5">
              {checkIns.length} check-in{checkIns.length !== 1 ? "s" : ""} ·{" "}
              {weekPractice.length} practice
              {weekPractice.length !== 1 ? "s" : ""} · {weekJournals.length}{" "}
              journal{weekJournals.length !== 1 ? "s" : ""}
            </Text>

            {/* Stats row */}
            <View className="flex-row gap-3 mb-5 justify-between">
              <View style={{ width: statCardWidth }}>
                <GlassCard className="p-3 items-center">
                  <Text style={{ fontSize: 22 }}>😌</Text>
                  <Text className="text-[20px] font-bold text-black mt-1">
                    {avgCalm}
                  </Text>
                  <Text className="text-[11px] text-[#8A8A8E] font-medium">
                    Avg Calm
                  </Text>
                </GlassCard>
              </View>
              <View style={{ width: statCardWidth }}>
                <GlassCard className="p-3 items-center">
                  <Text style={{ fontSize: 22 }}>🧘</Text>
                  <Text className="text-[20px] font-bold text-black mt-1">
                    {totalPracticeMin}
                  </Text>
                  <Text className="text-[11px] text-[#8A8A8E] font-medium">
                    Practice min
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
                    Journals
                  </Text>
                </GlassCard>
              </View>
            </View>

            {/* ── 5 Frequency Questions ── */}
            <FrequencyQuestion
              index={1}
              question="How often did you feel calm this week?"
              value={calmFreq}
              onChange={setCalmFreq}
            />
            <FrequencyQuestion
              index={2}
              question="How often did you feel present rather than on autopilot?"
              value={presenceFreq}
              onChange={setPresenceFreq}
            />
            <FrequencyQuestion
              index={3}
              question="How often did your practices help you recover from stress?"
              value={practiceRecovery}
              onChange={setPracticeRecovery}
            />
            <FrequencyQuestion
              index={4}
              question="How often did you feel gratitude or appreciation?"
              value={gratitudeFreq}
              onChange={setGratitudeFreq}
            />
            <FrequencyQuestion
              index={5}
              question="How often did you feel connected to others or something larger?"
              value={connectionFreq}
              onChange={setConnectionFreq}
            />

            {/* ── Q6: What helped most ── */}
            <Text className="text-[14px] font-semibold text-black mb-3">
              6. What helped most this week?
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {SPIRITUAL_PRACTICE_TYPES.map((type) => {
                const active = helpedMost === type;
                const info = PRACTICE_LABELS[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => setHelpedMost(active ? null : type)}
                    className="flex-row items-center gap-1 px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? TEAL : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? TEAL : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{info?.emoji ?? "📖"}</Text>
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {info?.label ?? type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Q7: What hurt calm most ── */}
            <Text className="text-[14px] font-semibold text-black mb-3">
              7. What hurt your calm most this week?
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {SPIRITUAL_BLOCKER_TAGS.map((tag) => {
                const active = hurtMost === tag;
                const info = BLOCKER_LABELS[tag];
                return (
                  <Pressable
                    key={tag}
                    onPress={() => setHurtMost(active ? null : tag)}
                    className="flex-row items-center gap-1 px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? "#FF9500" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#FF9500" : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{info?.emoji ?? "❓"}</Text>
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {info?.label ?? tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Q8: Plan intensity ── */}
            <Text className="text-[14px] font-semibold text-black mb-3">
              8. Do you want the app to adjust your plan intensity?
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: safeContentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {INTENSITY_OPTIONS.map((opt) => {
                const active = planIntensity === opt.value;
                return (
                  <View key={opt.value} style={{ width: threeColCardWidth }}>
                    <Pressable
                      onPress={() => setPlanIntensity(opt.value)}
                      className="py-3.5 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{opt.emoji}</Text>
                      <Text
                        className="text-[13px] font-semibold mt-1"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        className="text-[10px] mt-0.5"
                        style={{ color: active ? "#fff" : "#8A8A8E" }}
                      >
                        {opt.desc}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !baseline}
              className="rounded-2xl py-4 items-center mb-4"
              style={{
                backgroundColor: submitting || !baseline ? "#C6C6C8" : TEAL,
              }}
            >
              <Text className="text-white text-[17px] font-semibold">
                {submitting ? "Generating new plan..." : "Submit & Update Plan"}
              </Text>
            </Pressable>

            {!baseline && (
              <Text className="text-[12px] text-[#8A8A8E] text-center">
                Complete the Inner Calm assessment first to enable weekly
                reviews.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Frequency Question Component ──────────────────────────────────────────

function FrequencyQuestion({
  index,
  question,
  value,
  onChange,
}: {
  index: number;
  question: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="mb-5">
      <Text className="text-[14px] font-semibold text-black mb-3">
        {index}. {question}
      </Text>
      <View className="flex-row flex-wrap justify-between">
        {FREQUENCY_LABELS.map((label, i) => {
          const active = value === i;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i)}
              className="flex-1 py-2.5 rounded-xl items-center"
              style={{
                width: "19%",
                backgroundColor: active ? TEAL : "#fff",
                borderWidth: 1.5,
                borderColor: active ? TEAL : "#E5E5EA",
              }}
            >
              <Text
                className="text-[10px] font-semibold"
                style={{ color: active ? "#fff" : "#3C3C43" }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
