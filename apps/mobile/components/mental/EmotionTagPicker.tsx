import { View, Text, Pressable } from "react-native";
import { MENTAL_EMOTION_TAGS, type EmotionTag } from "@aura/types";

const EMOTION_EMOJIS: Record<EmotionTag, string> = {
  happy: "😊",
  calm: "😌",
  anxious: "😰",
  sad: "😢",
  angry: "😠",
  hopeful: "🌟",
  grateful: "🙏",
  overwhelmed: "😵",
  lonely: "😞",
  scared: "😨",
  numb: "😶",
  energized: "⚡",
};

interface EmotionTagPickerProps {
  selected: EmotionTag[];
  onChange: (tags: EmotionTag[]) => void;
  color?: string;
}

export function EmotionTagPicker({ selected, onChange, color = "#AF52DE" }: EmotionTagPickerProps) {
  function toggle(tag: EmotionTag) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <View className="mb-5">
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
        How are you feeling?
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {MENTAL_EMOTION_TAGS.map((tag) => {
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
              <Text style={{ fontSize: 14 }}>{EMOTION_EMOJIS[tag]}</Text>
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
