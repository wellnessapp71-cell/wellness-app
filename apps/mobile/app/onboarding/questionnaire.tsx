/**
 * Simplified onboarding questionnaire — basic scoring only.
 * Clinical PHQ-9/GAD-7 questions are reserved for the mental section.
 * This collects just enough to compute initial pillar scores.
 */

import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveProfile, getAuth, updateProfile } from "@/lib/user-store";
import type { UserProfile } from "@/lib/user-store";
import { api } from "@/lib/api";

// ── Basic mental questions (simple, not clinical) ────────────────

const MENTAL_QUESTIONS = [
  "How would you rate your overall mood most days?",
  "How well do you handle stress?",
  "How often do you feel anxious or worried?",
  "How well do you sleep?",
  "How focused do you feel during the day?",
];
const MENTAL_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

// ── Lifestyle questions ──────────────────────────────────────────

const SLEEP_OPTIONS = [
  { label: "< 5 hrs", value: 4 },
  { label: "5-6 hrs", value: 5.5 },
  { label: "7-8 hrs", value: 7.5 },
  { label: "8-9 hrs", value: 8.5 },
  { label: "> 9 hrs", value: 9.5 },
];

const ALCOHOL_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "Rarely", value: 1 },
  { label: "Monthly", value: 2 },
  { label: "Weekly", value: 3 },
  { label: "Daily", value: 4 },
];

const SCREEN_OPTIONS = [
  { label: "< 2 hrs", value: 1 },
  { label: "2-4 hrs", value: 3 },
  { label: "4-6 hrs", value: 5 },
  { label: "6-8 hrs", value: 7 },
  { label: "> 8 hrs", value: 9 },
];

// ── Spiritual questions ──────────────────────────────────────────

const SPIRITUAL_QUESTIONS = [
  "I regularly practice meditation, prayer, or mindfulness.",
  "I feel a strong sense of purpose and meaning in my life.",
  "I feel connected to a community that shares my values.",
];
const FREQ_LABELS = ["Never", "Rarely", "Sometimes", "Often", "Always"];

type Section = "intro" | "mental" | "lifestyle" | "spiritual";
const SECTIONS: Section[] = ["intro", "mental", "lifestyle", "spiritual"];

export default function QuestionnaireScreen() {
  const router = useRouter();
  const [sectionIdx, setSectionIdx] = useState(0);

  // Mental (5 questions, 0-4 each: 0=poor, 4=excellent)
  const [mentalAnswers, setMentalAnswers] = useState<number[]>(
    Array(5).fill(-1),
  );

  // Lifestyle
  const [sleepHours, setSleepHours] = useState(-1);
  const [alcoholFrequency, setAlcoholFrequency] = useState(-1);
  const [tobacco, setTobacco] = useState<boolean | null>(null);
  const [screenHours, setScreenHours] = useState(-1);

  // Spiritual
  const [spiritualAnswers, setSpiritualAnswers] = useState<number[]>(
    Array(3).fill(-1),
  );

  const [loading, setLoading] = useState(false);

  const section = SECTIONS[sectionIdx];

  function canAdvance(): boolean {
    if (section === "intro") return true;
    if (section === "mental") return mentalAnswers.every((v) => v >= 0);
    if (section === "lifestyle")
      return (
        sleepHours >= 0 &&
        alcoholFrequency >= 0 &&
        tobacco !== null &&
        screenHours >= 0
      );
    if (section === "spiritual") return spiritualAnswers.every((v) => v >= 0);
    return false;
  }

  function computeScores() {
    // Mental: average of 5 questions (0-4), mapped to 0-100
    const mentalScore = Math.round(
      (mentalAnswers.reduce((a, b) => a + b, 0) / (5 * 4)) * 100,
    );

    // Lifestyle
    const sleepScore =
      sleepHours >= 7 && sleepHours <= 9
        ? 100
        : sleepHours >= 6 && sleepHours <= 10
          ? 75
          : 50;
    const alcoholScore = Math.round(100 - alcoholFrequency * 20);
    const tobaccoScore = tobacco ? 30 : 100;
    const screenScore = screenHours < 4 ? 100 : screenHours <= 8 ? 70 : 40;
    const lifestyleScore = Math.round(
      sleepScore * 0.35 +
        alcoholScore * 0.25 +
        tobaccoScore * 0.25 +
        screenScore * 0.15,
    );

    // Spiritual
    const spirTotal = spiritualAnswers.reduce((a, b) => a + b, 0);
    const spiritualScore = Math.round((spirTotal / (3 * 4)) * 100);

    return {
      scoreMental: mentalScore,
      scoreLifestyle: lifestyleScore,
      scoreSpiritual: spiritualScore,
      scorePhysical: 50, // placeholder until physical assessment
    };
  }

  async function handleFinish() {
    setLoading(true);

    try {
      const scores = computeScores();

      // Load pending profile data from signup
      const pendingRaw = await AsyncStorage.getItem("@aura/pending_profile");
      const pending = pendingRaw ? JSON.parse(pendingRaw) : {};

      const profile: UserProfile = {
        age: pending.age ?? 25,
        gender: pending.gender ?? "other",
        heightCm: pending.heightCm ?? 170,
        currentWeightKg: pending.currentWeightKg ?? 70,
        targetWeightKg: null,
        bodyShape: null,
        ...scores,
        activityLevel: null,
        exerciseDaysPerWeek: null,
        fitnessLevel: null,
        fitnessScore: null,
        hasGymAccess: false,
        hasHomeEquipment: false,
        pushUps: null,
        pullUps: null,
        squats: null,
        plankSeconds: null,
        burpees: null,
        dietType: null,
        allergies: [],
        medicalConditions: [],
        waterGlassesPerDay: null,
        sleepHours,
        alcoholFrequency,
        tobacco: tobacco ?? false,
        screenHours,
        spiritualAnswers,
        mentalOnboardingDone: false,
        physicalOnboardingDone: false,
        spiritualOnboardingDone: false,
        lifestyleOnboardingDone: false,
        streakDays: 0,
        totalWorkouts: 0,
        totalCaloriesBurned: 0,
      };

      // Save locally
      await saveProfile(profile);

      // Sync to API
      try {
        await api.post("/profile", { profile });
      } catch {
        // Offline — local save is fine
      }

      // Clean up temp storage
      await AsyncStorage.removeItem("@aura/pending_profile");

      router.replace("/onboarding/scoring");
    } finally {
      setLoading(false);
    }
  }

  async function handleNext() {
    if (!canAdvance()) return;
    if (sectionIdx < SECTIONS.length - 1) {
      setSectionIdx((i) => i + 1);
    } else {
      await handleFinish();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Progress bar */}
      <View className="px-6 pt-6 pb-4">
        <View className="flex-row gap-1.5 mb-1">
          {SECTIONS.map((_, i) => (
            <View
              key={i}
              className="flex-1 h-1 rounded-full"
              style={{
                backgroundColor: i <= sectionIdx ? "#007AFF" : "#E5E5EA",
              }}
            />
          ))}
        </View>
        <Text className="text-[13px] text-[#8A8A8E] font-medium mt-1">
          Step {sectionIdx + 1} of {SECTIONS.length}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {section === "intro" && (
          <View className="pt-4 pb-8">
            <View
              className="w-16 h-16 rounded-2xl items-center justify-center mb-6"
              style={{ backgroundColor: "#007AFF15" }}
            >
              <Text style={{ fontSize: 32 }}>📋</Text>
            </View>
            <Text className="text-[28px] font-bold text-black tracking-tight mb-3">
              Quick Assessment
            </Text>
            <Text className="text-[17px] text-[#8A8A8E] leading-relaxed mb-4">
              Answer a few simple questions to get your initial wellness scores.
              More detailed assessments are available in each section.
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] leading-relaxed">
              This takes about 1 minute. Your answers are private and stored
              securely.
            </Text>
          </View>
        )}

        {section === "mental" && (
          <View className="pb-6">
            <Text className="text-[22px] font-bold text-black tracking-tight mb-1">
              How are you feeling?
            </Text>
            <Text className="text-[14px] text-[#8A8A8E] mb-6">
              Rate each area honestly — this helps us personalise your
              experience.
            </Text>
            {MENTAL_QUESTIONS.map((q, qi) => (
              <View
                key={qi}
                className="mb-4 bg-white rounded-2xl p-4"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <Text className="text-[15px] font-semibold text-black mb-3">
                  {qi + 1}. {q}
                </Text>
                <View className="flex-row gap-1.5">
                  {MENTAL_LABELS.map((label, li) => {
                    const active = mentalAnswers[qi] === li;
                    return (
                      <Pressable
                        key={li}
                        onPress={() =>
                          setMentalAnswers((a) => {
                            const n = [...a];
                            n[qi] = li;
                            return n;
                          })
                        }
                        className="flex-1 py-2.5 rounded-xl items-center"
                        style={{
                          backgroundColor: active ? "#007AFF" : "#F2F2F7",
                          borderWidth: 1,
                          borderColor: active ? "#007AFF" : "#E5E5EA",
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
              </View>
            ))}
          </View>
        )}

        {section === "lifestyle" && (
          <View className="pb-6">
            <Text className="text-[22px] font-bold text-black tracking-tight mb-6">
              Lifestyle & Habits
            </Text>

            <OptionGroup
              label="How many hours of sleep per night?"
              options={SLEEP_OPTIONS}
              selected={sleepHours}
              onSelect={setSleepHours}
            />

            <OptionGroup
              label="How often do you drink alcohol?"
              options={ALCOHOL_OPTIONS}
              selected={alcoholFrequency}
              onSelect={setAlcoholFrequency}
            />

            <View className="mb-6">
              <Text className="text-[17px] font-semibold text-black mb-3">
                Do you currently smoke or use tobacco?
              </Text>
              <View className="flex-row gap-3">
                {(["Yes", "No"] as const).map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => setTobacco(opt === "Yes")}
                    className="flex-1 py-4 rounded-xl items-center"
                    style={{
                      backgroundColor:
                        tobacco === (opt === "Yes") ? "#007AFF" : "#fff",
                      borderWidth: 1.5,
                      borderColor:
                        tobacco === (opt === "Yes") ? "#007AFF" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-semibold text-[15px]"
                      style={{
                        color: tobacco === (opt === "Yes") ? "#fff" : "#000",
                      }}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <OptionGroup
              label="Recreational screen time per day?"
              options={SCREEN_OPTIONS}
              selected={screenHours}
              onSelect={setScreenHours}
            />
          </View>
        )}

        {section === "spiritual" && (
          <View className="pb-6">
            <Text className="text-[22px] font-bold text-black tracking-tight mb-6">
              Spiritual & Purpose
            </Text>
            {SPIRITUAL_QUESTIONS.map((q, qi) => (
              <View
                key={qi}
                className="mb-5 bg-white rounded-2xl p-4"
                style={{
                  shadowColor: "#000",
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                }}
              >
                <Text className="text-[15px] font-semibold text-black mb-3">
                  {qi + 1}. {q}
                </Text>
                <View className="gap-2">
                  {FREQ_LABELS.map((label, li) => {
                    const active = spiritualAnswers[qi] === li;
                    return (
                      <Pressable
                        key={li}
                        onPress={() =>
                          setSpiritualAnswers((a) => {
                            const n = [...a];
                            n[qi] = li;
                            return n;
                          })
                        }
                        className="px-4 py-3 rounded-xl flex-row items-center gap-3"
                        style={{
                          backgroundColor: active ? "#AF52DE15" : "#F2F2F7",
                          borderWidth: 1.5,
                          borderColor: active ? "#AF52DE" : "transparent",
                        }}
                      >
                        <View
                          className="w-5 h-5 rounded-full border-2 items-center justify-center"
                          style={{
                            borderColor: active ? "#AF52DE" : "#C6C6C8",
                          }}
                        >
                          {active && (
                            <View className="w-2.5 h-2.5 rounded-full bg-[#AF52DE]" />
                          )}
                        </View>
                        <Text
                          className="text-[15px] font-medium flex-1"
                          style={{ color: active ? "#AF52DE" : "#3C3C43" }}
                        >
                          {li} - {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      <View className="px-6 pb-6 pt-2">
        <Pressable
          onPress={handleNext}
          disabled={!canAdvance() || loading}
          className="rounded-2xl py-4 items-center"
          style={{
            backgroundColor: canAdvance() && !loading ? "#007AFF" : "#C6C6C8",
          }}
        >
          <Text className="text-white text-[17px] font-semibold">
            {loading
              ? "Computing scores..."
              : sectionIdx === SECTIONS.length - 1
                ? "See My Scores"
                : "Next"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function OptionGroup({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { label: string; value: number }[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  return (
    <View className="mb-6">
      <Text className="text-[17px] font-semibold text-black mb-3">{label}</Text>
      <View className="gap-2">
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <Pressable
              key={opt.label}
              onPress={() => onSelect(opt.value)}
              className="px-4 py-3 rounded-xl flex-row items-center gap-3"
              style={{
                backgroundColor: active ? "#007AFF15" : "#F2F2F7",
                borderWidth: 1.5,
                borderColor: active ? "#007AFF" : "transparent",
              }}
            >
              <View
                className="w-5 h-5 rounded-full border-2 items-center justify-center"
                style={{ borderColor: active ? "#007AFF" : "#C6C6C8" }}
              >
                {active && (
                  <View className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
                )}
              </View>
              <Text
                className="text-[15px] font-medium"
                style={{ color: active ? "#007AFF" : "#3C3C43" }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
