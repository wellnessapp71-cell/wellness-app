import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getMealLogs,
  getLifestyleBaseline,
  getLifestyleCheckIns,
} from "@/lib/lifestyle-store";
import type { MealLog, LifestyleBaseline } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, Utensils, Plus, Apple, Salad } from "lucide-react-native";

const THEME = "#FF2D55";

const QUALITY_COLORS = { good: "#34C759", fair: "#FFCC00", poor: "#FF3B30" };
const MEAL_ICONS: Record<string, string> = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍿",
};

export default function FoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealLog[]>([]);
  const [recentMeals, setRecentMeals] = useState<MealLog[]>([]);
  const [avgServings, setAvgServings] = useState(0);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);

  const todayDate = new Date().toISOString().split("T")[0];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        const meals = await getMealLogs();
        setTodayMeals(meals.filter((m) => m.date === todayDate));
        setRecentMeals(meals.slice(-20).reverse());

        const checkIns = await getLifestyleCheckIns();
        const recent = checkIns.slice(-7);
        if (recent.length > 0) {
          setAvgServings(
            Math.round(
              (recent.reduce((s, c) => s + c.fruitVegServings, 0) /
                recent.length) *
                10,
            ) / 10,
          );
        }
      })();
    }, []),
  );

  const scoreColor =
    (baseline?.nutritionScore ?? 0) >= 80
      ? "#34C759"
      : (baseline?.nutritionScore ?? 0) >= 60
        ? "#FFCC00"
        : (baseline?.nutritionScore ?? 0) >= 40
          ? "#FF9500"
          : "#FF3B30";

  const mealsByType = {
    breakfast: todayMeals.filter((m) => m.mealType === "breakfast"),
    lunch: todayMeals.filter((m) => m.mealType === "lunch"),
    dinner: todayMeals.filter((m) => m.mealType === "dinner"),
    snack: todayMeals.filter((m) => m.mealType === "snack"),
  };

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFAFC]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          className="pt-6 flex-row items-center justify-between mb-8"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </Pressable>
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">
            Nutrition
          </Text>
          <View className="w-10" />
        </Animated.View>

        {/* Score */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: THEME + "15" }}
            >
              <Utensils size={28} color={THEME} strokeWidth={2} />
            </View>
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Nutrition Score
            </Text>
            <Text
              className="text-[48px] font-bold tracking-tighter"
              style={{ color: scoreColor }}
            >
              {baseline?.nutritionScore ?? "—"}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Today Summary */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Today
          </Text>
          <View className="flex-row gap-3 mb-4 justify-between">
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Apple size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {todayMeals.length}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Meals
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Salad size={20} color="#34C759" strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {avgServings}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Avg F&V
                </Text>
              </GlassCard>
            </View>
          </View>

          {/* Meal slots */}
          {(["breakfast", "lunch", "dinner", "snack"] as const).map((type) => {
            const meals = mealsByType[type];
            return (
              <GlassCard
                key={type}
                className="p-4 flex-row items-center gap-3 border border-black/5 bg-white/60 mb-2"
              >
                <Text style={{ fontSize: 20 }}>{MEAL_ICONS[type]}</Text>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-[#1C1C1E] capitalize">
                    {type}
                  </Text>
                  {meals.length > 0 ? (
                    meals.map((m) => (
                      <View
                        key={m.id}
                        className="flex-row items-center gap-2 mt-1"
                      >
                        <View
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: QUALITY_COLORS[m.foodQualityFlag],
                          }}
                        />
                        <Text
                          className="text-[12px] text-[#8A8A8E]"
                          numberOfLines={1}
                        >
                          {m.description}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text className="text-[12px] text-[#C7C7CC] mt-0.5">
                      Not logged
                    </Text>
                  )}
                </View>
                {meals.length === 0 && (
                  <Pressable
                    onPress={() => router.push("/lifestyle/log-meal")}
                    className="px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: THEME + "15" }}
                  >
                    <Text
                      className="text-[12px] font-semibold"
                      style={{ color: THEME }}
                    >
                      + Add
                    </Text>
                  </Pressable>
                )}
              </GlassCard>
            );
          })}
        </Animated.View>

        {/* Quick Add */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <Pressable onPress={() => router.push("/lifestyle/log-meal")}>
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: THEME }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: THEME + "15" }}
              >
                <Plus size={22} color={THEME} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Log a Meal
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Quick meal entry with quality flag
                </Text>
              </View>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Recent Logs */}
        {recentMeals.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Recent Meals
            </Text>
            <View className="gap-2">
              {recentMeals.slice(0, 10).map((m) => (
                <GlassCard
                  key={m.id}
                  className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                >
                  <Text style={{ fontSize: 16 }}>
                    {MEAL_ICONS[m.mealType] ?? "🍽️"}
                  </Text>
                  <View className="flex-1">
                    <Text
                      className="text-[13px] font-bold text-[#1C1C1E]"
                      numberOfLines={1}
                    >
                      {m.description}
                    </Text>
                    <Text className="text-[11px] text-[#8A8A8E]">
                      {m.date} · {m.mealType}
                    </Text>
                  </View>
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: QUALITY_COLORS[m.foodQualityFlag],
                    }}
                  />
                </GlassCard>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Premium */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify()}
        >
          <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
            <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Premium
            </Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">
              Meal Planner
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
              AI-powered personalised meal plans and nutrition tracking
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
