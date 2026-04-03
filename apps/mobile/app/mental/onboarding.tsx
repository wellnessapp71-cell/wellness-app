import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MoodSlider } from "@/components/mental/MoodSlider";
import { TriggerTagPicker } from "@/components/mental/TriggerTagPicker";
import { saveMentalBaseline, saveMentalPlan } from "@/lib/mental-store";
import { updateProfile } from "@/lib/user-store";
import { api } from "@/lib/api";
import { buildBaseline, generateInitialPlan } from "@aura/mental-engine";
import {
  PHQ9_QUESTIONS,
  GAD7_QUESTIONS,
  PHQ_RESPONSE_LABELS,
  MENTAL_INTERVENTION_TYPES,
  type TriggerTag,
  type InterventionType,
  type MentalBaseline,
} from "@aura/types";

const TOTAL_STEPS = 7;

const INTERVENTION_LABELS: Record<
  InterventionType,
  { label: string; icon: string }
> = {
  breathing: { label: "Breathing", icon: "🌬️" },
  grounding: { label: "Grounding", icon: "🌍" },
  body_scan: { label: "Body Scan", icon: "🧘" },
  calm_audio: { label: "Calm Audio", icon: "🎵" },
  journal_prompt: { label: "Journaling", icon: "📝" },
};

export default function MentalOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // PHQ-9 answers (9 items, each 0-3)
  const [phq9, setPhq9] = useState<number[]>(new Array(9).fill(0));
  // GAD-7 answers (7 items, each 0-3)
  const [gad7, setGad7] = useState<number[]>(new Array(7).fill(0));
  // Single sliders
  const [stressBase, setStressBase] = useState(5);
  const [moodBase, setMoodBase] = useState(5);
  // Preferences
  const [calmingPreferences, setCalmingPreferences] = useState<
    InterventionType[]
  >([]);
  const [priorTherapy, setPriorTherapy] = useState(false);
  const [commonTriggers, setCommonTriggers] = useState<TriggerTag[]>([]);

  const [saving, setSaving] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<ReturnType<
    typeof generateInitialPlan
  > | null>(null);

  function updatePhq9(index: number, value: number) {
    setPhq9((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function updateGad7(index: number, value: number) {
    setGad7((prev) => prev.map((v, i) => (i === index ? value : v)));
  }

  function toggleCalming(type: InterventionType) {
    setCalmingPreferences((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  }

  async function handleSubmit() {
    setSaving(true);

    try {
      const baseline: MentalBaseline = buildBaseline({
        phq9Answers: phq9,
        gad7Answers: gad7,
        stressBase,
        moodBase,
        calmingPreferences,
        priorTherapy,
        commonTriggers,
      });

      const plan = generateInitialPlan("local", baseline);

      // Save locally
      await saveMentalBaseline(baseline);
      await saveMentalPlan(plan);

      // Update unified profile — mark mental onboarding done & update mental score
      const mentalScore = Math.round(
        ((27 - baseline.phq9Score) / 27) * 50 +
          ((21 - baseline.gad7Score) / 21) * 30 +
          (baseline.moodBase / 10) * 20,
      );
      await updateProfile({
        mentalOnboardingDone: true,
        scoreMental: Math.max(0, Math.min(100, mentalScore)),
      });

      // Sync to API (offline-first)
      try {
        await api.post("/mental/baseline", {
          phq9: baseline.phq9Score,
          gad7: baseline.gad7Score,
          stressBase: baseline.stressBase,
          moodBase: baseline.moodBase,
          rawAnswers: {
            phq9Answers: baseline.phq9Answers,
            gad7Answers: baseline.gad7Answers,
            calmingPreferences: baseline.calmingPreferences,
            priorTherapy: baseline.priorTherapy,
            commonTriggers: baseline.commonTriggers,
          },
        });
      } catch {
        // local save is enough
      }

      setGeneratedPlan(plan);
      setStep(TOTAL_STEPS - 1); // go to summary
    } finally {
      setSaving(false);
    }
  }

  function goNext() {
    if (step === 5) {
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
          Mental Assessment
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
            style={{ backgroundColor: i <= step ? "#AF52DE" : "#E5E5EA" }}
          />
        ))}
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && <StepWelcome />}
        {step === 1 && <StepPhq9 answers={phq9} onChange={updatePhq9} />}
        {step === 2 && <StepGad7 answers={gad7} onChange={updateGad7} />}
        {step === 3 && (
          <StepStress value={stressBase} onChange={setStressBase} />
        )}
        {step === 4 && <StepMood value={moodBase} onChange={setMoodBase} />}
        {step === 5 && (
          <StepPreferences
            calmingPreferences={calmingPreferences}
            toggleCalming={toggleCalming}
            priorTherapy={priorTherapy}
            setPriorTherapy={setPriorTherapy}
            commonTriggers={commonTriggers}
            setCommonTriggers={setCommonTriggers}
          />
        )}
        {step === 6 && <StepSummary plan={generatedPlan} />}

        <View className="h-6" />
      </ScrollView>

      {/* Bottom button */}
      <View className="px-6 pb-6 pt-2">
        {step === 6 ? (
          <Pressable
            onPress={() => router.replace("/mental/hub")}
            className="rounded-2xl py-4 items-center bg-[#AF52DE]"
          >
            <Text className="text-white text-[17px] font-semibold">
              Go to Mental Hub
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={goNext}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : "#AF52DE" }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving
                ? "Creating your plan..."
                : step === 5
                  ? "Create my wellness plan"
                  : "Continue"}
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
      <Text style={{ fontSize: 48, textAlign: "center" }}>🧠</Text>
      <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
        Mental Wellbeing
      </Text>
      <Text className="text-[17px] text-[#3C3C43] text-center mt-3 leading-relaxed px-4">
        Let's understand how you feel so we can personalise your support.
      </Text>
      <GlassCard className="p-4 mt-6">
        <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
          What we'll cover
        </Text>
        {[
          {
            icon: "📋",
            title: "Mood & depression screening",
            desc: "PHQ-9 questionnaire (2 min)",
          },
          {
            icon: "😰",
            title: "Anxiety screening",
            desc: "GAD-7 questionnaire (2 min)",
          },
          {
            icon: "🎛️",
            title: "Stress & mood baseline",
            desc: "Two quick sliders",
          },
          {
            icon: "🎯",
            title: "Your preferences",
            desc: "Calming style, triggers, therapy history",
          },
        ].map((item) => (
          <View key={item.title} className="flex-row items-center gap-3 mb-3">
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-black">
                {item.title}
              </Text>
              <Text className="text-[13px] text-[#8A8A8E]">{item.desc}</Text>
            </View>
          </View>
        ))}
      </GlassCard>
      <GlassCard className="p-4 mt-4" style={{ backgroundColor: "#AF52DE08" }}>
        <Text className="text-[13px] text-[#AF52DE] font-medium text-center leading-relaxed">
          🔒 Your answers are private and stored locally on your device. You can
          skip and come back any time.
        </Text>
      </GlassCard>
    </View>
  );
}

function StepPhq9({
  answers,
  onChange,
}: {
  answers: number[];
  onChange: (index: number, value: number) => void;
}) {
  return (
    <View className="pt-2">
      <Text className="text-[22px] font-bold text-black tracking-tight mb-1">
        PHQ-9 Depression Screener
      </Text>
      <Text className="text-[14px] text-[#8A8A8E] mb-5 leading-relaxed">
        Over the last 2 weeks, how often have you been bothered by the
        following?
      </Text>
      {PHQ9_QUESTIONS.map((question, i) => (
        <LikertQuestion
          key={i}
          index={i + 1}
          question={question}
          value={answers[i]}
          onChange={(v) => onChange(i, v)}
        />
      ))}
    </View>
  );
}

function StepGad7({
  answers,
  onChange,
}: {
  answers: number[];
  onChange: (index: number, value: number) => void;
}) {
  return (
    <View className="pt-2">
      <Text className="text-[22px] font-bold text-black tracking-tight mb-1">
        GAD-7 Anxiety Screener
      </Text>
      <Text className="text-[14px] text-[#8A8A8E] mb-5 leading-relaxed">
        Over the last 2 weeks, how often have you been bothered by the
        following?
      </Text>
      {GAD7_QUESTIONS.map((question, i) => (
        <LikertQuestion
          key={i}
          index={i + 1}
          question={question}
          value={answers[i]}
          onChange={(v) => onChange(i, v)}
        />
      ))}
    </View>
  );
}

function StepStress({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>😤</Text>
      <Text className="text-[22px] font-bold text-black tracking-tight text-center mt-4 mb-2">
        Perceived Stress
      </Text>
      <Text className="text-[15px] text-[#8A8A8E] text-center mb-8 leading-relaxed px-4">
        How stressed do you generally feel in your day-to-day life?
      </Text>
      <MoodSlider
        label="Stress Level"
        value={value}
        onChange={onChange}
        color="#FF3B30"
        invert
      />
    </View>
  );
}

function StepMood({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>😊</Text>
      <Text className="text-[22px] font-bold text-black tracking-tight text-center mt-4 mb-2">
        Mood Baseline
      </Text>
      <Text className="text-[15px] text-[#8A8A8E] text-center mb-8 leading-relaxed px-4">
        How would you rate your overall mood on a typical day?
      </Text>
      <MoodSlider
        label="Overall Mood"
        value={value}
        onChange={onChange}
        color="#AF52DE"
      />
    </View>
  );
}

function StepPreferences({
  calmingPreferences,
  toggleCalming,
  priorTherapy,
  setPriorTherapy,
  commonTriggers,
  setCommonTriggers,
}: {
  calmingPreferences: InterventionType[];
  toggleCalming: (type: InterventionType) => void;
  priorTherapy: boolean;
  setPriorTherapy: (v: boolean) => void;
  commonTriggers: TriggerTag[];
  setCommonTriggers: (tags: TriggerTag[]) => void;
}) {
  return (
    <View className="pt-2">
      <Text className="text-[22px] font-bold text-black tracking-tight mb-4">
        Your Preferences
      </Text>

      {/* Calming style */}
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
        Preferred calming techniques
      </Text>
      <View className="flex-row flex-wrap gap-2 mb-6">
        {MENTAL_INTERVENTION_TYPES.map((type) => {
          const active = calmingPreferences.includes(type);
          const info = INTERVENTION_LABELS[type];
          return (
            <Pressable
              key={type}
              onPress={() => toggleCalming(type)}
              className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-full"
              style={{
                backgroundColor: active ? "#AF52DE" : "#fff",
                borderWidth: 1.5,
                borderColor: active ? "#AF52DE" : "#E5E5EA",
              }}
            >
              <Text style={{ fontSize: 16 }}>{info.icon}</Text>
              <Text
                className="text-[14px] font-semibold"
                style={{ color: active ? "#fff" : "#3C3C43" }}
              >
                {info.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Prior therapy */}
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-1">
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
            Prior therapy experience
          </Text>
          <Text className="text-[13px] text-[#8A8A8E] mt-0.5">
            Have you spoken to a therapist before?
          </Text>
        </View>
        <Switch
          value={priorTherapy}
          onValueChange={setPriorTherapy}
          trackColor={{ false: "#E5E5EA", true: "#AF52DE" }}
          thumbColor="#fff"
        />
      </View>

      {/* Common triggers */}
      <TriggerTagPicker
        label="Common stress triggers"
        selected={commonTriggers}
        onChange={setCommonTriggers}
        color="#AF52DE"
      />
    </View>
  );
}

function StepSummary({
  plan,
}: {
  plan: ReturnType<typeof generateInitialPlan> | null;
}) {
  if (!plan) {
    return (
      <View className="pt-10 items-center">
        <Text className="text-[17px] text-[#8A8A8E]">
          Generating your plan...
        </Text>
      </View>
    );
  }

  return (
    <View className="pt-4">
      <Text style={{ fontSize: 48, textAlign: "center" }}>🎉</Text>
      <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
        Your Plan is Ready
      </Text>
      <Text className="text-[15px] text-[#8A8A8E] text-center mt-2 mb-6 leading-relaxed">
        We've created a personalised wellness plan based on your answers.
      </Text>

      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Check-in Schedule
        </Text>
        <Text className="text-[17px] font-bold text-black capitalize">
          {plan.checkinFrequency.replace("_", " ")}
        </Text>
      </GlassCard>

      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Focus Areas
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {plan.focusAreas.map((area) => (
            <View
              key={area}
              className="bg-[#AF52DE10] px-3 py-1.5 rounded-full"
            >
              <Text className="text-[13px] font-semibold text-[#AF52DE] capitalize">
                {area.replace(/_/g, " ")}
              </Text>
            </View>
          ))}
        </View>
      </GlassCard>

      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Recommended Techniques
        </Text>
        {plan.recommendedInterventions.map((type) => {
          const info = INTERVENTION_LABELS[type];
          return (
            <View key={type} className="flex-row items-center gap-2 mb-2">
              <Text style={{ fontSize: 18 }}>{info?.icon ?? "🧘"}</Text>
              <Text className="text-[15px] font-medium text-black capitalize">
                {info?.label ?? type.replace(/_/g, " ")}
              </Text>
            </View>
          );
        })}
      </GlassCard>

      <GlassCard className="p-4 mb-4">
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
          Weekly Goals
        </Text>
        {plan.weeklyGoals.map((goal, i) => (
          <View key={i} className="flex-row items-start gap-2 mb-1.5">
            <Text className="text-[#AF52DE] font-bold">·</Text>
            <Text className="text-[14px] text-[#3C3C43] flex-1">{goal}</Text>
          </View>
        ))}
      </GlassCard>

      {plan.escalationRisk !== "info" && (
        <GlassCard
          className="p-4 mb-4"
          style={{
            borderLeftWidth: 3,
            borderLeftColor:
              plan.escalationRisk === "critical" ? "#FF3B30" : "#FF9500",
          }}
        >
          <Text className="text-[13px] font-semibold text-[#3C3C43]">
            {plan.escalationRisk === "critical"
              ? "We noticed some answers that suggest you may need extra support. Please consider speaking to a professional."
              : "Some of your responses indicate moderate stress. We'll keep an eye on this and suggest helpful resources."}
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
      <View className="flex-row flex-wrap justify-between">
        {PHQ_RESPONSE_LABELS.map((label, i) => {
          const active = value === i;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i)}
              className="flex-1 py-2.5 rounded-xl items-center"
              style={{
                width: "24%",
                backgroundColor: active ? "#AF52DE" : "#F2F2F7",
                borderWidth: 1,
                borderColor: active ? "#AF52DE" : "#E5E5EA",
              }}
            >
              <Text
                className="text-[10px] font-semibold text-center px-0.5"
                style={{ color: active ? "#fff" : "#3C3C43" }}
                numberOfLines={2}
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
