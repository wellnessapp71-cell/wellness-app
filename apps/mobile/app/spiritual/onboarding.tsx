import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { saveSpiritualBaseline, saveSpiritualPlan } from "@/lib/spiritual-store";
import { updateProfile } from "@/lib/user-store";
import { api } from "@/lib/api";
import {
  buildSpiritualBaseline,
  generateInitialPlan,
  SPIRITUAL_QUESTIONS,
  LIKERT_LABELS,
  DOMAIN_RANGES,
} from "@aura/spiritual-engine";
import type { SpiritualBaseline, SpiritualWellnessPlan } from "@aura/types";

const TEAL = "#30B0C7";
const TOTAL_STEPS = 8; // 0=welcome, 1-5=questions, 6=preferences, 7=summary

const DOMAIN_INFO = [
  { key: "meaning", label: "Meaning & Purpose", emoji: "🌟", subtitle: "5 questions about your sense of purpose and values" },
  { key: "peace", label: "Inner Peace", emoji: "🕊️", subtitle: "5 questions about calm and emotional settling" },
  { key: "mindfulness", label: "Mindful Presence", emoji: "🧘", subtitle: "5 questions about attention and awareness" },
  { key: "connection", label: "Connection", emoji: "🤝", subtitle: "5 questions about belonging and gratitude" },
  { key: "practice", label: "Daily Practices", emoji: "🌿", subtitle: "4 questions about your current routines" },
] as const;

const PRACTICE_TIME_OPTIONS = [
  { value: "morning", label: "🌅 Morning", desc: "Before 10am" },
  { value: "evening", label: "🌙 Evening", desc: "After 6pm" },
  { value: "anytime", label: "⏰ Anytime", desc: "No preference" },
];

const SUPPORT_STYLE_OPTIONS = [
  { value: "guided", label: "🎧 Guided", desc: "Audio/video led" },
  { value: "self_directed", label: "📝 Self-directed", desc: "Journaling & prompts" },
  { value: "community", label: "💬 Community", desc: "Group sessions" },
];

export default function SpiritualOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // 24 answers (0-4 each, default 2 = "Sometimes")
  const [answers, setAnswers] = useState<number[]>(new Array(24).fill(2));

  // Preferences (step 6)
  const [practiceTime, setPracticeTime] = useState<string>("morning");
  const [supportStyle, setSupportStyle] = useState<string>("guided");

  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState<SpiritualBaseline | null>(null);
  const [plan, setPlan] = useState<SpiritualWellnessPlan | null>(null);

  function updateAnswer(globalIndex: number, value: number) {
    setAnswers((prev) => prev.map((v, i) => (i === globalIndex ? value : v)));
  }

  function getQuestionsForStep(stepIdx: number) {
    const domainIdx = stepIdx - 1; // steps 1-5
    const domainKey = DOMAIN_INFO[domainIdx].key as keyof typeof DOMAIN_RANGES;
    const range = DOMAIN_RANGES[domainKey];
    return SPIRITUAL_QUESTIONS.slice(range.start, range.start + range.count).map((q, i) => ({
      ...q,
      globalIndex: range.start + i,
    }));
  }

  async function handleSubmit() {
    setSaving(true);

    try {
      const bl = buildSpiritualBaseline(answers, {
        preferredPracticeTime: practiceTime,
        preferredSupportStyle: supportStyle,
      });

      const generatedPlan = generateInitialPlan(bl);

      // Save locally
      await saveSpiritualBaseline(bl);
      await saveSpiritualPlan(generatedPlan);

      // Update unified profile — mark spiritual onboarding done & update spiritual score
      await updateProfile({
        spiritualOnboardingDone: true,
        scoreSpiritual: bl.totalScore,
      });

      // Sync to API (fire & forget)
      try {
        await api.post("/spiritual/baseline", {
          meaningScore: bl.meaningScore,
          peaceScore: bl.peaceScore,
          mindfulnessScore: bl.mindfulnessScore,
          connectionScore: bl.connectionScore,
          practiceScore: bl.practiceScore,
          totalScore: bl.totalScore,
          band: bl.band,
          weakestDomain: bl.weakestDomain,
          preferredPracticeTime: bl.preferredPracticeTime,
          preferredSupportStyle: bl.preferredSupportStyle,
          rawAnswers: bl.rawAnswers,
        });
      } catch {
        // local save is enough
      }

      setBaseline(bl);
      setPlan(generatedPlan);
      setStep(TOTAL_STEPS - 1); // go to summary
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (step === 6) {
      // Preferences step → generate plan
      handleSubmit();
    } else if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  }

  function goBack() {
    if (step > 0) setStep(step - 1);
    else router.back();
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={goBack}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight flex-1">
          Inner Calm Assessment
        </Text>
        <Text className="text-[14px] text-[#8A8A8E] font-medium">
          {step + 1}/{TOTAL_STEPS}
        </Text>
      </View>

      {/* Progress dots */}
      <View className="flex-row gap-2 px-6 mb-4 mt-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View
            key={i}
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: i <= step ? TEAL : "#E5E5EA" }}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <StepWelcome />}
        {step >= 1 && step <= 5 && (
          <StepDomain
            domainInfo={DOMAIN_INFO[step - 1]}
            questions={getQuestionsForStep(step)}
            answers={answers}
            onAnswerChange={updateAnswer}
          />
        )}
        {step === 6 && (
          <StepPreferences
            practiceTime={practiceTime}
            setPracticeTime={setPracticeTime}
            supportStyle={supportStyle}
            setSupportStyle={setSupportStyle}
          />
        )}
        {step === 7 && <StepSummary baseline={baseline} plan={plan} />}

        <View className="h-6" />
      </ScrollView>

      {/* Bottom button */}
      <View className="px-6 pb-6 pt-2">
        {step === 7 ? (
          <Pressable
            onPress={() => router.replace("/spiritual/hub")}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: TEAL }}
          >
            <Text className="text-white text-[17px] font-semibold">Go to Inner Calm Hub</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={goNext}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : TEAL }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving ? "Creating your plan..." : step === 6 ? "Create my inner calm plan" : "Continue"}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Step Components ──────────────────────────────────────────────────────────

function StepWelcome() {
  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>🕊️</Text>
      <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
        Inner Calm
      </Text>
      <Text className="text-[17px] text-[#3C3C43] text-center mt-3 leading-relaxed px-4">
        Let's understand your inner balance so we can personalise your spiritual wellbeing support.
      </Text>
      <GlassCard className="p-4 mt-6">
        <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
          What we'll cover
        </Text>
        {[
          { icon: "🌟", title: "Meaning & Purpose", desc: "5 questions about your sense of direction" },
          { icon: "🕊️", title: "Inner Peace", desc: "5 questions about calm and emotional balance" },
          { icon: "🧘", title: "Mindful Presence", desc: "5 questions about attention and awareness" },
          { icon: "🤝", title: "Connection", desc: "5 questions about belonging and gratitude" },
          { icon: "🌿", title: "Daily Practices", desc: "4 questions about meditation, prayer, nature" },
        ].map((item) => (
          <View key={item.title} className="flex-row items-center gap-3 mb-3">
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black">{item.title}</Text>
              <Text className="text-[13px] text-[#8A8A8E]">{item.desc}</Text>
            </View>
          </View>
        ))}
      </GlassCard>
      <GlassCard className="p-4 mt-4" style={{ backgroundColor: TEAL + "08" }}>
        <Text className="text-[13px] font-medium text-center leading-relaxed" style={{ color: TEAL }}>
          🔒 Your answers are private and stored locally on your device. Takes about 3 minutes.
        </Text>
      </GlassCard>
    </View>
  );
}

function StepDomain({
  domainInfo,
  questions,
  answers,
  onAnswerChange,
}: {
  domainInfo: { label: string; emoji: string; subtitle: string };
  questions: { id: string; text: string; reverseScored: boolean; globalIndex: number }[];
  answers: number[];
  onAnswerChange: (globalIndex: number, value: number) => void;
}) {
  return (
    <View className="pt-2">
      <Text style={{ fontSize: 36, textAlign: "center" }}>{domainInfo.emoji}</Text>
      <Text className="text-[22px] font-bold text-black tracking-tight text-center mt-2 mb-1">
        {domainInfo.label}
      </Text>
      <Text className="text-[14px] text-[#8A8A8E] text-center mb-5 leading-relaxed">
        {domainInfo.subtitle}
      </Text>
      {questions.map((q, i) => (
        <LikertQuestion
          key={q.id}
          index={i + 1}
          question={q.text}
          value={answers[q.globalIndex]}
          onChange={(v) => onAnswerChange(q.globalIndex, v)}
        />
      ))}
    </View>
  );
}

function StepPreferences({
  practiceTime,
  setPracticeTime,
  supportStyle,
  setSupportStyle,
}: {
  practiceTime: string;
  setPracticeTime: (v: string) => void;
  supportStyle: string;
  setSupportStyle: (v: string) => void;
}) {
  return (
    <View className="pt-2">
      <Text style={{ fontSize: 36, textAlign: "center" }}>⚙️</Text>
      <Text className="text-[22px] font-bold text-black tracking-tight text-center mt-2 mb-4">
        Your Preferences
      </Text>

      {/* Practice time */}
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
        Preferred practice time
      </Text>
      <View className="gap-2 mb-6">
        {PRACTICE_TIME_OPTIONS.map((opt) => {
          const active = practiceTime === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setPracticeTime(opt.value)}
              className="flex-row items-center gap-3 p-4 rounded-2xl"
              style={{
                backgroundColor: active ? TEAL + "12" : "#fff",
                borderWidth: 1.5,
                borderColor: active ? TEAL : "#E5E5EA",
              }}
            >
              <Text style={{ fontSize: 20 }}>{opt.label.split(" ")[0]}</Text>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold" style={{ color: active ? TEAL : "#000" }}>
                  {opt.label.split(" ").slice(1).join(" ")}
                </Text>
                <Text className="text-[12px] text-[#8A8A8E]">{opt.desc}</Text>
              </View>
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: active ? TEAL : "transparent",
                  borderWidth: 2,
                  borderColor: active ? TEAL : "#E5E5EA",
                }}
              >
                {active && <Text className="text-white text-[12px] font-bold">✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Support style */}
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
        How do you prefer to practice?
      </Text>
      <View className="gap-2 mb-6">
        {SUPPORT_STYLE_OPTIONS.map((opt) => {
          const active = supportStyle === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setSupportStyle(opt.value)}
              className="flex-row items-center gap-3 p-4 rounded-2xl"
              style={{
                backgroundColor: active ? TEAL + "12" : "#fff",
                borderWidth: 1.5,
                borderColor: active ? TEAL : "#E5E5EA",
              }}
            >
              <Text style={{ fontSize: 20 }}>{opt.label.split(" ")[0]}</Text>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold" style={{ color: active ? TEAL : "#000" }}>
                  {opt.label.split(" ").slice(1).join(" ")}
                </Text>
                <Text className="text-[12px] text-[#8A8A8E]">{opt.desc}</Text>
              </View>
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: active ? TEAL : "transparent",
                  borderWidth: 2,
                  borderColor: active ? TEAL : "#E5E5EA",
                }}
              >
                {active && <Text className="text-white text-[12px] font-bold">✓</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StepSummary({
  baseline,
  plan,
}: {
  baseline: SpiritualBaseline | null;
  plan: SpiritualWellnessPlan | null;
}) {
  if (!baseline || !plan) {
    return (
      <View className="pt-10 items-center">
        <Text className="text-[17px] text-[#8A8A8E]">Generating your plan...</Text>
      </View>
    );
  }

  const bandEmoji = baseline.band === "green" ? "🌟" : baseline.band === "yellow" ? "🌤️" : baseline.band === "orange" ? "🌥️" : "🌧️";
  const bandLabel = baseline.band === "green" ? "Strong" : baseline.band === "yellow" ? "Healthy" : baseline.band === "orange" ? "Needs Attention" : "Needs Support";

  const domainScores = [
    { label: "Meaning", score: baseline.meaningScore, icon: "🌟" },
    { label: "Peace", score: baseline.peaceScore, icon: "🕊️" },
    { label: "Mindfulness", score: baseline.mindfulnessScore, icon: "🧘" },
    { label: "Connection", score: baseline.connectionScore, icon: "🤝" },
    { label: "Practice", score: baseline.practiceScore, icon: "🌿" },
  ];

  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>{bandEmoji}</Text>
      <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
        Your Inner Calm Profile
      </Text>
      <Text className="text-[15px] text-[#8A8A8E] text-center mt-2 mb-6 leading-relaxed">
        We've created a personalised plan based on your answers.
      </Text>

      {/* Composite Score */}
      <GlassCard className="p-5 items-center mb-4" style={{ borderTopWidth: 3, borderTopColor: TEAL }}>
        <Text className="text-[48px] font-bold" style={{ color: TEAL }}>{baseline.totalScore}</Text>
        <Text className="text-[14px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-1">
          Inner Calm Score
        </Text>
        <View className="px-3 py-1 rounded-full mt-2" style={{ backgroundColor: TEAL + "15" }}>
          <Text className="text-[13px] font-semibold" style={{ color: TEAL }}>{bandLabel}</Text>
        </View>
      </GlassCard>

      {/* Domain Scores */}
      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
          Domain Breakdown
        </Text>
        {domainScores.map((d) => (
          <View key={d.label} className="flex-row items-center mb-3">
            <Text style={{ fontSize: 18, width: 28 }}>{d.icon}</Text>
            <Text className="text-[14px] font-medium text-black flex-1">{d.label}</Text>
            <Text className="text-[16px] font-bold text-black mr-3">{d.score}</Text>
            <View className="w-20 h-2 bg-[#E5E5EA] rounded-full">
              <View
                className="h-2 rounded-full"
                style={{
                  width: `${Math.min(100, d.score)}%`,
                  backgroundColor: d.score >= 70 ? "#34C759" : d.score >= 50 ? TEAL : d.score >= 30 ? "#FF9500" : "#FF3B30",
                }}
              />
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Focus area */}
      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Your Focus Area
        </Text>
        <Text className="text-[17px] font-bold text-black capitalize">
          {plan.focusDomain.replace(/_/g, " ")}
        </Text>
        <Text className="text-[14px] text-[#3C3C43] mt-1">
          {plan.primaryGoal}
        </Text>
      </GlassCard>

      {/* Daily anchor habit */}
      <GlassCard className="p-4 mb-4" style={{ backgroundColor: TEAL + "08" }}>
        <Text className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: TEAL }}>
          Your Daily Habit
        </Text>
        <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
          {plan.dailyAnchorHabit}
        </Text>
      </GlassCard>

      {/* Content bundle */}
      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Recommended Content
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {plan.contentBundle.map((content) => (
            <View key={content} className="px-3 py-1.5 rounded-full" style={{ backgroundColor: TEAL + "10" }}>
              <Text className="text-[13px] font-semibold capitalize" style={{ color: TEAL }}>
                {content.replace(/_/g, " ")}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Escalation notice */}
      {plan.escalationRisk !== "info" && (
        <GlassCard
          className="p-4 mb-4"
          style={{
            borderLeftWidth: 3,
            borderLeftColor: plan.escalationRisk === "critical" ? "#FF3B30" : "#FF9500",
          }}
        >
          <Text className="text-[13px] font-semibold text-[#3C3C43]">
            {plan.escalationRisk === "critical"
              ? "We noticed some answers that suggest you may need extra support. Please consider speaking to a professional."
              : "Some of your responses indicate areas that could benefit from more support. We'll suggest helpful resources."}
          </Text>
        </GlassCard>
      )}
    </View>
  );
}

// ─── Shared Likert Scale ──────────────────────────────────────────────────────

function LikertQuestion({
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
    <GlassCard className="p-4 mb-3">
      <Text className="text-[14px] font-semibold text-black mb-3">
        {index}. {question}
      </Text>
      <View className="gap-1.5">
        {LIKERT_LABELS.map((label, i) => {
          const active = value === i;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i)}
              className="flex-row items-center gap-3 py-3 px-4 rounded-xl"
              style={{
                backgroundColor: active ? TEAL : "#F2F2F7",
                borderWidth: 1,
                borderColor: active ? TEAL : "#E5E5EA",
              }}
            >
              <View
                className="w-5 h-5 rounded-full items-center justify-center"
                style={{
                  backgroundColor: active ? "#fff" : "transparent",
                  borderWidth: 2,
                  borderColor: active ? "#fff" : "#C6C6C8",
                }}
              >
                {active && (
                  <View
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: TEAL }}
                  />
                )}
              </View>
              <Text
                className="text-[14px] font-medium"
                style={{ color: active ? "#fff" : "#3C3C43" }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
}
