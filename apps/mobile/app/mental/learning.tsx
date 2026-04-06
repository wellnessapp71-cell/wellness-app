import { View, Text, ScrollView, Pressable, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState, useRef, useEffect } from "react";
import { LessonCard } from "@/components/mental/LessonCard";
import { getContentProgress } from "@/lib/mental-store";
import { MENTAL_LESSONS } from "@/lib/mental-lessons";
import {
  ArrowLeft,
  BookOpen,
  Trophy,
  Sparkles,
  GraduationCap,
} from "lucide-react-native";
import type { LearningCategory } from "@aura/types";
import { MENTAL_LEARNING_CATEGORIES } from "@aura/types";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Topics",
  stress: "Stress",
  sleep: "Sleep",
  boundaries: "Boundaries",
  emotional_regulation: "Emotions",
  self_worth: "Self-Worth",
  grief: "Grief",
  resilience: "Resilience",
};

const CATEGORY_ICONS: Record<string, string> = {
  all: "📚",
  stress: "🌿",
  sleep: "🌙",
  boundaries: "🛡️",
  emotional_regulation: "❤️",
  self_worth: "⭐",
  grief: "🌧️",
  resilience: "⛰️",
};

export default function LearningScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<LearningCategory | "all">("all");
  const headerAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const prog = await getContentProgress();
        setProgress(prog);
      })();
    }, []),
  );

  useEffect(() => {
    Animated.spring(headerAnim, {
      toValue: 1,
      speed: 8,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  const categories: (LearningCategory | "all")[] = [
    "all",
    ...MENTAL_LEARNING_CATEGORIES,
  ];
  const modules = MENTAL_LESSONS;
  const filtered =
    category === "all"
      ? modules
      : modules.filter((module) => module.category === category);
  const completedCount = modules.filter(
    (module) => (progress[module.moduleId] ?? 0) >= 100,
  ).length;
  const inProgressCount = modules.filter(
    (module) => {
      const p = progress[module.moduleId] ?? 0;
      return p > 0 && p < 100;
    },
  ).length;
  const totalPercent =
    modules.length > 0
      ? Math.round(
          modules.reduce(
            (sum, m) => sum + Math.min(100, progress[m.moduleId] ?? 0),
            0,
          ) / modules.length,
        )
      : 0;

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FC]">
      {/* ── Header ── */}
      <View className="px-6 pt-5 pb-3">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => router.back()}
            className="w-11 h-11 rounded-full bg-white items-center justify-center"
            style={{
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <ArrowLeft color="#4D627A" size={22} />
          </Pressable>
          <View className="flex-row items-center gap-2">
            <View className="px-3 py-1.5 rounded-full bg-[#EAF7FD] flex-row items-center gap-1.5">
              <GraduationCap color="#2A90B0" size={14} strokeWidth={2.5} />
              <Text className="text-[12px] font-bold text-[#2A90B0]">
                {totalPercent}% Mastery
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ── Title Section ── */}
        <Animated.View
          className="px-6 pt-2 pb-1"
          style={{
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <View className="flex-row items-center gap-3 mb-2">
            <View
              className="w-12 h-12 rounded-[18px] bg-[#E8F0FE] items-center justify-center"
              style={{
                shadowColor: "#3B6FD4",
                shadowOpacity: 0.1,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 3,
              }}
            >
              <BookOpen color="#3B6FD4" size={22} strokeWidth={2.5} />
            </View>
            <View>
              <Text className="text-[28px] font-bold text-[#1C1C1E] tracking-tight">
                Learning Library
              </Text>
              <Text className="text-[14px] text-[#8E8E93] mt-0.5">
                Build wisdom, one lesson at a time
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats Row ── */}
        <View className="px-6 pt-3 pb-5">
          <View
            className="flex-row rounded-[22px] p-4 gap-3"
            style={{
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOpacity: 0.04,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 2,
              borderWidth: 1,
              borderColor: "#F0F1F5",
            }}
          >
            {/* Completed */}
            <View className="flex-1 items-center py-2">
              <View className="w-10 h-10 rounded-full bg-[#E8F5EE] items-center justify-center mb-2">
                <Trophy color="#2D8A56" size={18} strokeWidth={2.5} />
              </View>
              <Text className="text-[20px] font-bold text-[#1C1C1E]">
                {completedCount}
              </Text>
              <Text className="text-[11px] font-semibold text-[#8E8E93] mt-0.5">
                Completed
              </Text>
            </View>

            {/* Divider */}
            <View className="w-[1px] bg-[#F0F1F5] my-2" />

            {/* In Progress */}
            <View className="flex-1 items-center py-2">
              <View className="w-10 h-10 rounded-full bg-[#FFF6E0] items-center justify-center mb-2">
                <Sparkles color="#C98520" size={18} strokeWidth={2.5} />
              </View>
              <Text className="text-[20px] font-bold text-[#1C1C1E]">
                {inProgressCount}
              </Text>
              <Text className="text-[11px] font-semibold text-[#8E8E93] mt-0.5">
                In Progress
              </Text>
            </View>

            {/* Divider */}
            <View className="w-[1px] bg-[#F0F1F5] my-2" />

            {/* Total */}
            <View className="flex-1 items-center py-2">
              <View className="w-10 h-10 rounded-full bg-[#E8F0FE] items-center justify-center mb-2">
                <BookOpen color="#3B6FD4" size={18} strokeWidth={2.5} />
              </View>
              <Text className="text-[20px] font-bold text-[#1C1C1E]">
                {modules.length}
              </Text>
              <Text className="text-[11px] font-semibold text-[#8E8E93] mt-0.5">
                Total
              </Text>
            </View>
          </View>

          {/* ── Overall Progress Bar ── */}
          <View className="mt-4 px-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[12px] font-bold text-[#8E8E93]">
                OVERALL PROGRESS
              </Text>
              <Text className="text-[12px] font-bold text-[#3B6FD4]">
                {completedCount}/{modules.length}
              </Text>
            </View>
            <View className="h-2 bg-[#E8ECF4] rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width:
                    modules.length > 0
                      ? `${(completedCount / modules.length) * 100}%`
                      : "0%",
                  backgroundColor: "#3B6FD4",
                }}
              />
            </View>
          </View>
        </View>

        {/* ── Category Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-full"
                style={{
                  backgroundColor: active ? "#1C1C1E" : "#FFFFFF",
                  borderWidth: active ? 0 : 1,
                  borderColor: "#E8ECF4",
                  shadowColor: active ? "#1C1C1E" : "#000",
                  shadowOpacity: active ? 0.15 : 0.03,
                  shadowRadius: active ? 8 : 4,
                  shadowOffset: { width: 0, height: active ? 4 : 2 },
                  elevation: active ? 3 : 1,
                }}
              >
                <Text className="text-[14px]">
                  {CATEGORY_ICONS[cat] ?? "📎"}
                </Text>
                <Text
                  className="text-[13px] font-bold tracking-tight"
                  style={{ color: active ? "#FFFFFF" : "#4D627A" }}
                >
                  {CATEGORY_LABELS[cat] ?? cat.replace("_", " ")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Results Header ── */}
        <View className="px-6 mb-3">
          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider">
            {filtered.length} {filtered.length === 1 ? "LESSON" : "LESSONS"}{" "}
            {category !== "all" && `IN ${(CATEGORY_LABELS[category] ?? category).toUpperCase()}`}
          </Text>
        </View>

        {/* ── Lesson Cards ── */}
        <View className="px-6 pb-12">
          {filtered.length === 0 ? (
            <View
              className="items-center py-16 rounded-[28px]"
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#F0F1F5",
              }}
            >
              <Text style={{ fontSize: 48, opacity: 0.8 }}>📚</Text>
              <Text className="text-[18px] font-bold text-[#4D627A] mt-4 tracking-tight">
                No lessons found
              </Text>
              <Text className="text-[14px] text-[#8E8E93] mt-2 text-center px-8 leading-5">
                Try selecting a different category to discover more lessons.
              </Text>
            </View>
          ) : (
            filtered.map((module) => (
              <LessonCard
                key={module.moduleId}
                module={module}
                progress={progress[module.moduleId] ?? 0}
                slideCount={module.slides?.length ?? 0}
                onPress={() =>
                  router.push({
                    pathname: "/mental/lesson",
                    params: { moduleId: module.moduleId },
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
