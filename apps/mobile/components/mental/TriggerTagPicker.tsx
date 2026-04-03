import { View, Text, Pressable } from "react-native";
import { MENTAL_TRIGGER_TAGS, type TriggerTag } from "@aura/types";

const TRIGGER_EMOJIS: Record<TriggerTag, string> = {
  work: "💼",
  relationships: "💔",
  finances: "💰",
  health: "🏥",
  sleep: "😴",
  loneliness: "🫂",
  grief: "🕊️",
  family: "👨‍👩‍👧",
  social_media: "📱",
  news: "📰",
  other: "❓",
};

interface TriggerTagPickerProps {
  label?: string;
  selected: TriggerTag[];
  onChange: (tags: TriggerTag[]) => void;
  color?: string;
}

export function TriggerTagPicker({
  label = "Stress Triggers",
  selected,
  onChange,
  color = "#FF9500",
}: TriggerTagPickerProps) {
  function toggle(tag: TriggerTag) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <View className="mb-5">
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {MENTAL_TRIGGER_TAGS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggle(tag)}
              className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
              style={{
                backgroundColor: active ? color : "#fff",
                borderWidth: 1.5,
                borderColor: active ? color : "#E5E5EA",
              }}
            >
              <Text style={{ fontSize: 14 }}>{TRIGGER_EMOJIS[tag]}</Text>
              <Text
                className="text-[13px] font-semibold capitalize"
                style={{ color: active ? "#fff" : "#3C3C43" }}
              >
                {tag.replace("_", " ")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
