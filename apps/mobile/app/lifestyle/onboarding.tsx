import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { saveLifestyleBaseline, saveLifestylePlan } from "@/lib/lifestyle-store";
import { updateProfile } from "@/lib/user-store";
import { pushBaseline, pushPlan } from "@/lib/lifestyle-sync";
import {
  LIFESTYLE_QUESTIONS,
  buildLifestyleBaseline,
  generateInitialLifestylePlan,
} from "@aura/lifestyle-engine";
import {
  LIFESTYLE_DOMAIN_LABELS,
  LIFESTYLE_DOMAIN_ICONS,
  type LifestyleBaseline,
  type LifestyleWellnessPlan,
} from "@aura/types";

const THEME = "#FF9500";

// 9 steps: welcome + 7 domain groups + summary
const TOTAL_STEPS = 9;

const DOMAIN_GROUPS = [
  { title: "Sleep & Recovery", subtitle: "7 questions about your sleep habits", startIdx: 0, count: 7 },
  { title: "Nutrition & Meal Quality", subtitle: "8 questions about your eating habits", startIdx: 7, count: 8 },
  { title: "Hydration", subtitle: "4 questions about your fluid intake", startIdx: 15, count: 4 },
  { title: "Movement & Sedentary Balance", subtitle: "5 questions about physical activity", startIdx: 19, count: 5 },
  { title: "Digital Balance", subtitle: "4 questions about screen time habits", startIdx: 24, count: 4 },
  { title: "Nature & Light", subtitle: "3 questions about outdoor time", startIdx: 28, count: 3 },
  { title: "Routine & Stability", subtitle: "5 questions about daily routines", startIdx: 31, count: 5 },
];

const DOMAIN_ICONS = ["😴", "🍎", "💧", "🚶", "📱", "🌿", "📋"];

export default function LifestyleOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(new Array(36).fill(0));
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    baseline: LifestyleBaseline;
    plan: LifestyleWellnessPlan;
  } | null>(null);

  function updateAnswer(index: number, value: number) {
    setAnswers((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  async function handleSubmit() {
    setSaving(true);
    try {
      const baseline = buildLifestyleBaseline(answers);
      const plan = generateInitialLifestylePlan(baseline);

      await saveLifestyleBaseline(baseline);
      await saveLifestylePlan(plan);

      await updateProfile({
        lifestyleOnboardingDone: true,
        scoreLifestyle: baseline.totalScore,
      });

      // Sync to API (fire & forget)
      pushBaseline(baseline);
      pushPlan(plan);

      setResult({ baseline, plan });
      setStep(TOTAL_STEPS - 1);
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (step === 7) {
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
          Lifestyle Assessment
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
            style={{ backgroundColor: i <= step ? THEME : "#E5E5EA" }}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <StepWelcome />}
        {step >= 1 && step <= 7 && (
          <StepDomainQuestions
            group={DOMAIN_GROUPS[step - 1]}
            icon={DOMAIN_ICONS[step - 1]}
            answers={answers}
            onAnswer={updateAnswer}
          />
        )}
        {step === 8 && result && (
          <StepSummary baseline={result.baseline} plan={result.plan} />
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Bottom button */}
      <View className="px-6 pb-6 pt-2">
        {step === 8 ? (
          <Pressable
            onPress={() => router.replace("/lifestyle/hub")}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: THEME }}
          >
            <Text className="text-white text-[17px] font-semibold">Go to Lifestyle Hub</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={goNext}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : THEME }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving ? "Creating your plan..." : step === 7 ? "Create my wellness plan" : "Continue"}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Step Components ──────────────────────────────────────────

function StepWelcome() {
  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>🌿</Text>
      <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
        Daily Wellness
      </Text>
      <Text className="text-[17px] text-[#3C3C43] text-center mt-3 leading-relaxed px-4">
        Let's understand your daily habits so we can build a personalised lifestyle plan.
      </Text>
      <GlassCard className="p-4 mt-6">
        <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
          What we'll cover
        </Text>
        {[
          { icon: "😴", title: "Sleep & Recovery", desc: "7 questions (1 min)" },
          { icon: "🍎", title: "Nutrition & Meals", desc: "8 questions (2 min)" },
          { icon: "💧", title: "Hydration", desc: "4 questions (1 min)" },
          { icon: "🚶", title: "Movement & Activity", desc: "5 questions (1 min)" },
          { icon: "📱", title: "Digital Balance", desc: "4 questions (1 min)" },
          { icon: "🌿", title: "Nature & Light", desc: "3 questions (30 sec)" },
          { icon: "🔄", title: "Routine & Stability", desc: "5 questions (1 min)" },
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
      <GlassCard className="p-4 mt-4" style={{ backgroundColor: "#FF950008" }}>
        <Text className="text-[13px] font-medium text-center leading-relaxed" style={{ color: THEME }}>
          🔒 Your answers are private and stored locally on your device. Takes about 5 minutes.
        </Text>
      </GlassCard>
    </View>
  );
}

function StepDomainQuestions({
  group,
  icon,
  answers,
  onAnswer,
}: {
  group: (typeof DOMAIN_GROUPS)[number];
  icon: string;
  answers: number[];
  onAnswer: (index: number, value: number) => void;
}) {
  const questions = LIFESTYLE_QUESTIONS.slice(group.startIdx, group.startIdx + group.count);

  return (
    <View className="pt-2">
      <View className="flex-row items-center gap-2 mb-1">
        <Text style={{ fontSize: 24 }}>{icon}</Text>
        <Text className="text-[22px] font-bold text-black tracking-tight">
          {group.title}
        </Text>
      </View>
      <Text className="text-[14px] text-[#8A8A8E] mb-5">{group.subtitle}</Text>

      {questions.map((q, qIdx) => {
        const globalIdx = group.startIdx + qIdx;
        return (
          <GlassCard key={q.id} className="p-4 mb-3">
            <Text className="text-[14px] font-semibold text-black mb-3">
              {qIdx + 1}. {q.text}
            </Text>
            <View className="gap-2">
              {q.options.map((opt) => {
                const active = answers[globalIdx] === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => onAnswer(globalIdx, opt.value)}
                    className="flex-row items-center gap-3 py-3 px-4 rounded-xl"
                    style={{
                      backgroundColor: active ? THEME : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? THEME : "#E5E5EA",
                    }}
                  >
                    <View
                      className="w-5 h-5 rounded-full items-center justify-center"
                      style={{
                        borderWidth: 2,
                        borderColor: active ? "#fff" : "#C7C7CC",
                        backgroundColor: active ? "#fff" : "transparent",
                      }}
                    >
                      {active && (
                        <View
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: THEME }}
                        />
                      )}
                    </View>
                    <Text
                      className="text-[14px] font-medium flex-1"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        );
      })}
    </View>
  );
}

function StepSummary({
  baseline,
  plan,
}: {
  baseline: LifestyleBaseline;
  plan: LifestyleWellnessPlan;
}) {
  const domainScores: { key: string; label: string; icon: string; score: number }[] = [
    { key: "sleep", label: LIFESTYLE_DOMAIN_LABELS.sleep, icon: LIFESTYLE_DOMAIN_ICONS.sleep, score: baseline.sleepScore },
    { key: "nutrition", label: LIFESTYLE_DOMAIN_LABELS.nutrition, icon: LIFESTYLE_DOMAIN_ICONS.nutrition, score: baseline.nutritionScore },
    { key: "hydration", label: LIFESTYLE_DOMAIN_LABELS.hydration, icon: LIFESTYLE_DOMAIN_ICONS.hydration, score: baseline.hydrationScore },
    { key: "movement", label: LIFESTYLE_DOMAIN_LABELS.movement, icon: LIFESTYLE_DOMAIN_ICONS.movement, score: baseline.movementScore },
    { key: "digital", label: LIFESTYLE_DOMAIN_LABELS.digital, icon: LIFESTYLE_DOMAIN_ICONS.digital, score: baseline.digitalScore },
    { key: "nature", label: LIFESTYLE_DOMAIN_LABELS.nature, icon: LIFESTYLE_DOMAIN_ICONS.nature, score: baseline.natureScore },
    { key: "routine", label: LIFESTYLE_DOMAIN_LABELS.routine, icon: LIFESTYLE_DOMAIN_ICONS.routine, score: baseline.routineScore },
  ];

  const bandColors = { green: "#34C759", yellow: "#FFCC00", orange: "#FF9500", red: "#FF3B30" };
  const bandLabels = {
    green: "Strong lifestyle balance",
    yellow: "Healthy, needs consistency",
    orange: "Gaps present, room to grow",
    red: "Significant imbalance — let's reset",
  };

  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>🎉</Text>
      <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
        Your Results
      </Text>

      {/* Composite score */}
      <GlassCard className="p-5 items-center mt-6 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Lifestyle Score
        </Text>
        <Text className="text-[48px] font-bold" style={{ color: bandColors[baseline.band] }}>
          {baseline.totalScore}
        </Text>
        <Text className="text-[15px] font-medium" style={{ color: bandColors[baseline.band] }}>
          {bandLabels[baseline.band]}
        </Text>
      </GlassCard>

      {/* Domain scores grid */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        {domainScores.map((d) => (
          <View key={d.key} className="w-[48%]">
            <GlassCard className="p-3.5">
              <View className="flex-row items-center gap-2 mb-1">
                <Text style={{ fontSize: 16 }}>{d.icon}</Text>
                <Text className="text-[12px] font-semibold text-[#8A8A8E]">{d.label}</Text>
              </View>
              <Text className="text-[24px] font-bold text-black">{d.score}</Text>
              <View className="h-1.5 rounded-full bg-[#E5E5EA] mt-2">
                <View
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${d.score}%`,
                    backgroundColor: d.score >= 80 ? "#34C759" : d.score >= 60 ? "#FFCC00" : d.score >= 40 ? "#FF9500" : "#FF3B30",
                  }}
                />
              </View>
            </GlassCard>
          </View>
        ))}
      </View>

      {/* Weakest domain */}
      <GlassCard className="p-4 mb-4" style={{ borderLeftWidth: 3, borderLeftColor: THEME }}>
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-1">
          Focus Area
        </Text>
        <Text className="text-[15px] font-bold text-black">
          {LIFESTYLE_DOMAIN_ICONS[baseline.weakestDomain]} {LIFESTYLE_DOMAIN_LABELS[baseline.weakestDomain]}
        </Text>
        <Text className="text-[13px] text-[#3C3C43] mt-1">{plan.dailyAnchorHabit}</Text>
      </GlassCard>

      {/* Plan preview */}
      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Your Plan
        </Text>
        {[
          { label: "Daily Anchor", value: plan.dailyAnchorHabit },
          { label: "Recovery Habit", value: plan.recoveryHabit },
          { label: "Weekly Goal", value: plan.weeklyGoal },
        ].map((item) => (
          <View key={item.label} className="mb-2">
            <Text className="text-[11px] font-semibold text-[#8A8A8E]">{item.label}</Text>
            <Text className="text-[14px] text-[#3C3C43]">{item.value}</Text>
          </View>
        ))}
      </GlassCard>

      {plan.expertRecommendation && (
        <GlassCard className="p-4 mb-4" style={{ borderLeftWidth: 3, borderLeftColor: "#FF3B30" }}>
          <Text className="text-[13px] font-semibold text-[#3C3C43]">
            {plan.expertRecommendation}
          </Text>
        </GlassCard>
      )}
    </View>
  );
}
