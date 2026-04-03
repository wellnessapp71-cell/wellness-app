import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile } from "@/lib/user-store";
import { generateStructuredMealPlan } from "@/lib/nutrition-engine";
import type {
  ActivityLevel,
  AllergyType,
  CuisineRegion,
  DietType,
  Gender,
  HealthGoal,
  MedicalCondition,
  StructuredMealPlanRequest,
} from "@aura/types";
import {
  MEDICAL_CONDITIONS,
  MEDICAL_CONDITION_LABELS,
  ALLERGY_OPTIONS,
  CUISINE_REGIONS,
  CUISINE_REGION_LABELS,
  HEALTH_GOALS,
  HEALTH_GOAL_LABELS,
} from "@aura/types";

const DIET_OPTIONS: { value: DietType; label: string }[] = [
  { value: "veg", label: "Vegetarian" },
  { value: "non-veg", label: "Non-Veg" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
  { value: "keto", label: "Keto" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Lightly Active" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Very Active" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

function ChipSelect<T extends string>({
  options,
  selected,
  onToggle,
  multi = false,
  color = "#007AFF",
}: {
  options: { value: T; label: string }[];
  selected: T | T[];
  onToggle: (v: T) => void;
  multi?: boolean;
  color?: string;
}) {
  const isSelected = (v: T) =>
    multi ? (selected as T[]).includes(v) : selected === v;

  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((opt) => {
        const active = isSelected(opt.value);
        return (
          <Pressable
            key={opt.value}
            onPress={() => onToggle(opt.value)}
            className="px-3.5 py-2 rounded-full"
            style={{
              backgroundColor: active ? color : "#fff",
              borderWidth: 1.5,
              borderColor: active ? color : "#E5E5EA",
            }}
          >
            <Text
              className="font-semibold text-[13px]"
              style={{ color: active ? "#fff" : "#3C3C43" }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step,
  unit,
}: {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        className="w-9 h-9 rounded-full bg-[#E5E5EA] items-center justify-center"
      >
        <Text className="text-[18px] font-bold text-[#3C3C43]">−</Text>
      </Pressable>
      <Text className="text-[22px] font-bold text-black min-w-[80px] text-center">
        {value} <Text className="text-[14px] text-[#8A8A8E] font-medium">{unit}</Text>
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + step))}
        className="w-9 h-9 rounded-full bg-[#007AFF] items-center justify-center"
      >
        <Text className="text-[18px] font-bold text-white">+</Text>
      </Pressable>
    </View>
  );
}

export default function NutritionSetupScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // User profile inputs
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<Gender>("male");
  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(70);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");

  // Dietary preferences
  const [dietaryPreference, setDietaryPreference] = useState<DietType>("veg");
  const [cuisinePreferences, setCuisinePreferences] = useState<CuisineRegion[]>(["pan_indian"]);
  const [allergies, setAllergies] = useState<AllergyType[]>([]);

  // Health
  const [healthGoal, setHealthGoal] = useState<HealthGoal>("maintenance");
  const [medicalConditions, setMedicalConditions] = useState<MedicalCondition[]>([]);

  // Pre-fill from onboarding state
  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (profile?.age) setAge(profile.age);
      if (profile?.gender) setGender(profile.gender);
      if (profile?.heightCm) setHeightCm(profile.heightCm);
      if (profile?.currentWeightKg) setWeightKg(profile.currentWeightKg);
      if (profile?.activityLevel) {
        const map: Record<string, ActivityLevel> = {
          sedentary: "sedentary",
          lightly_active: "light",
          moderate: "moderate",
          very_active: "active",
        };
        setActivityLevel(map[profile.activityLevel] ?? "moderate");
      }
      if (profile?.dietType) {
        const map: Record<string, DietType> = {
          omnivore: "non-veg",
          vegetarian: "veg",
          vegan: "vegan",
          keto: "keto",
          paleo: "non-veg",
        };
        setDietaryPreference(map[profile.dietType] ?? "veg");
      }
      if (profile?.allergies && profile.allergies.length > 0) {
        setAllergies(profile.allergies as AllergyType[]);
      }
    })();
  }, []);

  function toggleCuisine(c: CuisineRegion) {
    setCuisinePreferences((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function toggleAllergy(a: AllergyType) {
    setAllergies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    );
  }

  function toggleCondition(c: MedicalCondition) {
    setMedicalConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const req: StructuredMealPlanRequest = {
        age,
        gender,
        heightCm,
        weightKg,
        activityLevel,
        dietaryPreference,
        cuisinePreferences,
        allergies,
        healthGoal,
        medicalConditions,
      };

      const plan = generateStructuredMealPlan(req);

      await AsyncStorage.setItem(
        "@aura/last_nutrition_plan",
        JSON.stringify({ structuredPlan: plan, request: req }),
      );

      router.push("/physical/nutrition-plan");
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 flex-row items-center gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <Text className="text-[22px] font-bold text-black tracking-tight">
            Nutrition Setup
          </Text>
        </View>

        {/* ── Personal Info ── */}
        <SectionLabel label="Personal Info" />
        <GlassCard className="p-4 mb-4">
          <View className="gap-4">
            <View>
              <Text className="text-[13px] text-[#8A8A8E] font-medium mb-2">Gender</Text>
              <ChipSelect
                options={GENDER_OPTIONS}
                selected={gender}
                onToggle={(v) => setGender(v)}
                color="#007AFF"
              />
            </View>
            <View className="flex-row gap-6">
              <View className="flex-1">
                <Text className="text-[13px] text-[#8A8A8E] font-medium mb-2">Age</Text>
                <NumberStepper value={age} onChange={setAge} min={12} max={90} step={1} unit="yrs" />
              </View>
            </View>
            <View>
              <Text className="text-[13px] text-[#8A8A8E] font-medium mb-2">Height</Text>
              <NumberStepper value={heightCm} onChange={setHeightCm} min={100} max={220} step={1} unit="cm" />
            </View>
            <View>
              <Text className="text-[13px] text-[#8A8A8E] font-medium mb-2">Weight</Text>
              <NumberStepper value={weightKg} onChange={setWeightKg} min={30} max={200} step={1} unit="kg" />
            </View>
          </View>
        </GlassCard>

        {/* ── Activity Level ── */}
        <SectionLabel label="Activity Level" />
        <GlassCard className="p-4 mb-4">
          <ChipSelect
            options={ACTIVITY_OPTIONS}
            selected={activityLevel}
            onToggle={(v) => setActivityLevel(v)}
            color="#34C759"
          />
        </GlassCard>

        {/* ── Health Goal ── */}
        <SectionLabel label="Health Goal" />
        <GlassCard className="p-4 mb-4">
          <ChipSelect
            options={HEALTH_GOALS.map((g) => ({ value: g, label: HEALTH_GOAL_LABELS[g] }))}
            selected={healthGoal}
            onToggle={(v) => setHealthGoal(v)}
            color="#FF9500"
          />
        </GlassCard>

        {/* ── Dietary Preference ── */}
        <SectionLabel label="Dietary Preference" />
        <GlassCard className="p-4 mb-4">
          <ChipSelect
            options={DIET_OPTIONS}
            selected={dietaryPreference}
            onToggle={(v) => setDietaryPreference(v)}
            color="#AF52DE"
          />
        </GlassCard>

        {/* ── Regional Cuisine ── */}
        <SectionLabel label="Regional Cuisine Preference" />
        <GlassCard className="p-4 mb-4">
          <ChipSelect
            options={CUISINE_REGIONS.map((c) => ({ value: c, label: CUISINE_REGION_LABELS[c] }))}
            selected={cuisinePreferences}
            onToggle={toggleCuisine}
            multi
            color="#007AFF"
          />
        </GlassCard>

        {/* ── Allergies ── */}
        <SectionLabel label="Allergies" />
        <GlassCard className="p-4 mb-4">
          <ChipSelect
            options={ALLERGY_OPTIONS.map((a) => ({
              value: a,
              label: a.charAt(0).toUpperCase() + a.slice(1),
            }))}
            selected={allergies}
            onToggle={toggleAllergy}
            multi
            color="#FF3B30"
          />
          <Text className="text-[11px] text-[#8A8A8E] mt-2">
            Select any food allergies. Meals will exclude these.
          </Text>
        </GlassCard>

        {/* ── Medical Conditions ── */}
        <SectionLabel label="Existing Medical Conditions" />
        <GlassCard className="p-4 mb-6">
          <View className="flex-row flex-wrap gap-2">
            {MEDICAL_CONDITIONS.map((c) => {
              const active = medicalConditions.includes(c);
              return (
                <Pressable
                  key={c}
                  onPress={() => toggleCondition(c)}
                  className="px-3.5 py-2 rounded-full"
                  style={{
                    backgroundColor: active ? "#FF2D55" : "#fff",
                    borderWidth: 1.5,
                    borderColor: active ? "#FF2D55" : "#E5E5EA",
                  }}
                >
                  <Text
                    className="font-semibold text-[13px]"
                    style={{ color: active ? "#fff" : "#3C3C43" }}
                  >
                    {MEDICAL_CONDITION_LABELS[c]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="text-[11px] text-[#8A8A8E] mt-2">
            Diet plan will be adjusted based on medical conditions.
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Generate Button */}
      <View className="px-6 pb-6 pt-2">
        {loading ? (
          <GlassCard className="p-4 items-center flex-row justify-center gap-2">
            <ActivityIndicator color="#34C759" />
            <Text className="text-[15px] font-medium text-[#8A8A8E]">Building meal plan...</Text>
          </GlassCard>
        ) : (
          <Pressable
            onPress={handleGenerate}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: "#34C759" }}
          >
            <Text className="text-white text-[17px] font-semibold">
              Generate Nutrition Plan
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
      {label}
    </Text>
  );
}
