import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import Svg, { Circle } from "react-native-svg";
import { GlassCard } from "@/components/ui/glass-card";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getActiveNutritionPlan } from "@/lib/plan-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import { scheduleMealReminders } from "@/lib/notification-service";
import {
  getTodayMealStatus,
  markMealEaten,
  markMealSkipped,
  redistributeMacros,
  type MealStatus,
} from "@/lib/meal-tracking-store";
import type {
  DailyMealPlan,
  IngredientBreakdown,
  MealSlot,
  MealReminder,
  StructuredMeal,
} from "@aura/types";
import { MEAL_SLOT_LABELS, MEAL_SLOT_TIMES } from "@aura/types";

const SLOT_ICONS: Record<MealSlot, string> = {
  breakfast: "sunrise",
  lunch: "sun",
  snacks: "cookie",
  dinner: "moon",
};

const SLOT_EMOJI: Record<MealSlot, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  snacks: "🍪",
  dinner: "🌙",
};

const SLOT_COLORS: Record<MealSlot, string> = {
  breakfast: "#FF9500",
  lunch: "#007AFF",
  snacks: "#AF52DE",
  dinner: "#5856D6",
};

// ─── Macro Ring (reused from before, but smaller) ──────────────────────

function MacroRing({
  protein,
  carbs,
  fat,
  calories,
  size = 140,
}: {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;
  const stroke = size * 0.11;
  const circumference = 2 * Math.PI * r;
  const total = protein + carbs + fat || 1;

  const segments = [
    { value: protein / total, color: "#007AFF", label: "Protein" },
    { value: carbs / total, color: "#FF9500", label: "Carbs" },
    { value: fat / total, color: "#AF52DE", label: "Fat" },
  ];

  let offset = 0;
  return (
    <View className="items-center">
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} stroke="#F2F2F7" strokeWidth={stroke} fill="none" />
          {segments.map((seg, i) => {
            const dash = seg.value * circumference;
            const gap = circumference - dash;
            const el = (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                fill="none"
                strokeLinecap="butt"
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += dash;
            return el;
          })}
        </Svg>
        <View className="absolute items-center justify-center" style={{ width: size, height: size }}>
          <Text className="text-[20px] font-bold text-black">{Math.round(calories)}</Text>
          <Text className="text-[9px] font-semibold text-[#8A8A8E] uppercase">kcal</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Nutrient Pill ─────────────────────────────────────────────────────

function NutrientPill({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View className="items-center">
      <Text className="text-[13px] font-bold" style={{ color }}>{Math.round(value * 10) / 10}</Text>
      <Text className="text-[10px] text-[#8A8A8E]">{unit}</Text>
      <Text className="text-[9px] text-[#8A8A8E] font-medium">{label}</Text>
    </View>
  );
}

// ─── Ingredient Row ────────────────────────────────────────────────────

function IngredientRow({ ing }: { ing: IngredientBreakdown }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Pressable onPress={() => setExpanded(!expanded)}>
      <View className="py-2 border-b border-[#F2F2F7]">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-[14px] font-medium text-black capitalize">{ing.name}</Text>
            <Text className="text-[11px] text-[#8A8A8E]">{ing.servingDesc}</Text>
          </View>
          <View className="flex-row gap-3 items-center">
            <Text className="text-[13px] font-bold text-black">{ing.calories} kcal</Text>
            <Text className="text-[12px] text-[#8A8A8E]">{expanded ? "▲" : "▼"}</Text>
          </View>
        </View>
        {expanded && (
          <View className="mt-2 bg-[#F9F9FB] rounded-lg p-3">
            <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase mb-2">Macros</Text>
            <View className="flex-row justify-between mb-3">
              <NutrientPill label="Protein" value={ing.protein} unit="g" color="#007AFF" />
              <NutrientPill label="Carbs" value={ing.carbs} unit="g" color="#FF9500" />
              <NutrientPill label="Fat" value={ing.fat} unit="g" color="#AF52DE" />
              <NutrientPill label="Fiber" value={ing.fiber} unit="g" color="#34C759" />
            </View>
            <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase mb-2">Micros</Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-1">
              <MicroRow label="Vit A" value={ing.vitA} unit="mcg" />
              <MicroRow label="Vit B12" value={ing.vitB12} unit="mcg" />
              <MicroRow label="Calcium" value={ing.calcium} unit="mg" />
              <MicroRow label="Iron" value={ing.iron} unit="mg" />
              <MicroRow label="Sodium" value={ing.sodium} unit="mg" />
              <MicroRow label="Potassium" value={ing.potassium} unit="mg" />
              <MicroRow label="Omega-3" value={ing.omega3} unit="mg" />
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function MicroRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <Text className="text-[11px] text-[#8A8A8E]">{label}:</Text>
      <Text className="text-[11px] font-semibold text-[#3C3C43]">{Math.round(value * 10) / 10} {unit}</Text>
    </View>
  );
}

// ─── Meal Card ─────────────────────────────────────────────────────────

function MealCard({
  meal,
  status,
  adjustedMacros,
  onEat,
  onSkip,
}: {
  meal: StructuredMeal;
  status: MealStatus;
  adjustedMacros?: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  onEat: () => void;
  onSkip: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = SLOT_COLORS[meal.slot];
  const t = adjustedMacros ?? meal.totals;
  const isSkipped = status === "skipped";
  const isEaten = status === "eaten";
  const isAdjusted = adjustedMacros && status === "pending" &&
    Math.round(adjustedMacros.calories) !== Math.round(meal.totals.calories);

  return (
    <GlassCard className="mb-3 overflow-hidden" style={isSkipped ? { opacity: 0.5 } : undefined}>
      <Pressable onPress={() => setExpanded(!expanded)} className="p-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-2xl items-center justify-center"
            style={{ backgroundColor: color + "15" }}
          >
            <Text style={{ fontSize: 20 }}>{SLOT_EMOJI[meal.slot]}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="text-[16px] font-bold text-black">{MEAL_SLOT_LABELS[meal.slot]}</Text>
              <Text className="text-[12px] text-[#8A8A8E]">{meal.time}</Text>
              {isEaten && (
                <View className="bg-[#34C75920] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#34C759]">EATEN</Text>
                </View>
              )}
              {isSkipped && (
                <View className="bg-[#FF3B3020] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#FF3B30]">SKIPPED</Text>
                </View>
              )}
              {isAdjusted && (
                <View className="bg-[#FF950020] px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-bold text-[#FF9500]">ADJUSTED</Text>
                </View>
              )}
            </View>
            <Text className="text-[14px] text-[#3C3C43] mt-0.5">{meal.dishName}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[16px] font-bold" style={{ color }}>{Math.round(t.calories)}</Text>
            <Text className="text-[10px] text-[#8A8A8E]">kcal</Text>
          </View>
        </View>

        {/* Macro summary row */}
        <View className="flex-row gap-4 mt-3 ml-[52px]">
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-[#007AFF]" />
            <Text className="text-[12px] font-semibold text-[#007AFF]">P {Math.round(t.protein)}g</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-[#FF9500]" />
            <Text className="text-[12px] font-semibold text-[#FF9500]">C {Math.round(t.carbs)}g</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-[#AF52DE]" />
            <Text className="text-[12px] font-semibold text-[#AF52DE]">F {Math.round(t.fat)}g</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-[#34C759]" />
            <Text className="text-[12px] font-semibold text-[#34C759]">Fb {Math.round(t.fiber)}g</Text>
          </View>
        </View>

        {/* Eaten / Skip buttons */}
        {status === "pending" && (
          <View className="flex-row gap-2 mt-3 ml-[52px]">
            <Pressable
              onPress={(e) => { e.stopPropagation(); onEat(); }}
              className="bg-[#34C759] px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-[13px] font-semibold">Eaten</Text>
            </Pressable>
            <Pressable
              onPress={(e) => { e.stopPropagation(); onSkip(); }}
              className="bg-[#FF3B30] px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-[13px] font-semibold">Skip</Text>
            </Pressable>
          </View>
        )}
      </Pressable>

      {/* Expanded: ingredient breakdown */}
      {expanded && (
        <View className="px-4 pb-4 border-t border-[#F2F2F7]">
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-3 mb-1">
            Ingredients ({meal.ingredients.length})
          </Text>
          {meal.ingredients.map((ing, i) => (
            <IngredientRow key={i} ing={ing} />
          ))}

          {/* Meal micro totals */}
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-3 mb-2">
            Meal Micronutrients
          </Text>
          <View className="flex-row flex-wrap gap-x-4 gap-y-1">
            <MicroRow label="Vit A" value={meal.totals.vitA} unit="mcg" />
            <MicroRow label="Vit B12" value={meal.totals.vitB12} unit="mcg" />
            <MicroRow label="Calcium" value={meal.totals.calcium} unit="mg" />
            <MicroRow label="Iron" value={meal.totals.iron} unit="mg" />
            <MicroRow label="Sodium" value={meal.totals.sodium} unit="mg" />
            <MicroRow label="Potassium" value={meal.totals.potassium} unit="mg" />
            <MicroRow label="Omega-3" value={meal.totals.omega3} unit="mg" />
          </View>
        </View>
      )}
    </GlassCard>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────

export default function NutritionPlanScreen() {
  const router = useRouter();
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const [plan, setPlan] = useState<DailyMealPlan | null>(null);
  const [reminders, setReminders] = useState<MealReminder[]>([
    { slot: "breakfast", time: "07:30", enabled: true },
    { slot: "lunch", time: "12:30", enabled: true },
    { slot: "snacks", time: "16:00", enabled: true },
    { slot: "dinner", time: "20:00", enabled: true },
  ]);
  const [showReminders, setShowReminders] = useState(false);
  const [mealStatuses, setMealStatuses] = useState<Record<string, MealStatus>>({});
  const [adjustedMacros, setAdjustedMacros] = useState<Record<string, any>>({});
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        let nutritionData: any = null;

        // 1. Deep link: fetch from backend by planId
        if (planId) {
          try {
            const remote = await api.get<any>(`/plans/${planId}`);
            if (remote?.content) {
              nutritionData = typeof remote.content === "string"
                ? JSON.parse(remote.content)
                : remote.content;
            }
          } catch (err) {
            recordFailedSync("fetch nutrition plan by id", err);
          }
        }

        // 2. Fall back to plan-store (active plan)
        if (!nutritionData) {
          const active = await getActiveNutritionPlan();
          if (active?.content) {
            nutritionData = active.content;
            if (!planId) setActivePlanId(active.planId);
          }
        }
        if (planId) setActivePlanId(planId);

        // 3. Fall back to last generated plan (legacy)
        if (!nutritionData) {
          const raw = await AsyncStorage.getItem("@aura/last_nutrition_plan");
          nutritionData = raw ? JSON.parse(raw) : null;
        }

        if (nutritionData?.structuredPlan) {
          setPlan(nutritionData.structuredPlan);
        }
        if (nutritionData?.reminders) {
          setReminders(nutritionData.reminders);
        }

        // Load today's meal tracking
        const statuses = await getTodayMealStatus();
        setMealStatuses(statuses);
        if (nutritionData?.structuredPlan?.meals) {
          const adjusted = redistributeMacros(nutritionData.structuredPlan.meals, statuses);
          setAdjustedMacros(adjusted);
        }
      })();
    }, [planId]),
  );

  function toggleReminder(slot: MealSlot) {
    setReminders((prev) => {
      const next = prev.map((r) =>
        r.slot === slot ? { ...r, enabled: !r.enabled } : r,
      );
      // Persist and schedule notifications
      (async () => {
        const raw = await AsyncStorage.getItem("@aura/last_nutrition_plan");
        const data = raw ? JSON.parse(raw) : {};
        await AsyncStorage.setItem(
          "@aura/last_nutrition_plan",
          JSON.stringify({ ...data, reminders: next }),
        );
        try {
          await scheduleMealReminders(next);
        } catch (err) {
          recordFailedSync("schedule meal reminders", err);
        }
      })();
      return next;
    });
  }

  async function submitFeedback() {
    if (!activePlanId || feedbackRating === 0) return;
    setSubmittingFeedback(true);
    try {
      await api.post(`/plans/${activePlanId}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment || undefined,
        wouldRecommend: feedbackRating >= 4,
      });
      setFeedbackSubmitted(true);
    } catch (err) {
      recordFailedSync("submit nutrition plan feedback", err);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleMealAction(slot: string, action: "eaten" | "skipped") {
    if (action === "eaten") await markMealEaten(slot);
    else await markMealSkipped(slot);

    const updated = await getTodayMealStatus();
    setMealStatuses(updated);
    if (plan?.meals) {
      setAdjustedMacros(redistributeMacros(plan.meals, updated));
    }
  }

  if (!plan) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7] items-center justify-center">
        <GlassCard className="p-6 mx-6 items-center">
          <Text className="text-[17px] font-bold text-black mb-2">No Plan Generated</Text>
          <Text className="text-[14px] text-[#8A8A8E] text-center mb-4">
            Set up your nutrition preferences to get a personalized meal plan.
          </Text>
          <Pressable
            onPress={() => router.push("/physical/nutrition-setup")}
            className="bg-[#34C759] rounded-xl px-6 py-3"
          >
            <Text className="text-white font-semibold text-[15px]">Go to Setup</Text>
          </Pressable>
        </GlassCard>
      </SafeAreaView>
    );
  }

  const dt = plan.dailyTotals;

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-6 flex-row items-center gap-3 mb-4">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <View className="flex-1">
            <Text className="text-[22px] font-bold text-black tracking-tight">Nutrition Plan</Text>
            <Text className="text-[12px] text-[#8A8A8E]">{plan.dateIso}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/physical/nutrition-setup")}
            className="px-3 py-1.5 rounded-full bg-[#007AFF15]"
          >
            <Text className="text-[13px] font-semibold text-[#007AFF]">Edit</Text>
          </Pressable>
        </View>

        {/* Daily Totals Card */}
        <GlassCard className="p-5 mb-4">
          <View className="flex-row items-center">
            <MacroRing
              protein={dt.protein}
              carbs={dt.carbs}
              fat={dt.fat}
              calories={dt.calories}
              size={120}
            />
            <View className="flex-1 ml-4 gap-2">
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
                Daily Totals
              </Text>
              <MacroBar label="Protein" value={dt.protein} unit="g" color="#007AFF" />
              <MacroBar label="Carbs" value={dt.carbs} unit="g" color="#FF9500" />
              <MacroBar label="Fat" value={dt.fat} unit="g" color="#AF52DE" />
              <MacroBar label="Fiber" value={dt.fiber} unit="g" color="#34C759" />
            </View>
          </View>

          {/* Daily micros */}
          <View className="mt-4 pt-3 border-t border-[#F2F2F7]">
            <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              Daily Micronutrients
            </Text>
            <View className="flex-row flex-wrap gap-x-4 gap-y-2">
              <NutrientPill label="Vit A" value={dt.vitA} unit="mcg" color="#FF9500" />
              <NutrientPill label="B12" value={dt.vitB12} unit="mcg" color="#FF2D55" />
              <NutrientPill label="Calcium" value={dt.calcium} unit="mg" color="#5AC8FA" />
              <NutrientPill label="Iron" value={dt.iron} unit="mg" color="#8E8E93" />
              <NutrientPill label="Sodium" value={dt.sodium} unit="mg" color="#FF3B30" />
              <NutrientPill label="Potassium" value={dt.potassium} unit="mg" color="#34C759" />
              <NutrientPill label="Omega-3" value={dt.omega3} unit="mg" color="#007AFF" />
            </View>
          </View>
        </GlassCard>

        {/* Health Notes */}
        {plan.healthNotes.length > 0 && (
          <GlassCard className="p-4 mb-4" style={{ backgroundColor: "#FF950008" }}>
            <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              Health Notes
            </Text>
            {plan.healthNotes.map((note, i) => (
              <Text key={i} className="text-[13px] text-[#3C3C43] mb-1">
                • {note}
              </Text>
            ))}
          </GlassCard>
        )}

        {/* Meal Reminder Toggle */}
        <Pressable onPress={() => setShowReminders(!showReminders)}>
          <GlassCard className="p-4 mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Text style={{ fontSize: 18 }}>⏰</Text>
              <Text className="text-[15px] font-semibold text-black">Meal Reminders</Text>
            </View>
            <Text className="text-[13px] text-[#8A8A8E]">{showReminders ? "▲" : "▼"}</Text>
          </GlassCard>
        </Pressable>

        {showReminders && (
          <GlassCard className="p-4 mb-4">
            {reminders.map((rem) => (
              <View
                key={rem.slot}
                className="flex-row items-center justify-between py-3 border-b border-[#F2F2F7]"
              >
                <View className="flex-row items-center gap-3">
                  <Text style={{ fontSize: 16 }}>{SLOT_EMOJI[rem.slot]}</Text>
                  <View>
                    <Text className="text-[15px] font-medium text-black">
                      {MEAL_SLOT_LABELS[rem.slot]}
                    </Text>
                    <Text className="text-[12px] text-[#8A8A8E]">{rem.time}</Text>
                  </View>
                </View>
                <Switch
                  value={rem.enabled}
                  onValueChange={() => toggleReminder(rem.slot)}
                  trackColor={{ false: "#E5E5EA", true: "#34C759" }}
                />
              </View>
            ))}
          </GlassCard>
        )}

        {/* Meals */}
        <Text className="text-[17px] font-bold text-black tracking-tight mb-3">
          Today's Meals
        </Text>
        {plan.meals.map((meal, i) => (
          <MealCard
            key={i}
            meal={meal}
            status={mealStatuses[meal.slot] ?? "pending"}
            adjustedMacros={adjustedMacros[meal.slot]}
            onEat={() => handleMealAction(meal.slot, "eaten")}
            onSkip={() => handleMealAction(meal.slot, "skipped")}
          />
        ))}

        {/* Regenerate */}
        <Pressable
          onPress={() => router.push("/physical/nutrition-setup")}
          className="mb-4"
        >
          <GlassCard className="p-4 flex-row items-center justify-center gap-2">
            <Text className="text-[15px] font-semibold text-[#007AFF]">
              Regenerate Plan
            </Text>
          </GlassCard>
        </Pressable>

        {/* Rate This Plan */}
        {activePlanId && (
          <GlassCard className="p-5 mb-10">
            {feedbackSubmitted ? (
              <View className="items-center py-2">
                <Text className="text-[17px] font-bold text-[#34C759]">Thanks for your feedback!</Text>
                <Text className="text-[13px] text-[#8A8A8E] mt-1">Your rating helps us improve.</Text>
              </View>
            ) : (
              <View>
                <Text className="text-[15px] font-bold text-black mb-3">Rate This Plan</Text>
                <View className="flex-row gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Pressable key={star} onPress={() => setFeedbackRating(star)}>
                      <Text style={{ fontSize: 28 }}>
                        {star <= feedbackRating ? "★" : "☆"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  placeholder="Any comments? (optional)"
                  value={feedbackComment}
                  onChangeText={setFeedbackComment}
                  multiline
                  className="bg-[#F2F2F7] rounded-xl p-3 text-[14px] text-black mb-3"
                  style={{ minHeight: 60, textAlignVertical: "top" }}
                  placeholderTextColor="#8A8A8E"
                />
                <Pressable
                  onPress={submitFeedback}
                  disabled={feedbackRating === 0 || submittingFeedback}
                  className="rounded-xl py-3 items-center"
                  style={{
                    backgroundColor: feedbackRating > 0 ? "#34C759" : "#E5E5EA",
                  }}
                >
                  <Text
                    className="font-semibold text-[15px]"
                    style={{ color: feedbackRating > 0 ? "#fff" : "#8A8A8E" }}
                  >
                    {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </Text>
                </Pressable>
              </View>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroBar({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-[12px] text-[#8A8A8E] w-[50px]">{label}</Text>
      <Text className="text-[13px] font-bold text-black">
        {Math.round(value)}{unit}
      </Text>
    </View>
  );
}
