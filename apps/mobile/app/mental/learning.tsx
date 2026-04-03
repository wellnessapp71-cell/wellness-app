import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { LessonCard } from "@/components/mental/LessonCard";
import { getContentProgress } from "@/lib/mental-store";
import { MENTAL_LESSONS } from "@/lib/mental-lessons";
import { ArrowLeft, BookOpen } from "lucide-react-native";
import type { LearningCategory } from "@aura/types";
import { MENTAL_LEARNING_CATEGORIES } from "@aura/types";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All",
  stress: "Stress",
  sleep: "Sleep",
  boundaries: "Boundaries",
  emotional_regulation: "Emotional Focus",
  self_worth: "Self-Worth",
  grief: "Grief",
  resilience: "Resilience",
};

export default function LearningScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<LearningCategory | "all">("all");

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const prog = await getContentProgress();
        setProgress(prog);
      })();
    }, []),
  );

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

  return (
    <SafeAreaView className="flex-1 bg-[#FDFDFE]">
      <View className="px-6 pt-6 pb-4 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-12 h-12 rounded-full bg-[#F2F4F8] items-center justify-center"
        >
          <ArrowLeft color="#4D627A" size={24} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-2">
          <View className="flex-row items-center gap-3 mb-2">
            <View className="w-10 h-10 rounded-full bg-[#EAF7FD] items-center justify-center">
              <BookOpen color="#37A2C4" size={20} strokeWidth={2.5} />
            </View>
            <Text className="text-[32px] font-bold text-[#1C1C1E] tracking-tight">
              Library
            </Text>
          </View>

          <Text className="text-[16px] text-[#8E8E93] mb-6 leading-6">
            Swipeable mental wellness lessons. {completedCount} out of{" "}
            {modules.length} lessons completed.
          </Text>

          <View className="h-1.5 bg-[#F2F4F8] rounded-full mb-8 overflow-hidden pointer-events-none">
            <View
              className="h-full rounded-full"
              style={{
                width:
                  modules.length > 0
                    ? `${(completedCount / modules.length) * 100}%`
                    : "0%",
                backgroundColor: "#3A63AB",
              }}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-8"
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        >
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className="px-5 py-2.5 rounded-full"
                style={{
                  backgroundColor: active ? "#3A63AB" : "#F2F4F8",
                }}
              >
                <Text
                  className="text-[14px] font-bold tracking-tight"
                  style={{ color: active ? "#FFFFFF" : "#728399" }}
                >
                  {CATEGORY_LABELS[cat] ?? cat.replace("_", " ")}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="px-6 pb-12 gap-y-4">
          {filtered.length === 0 ? (
            <View className="items-center py-20 bg-[#F2F4F8] rounded-[24px]">
              <Text style={{ fontSize: 48, opacity: 0.8 }}>📚</Text>
              <Text className="text-[18px] font-bold text-[#4D627A] mt-4 tracking-tight">
                No lessons found
              </Text>
              <Text className="text-[15px] text-[#728399] mt-2 text-center px-8 leading-5">
                We couldn't find any lessons matching your selected category.
              </Text>
            </View>
          ) : (
            filtered.map((module) => (
              <LessonCard
                key={module.moduleId}
                module={module}
                progress={progress[module.moduleId] ?? 0}
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
