import { View, Text, Pressable } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import type { MentalJournalEntry, EmotionTag } from "@aura/types";

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

interface JournalCardProps {
  entry: MentalJournalEntry;
  onPress: () => void;
}

export function JournalCard({ entry, onPress }: JournalCardProps) {
  const date = new Date(entry.createdAtIso);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const preview =
    entry.text.length > 120
      ? entry.text.slice(0, 120).trimEnd() + "..."
      : entry.text;

  return (
    <Pressable onPress={onPress}>
      <GlassCard className="p-4 mb-3">
        {/* Date row */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[13px] font-semibold text-[#8A8A8E]">
            {dateLabel} · {timeLabel}
          </Text>
          {entry.linkedScanId && (
            <View className="bg-[#AF52DE10] px-2 py-0.5 rounded">
              <Text className="text-[10px] font-semibold text-[#AF52DE]">📸 Scan linked</Text>
            </View>
          )}
        </View>

        {/* Text preview */}
        <Text className="text-[15px] text-[#3C3C43] leading-relaxed mb-3">
          {preview}
        </Text>

        {/* Emotion chips */}
        {entry.emotionTags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {entry.emotionTags.map((tag) => (
              <View
                key={tag}
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: (EMOTION_COLORS[tag] ?? "#8E8E93") + "20" }}
              >
                <Text
                  className="text-[11px] font-semibold capitalize"
                  style={{ color: EMOTION_COLORS[tag] ?? "#8E8E93" }}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}
      </GlassCard>
    </Pressable>
  );
}
