import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { JournalCard } from "@/components/mental/JournalCard";
import { getJournalEntries } from "@/lib/mental-store";
import { MENTAL_EMOTION_TAGS, type EmotionTag, type MentalJournalEntry } from "@aura/types";

const EMOTION_COLORS: Partial<Record<EmotionTag, string>> = {
  happy: "#34C759",
  calm: "#5856D6",
  anxious: "#FF9500",
  sad: "#007AFF",
  angry: "#FF3B30",
  hopeful: "#30B0C7",
  grateful: "#AF52DE",
  overwhelmed: "#FF2D55",
  lonely: "#8E8E93",
  scared: "#FF9500",
  numb: "#C6C6C8",
  energized: "#FFCC00",
};

export default function JournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<MentalJournalEntry[]>([]);
  const [filterTag, setFilterTag] = useState<EmotionTag | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const all = await getJournalEntries(); // already newest-first
        setEntries(all);
      })();
    }, []),
  );

  // ── Weekly summary ────────────────────────────────────────────────────────
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekAgoIso = weekAgo.toISOString();

  const thisWeek = entries.filter((e) => e.createdAtIso >= weekAgoIso);
  const weekCount = thisWeek.length;

  // Top triggers this week
  const triggerCounts: Record<string, number> = {};
  for (const e of thisWeek) {
    for (const tag of e.triggerTags) {
      triggerCounts[tag] = (triggerCounts[tag] ?? 0) + 1;
    }
  }
  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([tag]) => tag.replace("_", " "));

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = filterTag
    ? entries.filter((e) => e.emotionTags.includes(filterTag))
    : entries;

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <Text className="text-[20px] font-bold text-black tracking-tight">Journal</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Weekly summary */}
        {weekCount > 0 && (
          <GlassCard className="p-4 mb-4 mt-3" style={{ backgroundColor: "#AF52DE08" }}>
            <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
              You journaled <Text className="font-bold">{weekCount} time{weekCount !== 1 ? "s" : ""}</Text> this week.
              {topTriggers.length > 0 && (
                <> Most common triggers: <Text className="font-bold">{topTriggers.join(", ")}</Text>.</>
              )}
            </Text>
          </GlassCard>
        )}

        {/* Emotion filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          <Pressable
            onPress={() => setFilterTag(null)}
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: filterTag === null ? "#AF52DE" : "#fff",
              borderWidth: 1.5,
              borderColor: filterTag === null ? "#AF52DE" : "#E5E5EA",
            }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: filterTag === null ? "#fff" : "#3C3C43" }}
            >
              All
            </Text>
          </Pressable>
          {MENTAL_EMOTION_TAGS.map((tag) => {
            const active = filterTag === tag;
            const color = EMOTION_COLORS[tag] ?? "#8E8E93";
            return (
              <Pressable
                key={tag}
                onPress={() => setFilterTag(active ? null : tag)}
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: active ? color : "#fff",
                  borderWidth: 1.5,
                  borderColor: active ? color : "#E5E5EA",
                }}
              >
                <Text
                  className="text-[13px] font-semibold capitalize"
                  style={{ color: active ? "#fff" : "#3C3C43" }}
                >
                  {tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Entries */}
        {filtered.length === 0 ? (
          <View className="items-center py-16">
            <Text style={{ fontSize: 40 }}>📔</Text>
            <Text className="text-[17px] font-bold text-black mt-3">No entries yet</Text>
            <Text className="text-[14px] text-[#8A8A8E] mt-1 text-center">
              {filterTag ? `No entries tagged "${filterTag}".` : "Tap + to write your first journal entry."}
            </Text>
          </View>
        ) : (
          filtered.map((entry) => (
            <JournalCard
              key={entry.entryId}
              entry={entry}
              onPress={() =>
                router.push({ pathname: "/mental/journal-entry", params: { id: entry.entryId } })
              }
            />
          ))
        )}

        <View className="h-24" />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/mental/journal-entry")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-[#AF52DE] items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Text className="text-white text-[28px] font-light">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}
