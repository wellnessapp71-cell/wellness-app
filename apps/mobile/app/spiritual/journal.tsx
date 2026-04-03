import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { getSpiritualJournals } from "@/lib/spiritual-store";
import type { SpiritualJournalEntry } from "@aura/types";

const TEAL = "#30B0C7";

const TYPE_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  gratitude: { emoji: "🙏", label: "Gratitude", color: "#34C759" },
  reflection: { emoji: "💭", label: "Reflection", color: TEAL },
  free: { emoji: "📝", label: "Free Writing", color: "#FF9500" },
};

export default function SpiritualJournalScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<SpiritualJournalEntry[]>([]);
  const [filterType, setFilterType] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const all = await getSpiritualJournals(); // already newest-first
        setEntries(all);
      })();
    }, []),
  );

  // ── Weekly summary ─────────────────────────────────────────────
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekAgoIso = weekAgo.toISOString();

  const thisWeek = entries.filter((e) => e.createdAt >= weekAgoIso);
  const weekCount = thisWeek.length;
  const gratitudeCount = thisWeek.filter((e) => e.promptType === "gratitude").length;

  // ── Filter ─────────────────────────────────────────────────────
  const filtered = filterType
    ? entries.filter((e) => e.promptType === filterType)
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
          <Text className="text-[20px] font-bold text-black tracking-tight">Journal & Gratitude</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Weekly summary */}
        {weekCount > 0 && (
          <GlassCard className="p-4 mb-4 mt-3" style={{ backgroundColor: TEAL + "08" }}>
            <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
              You journaled <Text className="font-bold">{weekCount} time{weekCount !== 1 ? "s" : ""}</Text> this week
              {gratitudeCount > 0 && (
                <>, including <Text className="font-bold">{gratitudeCount} gratitude</Text> entry{gratitudeCount !== 1 ? "ies" : "y"}</>
              )}.
            </Text>
          </GlassCard>
        )}

        {/* Type filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ gap: 8 }}
        >
          <Pressable
            onPress={() => setFilterType(null)}
            className="px-3 py-1.5 rounded-full"
            style={{
              backgroundColor: filterType === null ? TEAL : "#fff",
              borderWidth: 1.5,
              borderColor: filterType === null ? TEAL : "#E5E5EA",
            }}
          >
            <Text
              className="text-[13px] font-semibold"
              style={{ color: filterType === null ? "#fff" : "#3C3C43" }}
            >
              All
            </Text>
          </Pressable>
          {Object.entries(TYPE_LABELS).map(([key, info]) => {
            const active = filterType === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilterType(active ? null : key)}
                className="flex-row items-center gap-1 px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor: active ? info.color : "#fff",
                  borderWidth: 1.5,
                  borderColor: active ? info.color : "#E5E5EA",
                }}
              >
                <Text style={{ fontSize: 14 }}>{info.emoji}</Text>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: active ? "#fff" : "#3C3C43" }}
                >
                  {info.label}
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
              {filterType ? `No ${filterType} entries.` : "Tap + to write your first reflection."}
            </Text>
          </View>
        ) : (
          filtered.map((entry) => (
            <SpiritualJournalCard
              key={entry.id}
              entry={entry}
              onPress={() =>
                router.push({ pathname: "/spiritual/journal-entry", params: { id: entry.id } })
              }
            />
          ))
        )}

        <View className="h-24" />
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/spiritual/journal-entry")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: TEAL, elevation: 8 }}
      >
        <Text className="text-white text-[28px] font-light">+</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// ─── Journal Entry Card ───────────────────────────────────────────────────────

function SpiritualJournalCard({
  entry,
  onPress,
}: {
  entry: SpiritualJournalEntry;
  onPress: () => void;
}) {
  const typeInfo = TYPE_LABELS[entry.promptType] ?? TYPE_LABELS.free;
  const date = new Date(entry.createdAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  // Get preview text
  const preview =
    entry.gratitudeText ||
    entry.reflectionText ||
    entry.whatBroughtCalm ||
    entry.whatTriggeredDiscomfort ||
    entry.whatHelped ||
    "No content";

  return (
    <Pressable onPress={onPress} className="mb-3">
      <GlassCard className="p-4">
        <View className="flex-row items-center gap-2 mb-2">
          <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: typeInfo.color + "15" }}>
            <Text className="text-[11px] font-semibold" style={{ color: typeInfo.color }}>
              {typeInfo.emoji} {typeInfo.label}
            </Text>
          </View>
          {entry.moodTag && (
            <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: TEAL + "15" }}>
              <Text className="text-[11px] font-semibold capitalize" style={{ color: TEAL }}>
                {entry.moodTag}
              </Text>
            </View>
          )}
          <Text className="text-[11px] text-[#8A8A8E] ml-auto">{dateStr}</Text>
        </View>
        <Text className="text-[14px] text-[#3C3C43] leading-relaxed" numberOfLines={3}>
          {preview}
        </Text>
      </GlassCard>
    </Pressable>
  );
}
