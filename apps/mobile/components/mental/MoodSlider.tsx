import { View, Text, Pressable } from "react-native";

const MOOD_EMOJIS = ["😞", "😔", "😕", "😐", "🙂", "😊", "😀", "😁", "😄", "🤩"];

interface MoodSliderProps {
  label: string;
  value: number;          // 1–10
  onChange: (v: number) => void;
  color?: string;
  invert?: boolean;       // true for stress/anxiety (lower = better)
}

export function MoodSlider({ label, value, onChange, color = "#AF52DE", invert = false }: MoodSliderProps) {
  const emojis = invert ? [...MOOD_EMOJIS].reverse() : MOOD_EMOJIS;

  return (
    <View className="mb-5">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
          {label}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Text style={{ fontSize: 20 }}>{emojis[value - 1]}</Text>
          <Text className="text-[17px] font-bold" style={{ color }}>{value}</Text>
        </View>
      </View>
      <View className="flex-row gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            className="flex-1 h-11 rounded-xl items-center justify-center"
            style={{
              backgroundColor: value === n ? color : "#fff",
              borderWidth: 1.5,
              borderColor: value === n ? color : "#E5E5EA",
            }}
          >
            <Text
              className="font-bold text-[13px]"
              style={{ color: value === n ? "#fff" : "#3C3C43" }}
            >
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row justify-between mt-1 px-1">
        <Text className="text-[10px] text-[#8A8A8E]">{invert ? "High" : "Low"}</Text>
        <Text className="text-[10px] text-[#8A8A8E]">{invert ? "Low" : "High"}</Text>
      </View>
    </View>
  );
}
