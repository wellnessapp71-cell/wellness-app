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
import { useRouter } from "expo-router";
import { useState } from "react";
import { getProfile, updateProfile } from "@/lib/user-store";
import { api } from "@/lib/api";

const ACTIVITY_LEVELS = [
  { value: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
  { value: "lightly_active", label: "Lightly Active", desc: "1–3 days/week" },
  { value: "moderate", label: "Moderate", desc: "3–5 days/week" },
  { value: "very_active", label: "Very Active", desc: "Daily / intense" },
] as const;

const DIET_TYPES = [
  { value: "omnivore", label: "🍖 Omnivore" },
  { value: "vegetarian", label: "🥦 Vegetarian" },
  { value: "vegan", label: "🌱 Vegan" },
  { value: "keto", label: "🥑 Keto" },
  { value: "paleo", label: "🥩 Paleo" },
] as const;

const BODY_SHAPES = [
  { value: "lean", label: "Lean", desc: "Slim build, low body fat" },
  { value: "average", label: "Average", desc: "Moderate build" },
  { value: "athletic", label: "Athletic", desc: "Muscular, toned" },
  { value: "heavy", label: "Heavy", desc: "Larger build, higher body fat" },
] as const;

const ALLERGY_OPTIONS = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Soy",
  "Eggs",
  "Shellfish",
  "None",
];

type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderate"
  | "very_active";
type DietType = "omnivore" | "vegetarian" | "vegan" | "keto" | "paleo";

export default function PhysicalQuestionnaireScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const twoColCardWidth = Math.floor((contentWidth - 12) / 2);
  const [step, setStep] = useState(0); // 0: activity, 1: fitness tests, 2: diet
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [exerciseDays, setExerciseDays] = useState(3);
  const [pushUps, setPushUps] = useState("");
  const [pullUps, setPullUps] = useState("");
  const [squats, setSquats] = useState("");
  const [plankSeconds, setPlankSeconds] = useState("");
  const [burpees, setBurpees] = useState("");
  const [dietType, setDietType] = useState<DietType>("omnivore");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [waterGlasses, setWaterGlasses] = useState("6");
  const [targetWeight, setTargetWeight] = useState("");
  const [bodyShape, setBodyShape] = useState<
    "lean" | "average" | "athletic" | "heavy"
  >("average");
  const [hasGym, setHasGym] = useState(false);
  const [hasEquipment, setHasEquipment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleAllergy(a: string) {
    if (a === "None") {
      setAllergies((prev) => (prev.includes("None") ? [] : ["None"]));
      return;
    }
    setAllergies((prev) =>
      prev.includes(a)
        ? prev.filter((x) => x !== a)
        : [...prev.filter((x) => x !== "None"), a],
    );
  }

  function canProceedStep1() {
    return true;
  }
  function canProceedStep2() {
    return (
      pushUps !== "" &&
      pullUps !== "" &&
      squats !== "" &&
      plankSeconds !== "" &&
      burpees !== ""
    );
  }

  async function handleSubmit() {
    if (!canProceedStep2()) {
      setError("Please fill all fitness fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const currentProfile = await getProfile();
      const parsedTargetWeight = parseFloat(targetWeight) || undefined;

      const benchmarks = {
        pushUps: parseInt(pushUps) || 0,
        pullUps: parseInt(pullUps) || 0,
        squats: parseInt(squats) || 0,
        plankSeconds: parseInt(plankSeconds) || 0,
        burpees: parseInt(burpees) || 0,
      };

      // Call assessment API
      let computedFitnessLevel: string = "intermediate";
      let fitnessScore = 50;
      try {
        const result = await api.post<any>("/assessment", {
          kind: "fitness",
          input: {
            gender: currentProfile?.gender ?? "other",
            responses: benchmarks,
          },
        });
        computedFitnessLevel = result?.fitnessLevel ?? "intermediate";
        fitnessScore = result?.overallScore ?? 50;
      } catch {
        // Use defaults if API unavailable
      }

      // Update unified profile with all physical data
      await updateProfile({
        activityLevel,
        exerciseDaysPerWeek: exerciseDays,
        ...benchmarks,
        dietType,
        allergies,
        waterGlassesPerDay: parseInt(waterGlasses) || 6,
        hasGymAccess: hasGym,
        hasHomeEquipment: hasEquipment,
        fitnessLevel: computedFitnessLevel,
        fitnessScore,
        targetWeightKg: parsedTargetWeight ?? null,
        bodyShape,
        scorePhysical: Math.round(fitnessScore),
        physicalOnboardingDone: true,
      });

      router.replace("/physical/hub");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
          <Pressable
            onPress={() => (step > 0 ? setStep((s) => s - 1) : router.back())}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <View className="flex-1">
            <View className="flex-row gap-1.5">
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  className="flex-1 h-1 rounded-full"
                  style={{ backgroundColor: i <= step ? "#007AFF" : "#E5E5EA" }}
                />
              ))}
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View className="pt-4 pb-6">
              <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
                Physical Profile
              </Text>
              <Text className="text-[15px] text-[#8A8A8E] mb-6">
                Tell us about your current activity level and access.
              </Text>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Current Activity Level
              </Text>
              <View className="gap-2 mb-6">
                {ACTIVITY_LEVELS.map((l) => (
                  <Pressable
                    key={l.value}
                    onPress={() => setActivityLevel(l.value)}
                    className="bg-white rounded-xl px-4 py-3.5 flex-row items-center gap-3"
                    style={{
                      borderWidth: 1.5,
                      borderColor:
                        activityLevel === l.value ? "#007AFF" : "transparent",
                    }}
                  >
                    <View
                      className="w-5 h-5 rounded-full border-2 items-center justify-center"
                      style={{
                        borderColor:
                          activityLevel === l.value ? "#007AFF" : "#C6C6C8",
                      }}
                    >
                      {activityLevel === l.value && (
                        <View className="w-2.5 h-2.5 rounded-full bg-[#007AFF]" />
                      )}
                    </View>
                    <View>
                      <Text className="text-[15px] font-semibold text-black">
                        {l.label}
                      </Text>
                      <Text className="text-[13px] text-[#8A8A8E]">
                        {l.desc}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Days Per Week You Exercise
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setExerciseDays(d)}
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: exerciseDays === d ? "#007AFF" : "#fff",
                      borderWidth: 1.5,
                      borderColor: exerciseDays === d ? "#007AFF" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-bold text-[16px]"
                      style={{ color: exerciseDays === d ? "#fff" : "#000" }}
                    >
                      {d}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Target Weight (kg) — optional
              </Text>
              <TextInput
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="e.g. 65"
                placeholderTextColor="#C6C6C8"
                keyboardType="numeric"
                className="bg-white rounded-xl px-4 py-4 text-[17px] text-black mb-6"
              />

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Body Shape
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {BODY_SHAPES.map((s) => (
                  <Pressable
                    key={s.value}
                    onPress={() => setBodyShape(s.value)}
                    className="px-4 py-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        bodyShape === s.value ? "#007AFF" : "#fff",
                      borderWidth: 1.5,
                      borderColor:
                        bodyShape === s.value ? "#007AFF" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-semibold text-[14px]"
                      style={{
                        color: bodyShape === s.value ? "#fff" : "#3C3C43",
                      }}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Equipment Access
              </Text>
              <View
                className="flex-row justify-between mb-6"
                style={{
                  maxWidth: contentWidth,
                  width: "100%",
                  alignSelf: "center",
                }}
              >
                {[
                  { label: "🏋️ Gym Access", val: hasGym, set: setHasGym },
                  {
                    label: "🏠 Home Equipment",
                    val: hasEquipment,
                    set: setHasEquipment,
                  },
                ].map((item) => (
                  <View key={item.label} style={{ width: twoColCardWidth }}>
                    <Pressable
                      onPress={() => item.set(!item.val)}
                      className="py-3.5 rounded-xl items-center"
                      style={{
                        backgroundColor: item.val ? "#007AFF" : "#fff",
                        borderWidth: 1.5,
                        borderColor: item.val ? "#007AFF" : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-semibold text-[14px]"
                        style={{ color: item.val ? "#fff" : "#3C3C43" }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {step === 1 && (
            <View className="pt-4 pb-6">
              <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
                Fitness Benchmarks
              </Text>
              <Text className="text-[15px] text-[#8A8A8E] mb-6">
                Enter your max in 1 attempt. Be honest — this is for your
                benefit.
              </Text>
              {[
                {
                  label: "Push-Ups (max reps)",
                  val: pushUps,
                  set: setPushUps,
                  placeholder: "e.g. 20",
                },
                {
                  label: "Pull-Ups (max reps)",
                  val: pullUps,
                  set: setPullUps,
                  placeholder: "e.g. 5",
                },
                {
                  label: "Squats (max reps)",
                  val: squats,
                  set: setSquats,
                  placeholder: "e.g. 30",
                },
                {
                  label: "Plank (seconds)",
                  val: plankSeconds,
                  set: setPlankSeconds,
                  placeholder: "e.g. 60",
                },
                {
                  label: "Burpees in 1 minute",
                  val: burpees,
                  set: setBurpees,
                  placeholder: "e.g. 10",
                },
              ].map((field) => (
                <View key={field.label} className="mb-4">
                  <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                    {field.label}
                  </Text>
                  <TextInput
                    value={field.val}
                    onChangeText={field.set}
                    placeholder={field.placeholder}
                    placeholderTextColor="#C6C6C8"
                    keyboardType="number-pad"
                    className="bg-white rounded-xl px-4 py-4 text-[17px] text-black"
                  />
                </View>
              ))}
              {error ? (
                <Text className="text-[#FF3B30] font-medium mb-2">{error}</Text>
              ) : null}
            </View>
          )}

          {step === 2 && (
            <View className="pt-4 pb-6">
              <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
                Diet & Nutrition
              </Text>
              <Text className="text-[15px] text-[#8A8A8E] mb-6">
                Helps us create a personalised nutrition plan for you.
              </Text>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Diet Type
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {DIET_TYPES.map((d) => (
                  <Pressable
                    key={d.value}
                    onPress={() => setDietType(d.value)}
                    className="px-4 py-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        dietType === d.value ? "#007AFF" : "#fff",
                      borderWidth: 1.5,
                      borderColor: dietType === d.value ? "#007AFF" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-semibold text-[14px]"
                      style={{
                        color: dietType === d.value ? "#fff" : "#3C3C43",
                      }}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Food Allergies
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {ALLERGY_OPTIONS.map((a) => (
                  <Pressable
                    key={a}
                    onPress={() => toggleAllergy(a)}
                    className="px-4 py-2.5 rounded-full"
                    style={{
                      backgroundColor: allergies.includes(a)
                        ? "#FF2D55"
                        : "#fff",
                      borderWidth: 1.5,
                      borderColor: allergies.includes(a)
                        ? "#FF2D55"
                        : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-semibold text-[14px]"
                      style={{
                        color: allergies.includes(a) ? "#fff" : "#3C3C43",
                      }}
                    >
                      {a}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Daily Water Intake (glasses)
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-4">
                {["4", "5", "6", "7", "8", "9", "10+"].map((g) => (
                  <Pressable
                    key={g}
                    onPress={() => setWaterGlasses(g === "10+" ? "10" : g)}
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor:
                        waterGlasses === (g === "10+" ? "10" : g)
                          ? "#007AFF"
                          : "#fff",
                      borderWidth: 1.5,
                      borderColor:
                        waterGlasses === (g === "10+" ? "10" : g)
                          ? "#007AFF"
                          : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-bold text-[13px]"
                      style={{
                        color:
                          waterGlasses === (g === "10+" ? "10" : g)
                            ? "#fff"
                            : "#000",
                      }}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <View className="h-6" />
        </ScrollView>

        <View className="px-6 pb-6 pt-2">
          {step < 2 ? (
            <Pressable
              onPress={() => {
                if (step === 1 && !canProceedStep2()) {
                  setError("Please fill all fitness fields.");
                  return;
                }
                setError("");
                setStep((s) => s + 1);
              }}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: "#007AFF" }}
            >
              <Text className="text-white text-[17px] font-semibold">Next</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: loading ? "#C6C6C8" : "#007AFF" }}
            >
              <Text className="text-white text-[17px] font-semibold">
                {loading ? "Computing your profile…" : "Compute My Score →"}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
