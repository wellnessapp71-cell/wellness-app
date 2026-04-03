import { View, Text, Pressable } from "react-native";
import { Timer, CheckCircle2, ChevronRight } from "lucide-react-native";
import type { LearningModule } from "@aura/types";

const CATEGORY_COLORS: Record<
  string,
  { bg: string; accent: string; icon: string }
> = {
  stress: { bg: "#F2F8F5", accent: "#3BA068", icon: "🌿" },
  sleep: { bg: "#F2F4F8", accent: "#4D627A", icon: "🌙" },
  boundaries: { bg: "#F5FCFE", accent: "#2A839E", icon: "🛡️" },
  emotional_regulation: { bg: "#FEF4F6", accent: "#B24D61", icon: "❤️" },
  self_worth: { bg: "#FFFAEB", accent: "#B87A1F", icon: "⭐" },
  grief: { bg: "#FDF7FD", accent: "#9E5B8E", icon: "🌧️" },
  resilience: { bg: "#F9F5FB", accent: "#814AB5", icon: "⛰️" },
  default: { bg: "#F2F6FE", accent: "#3A63AB", icon: "💡" },
};

interface LessonCardProps {
  module: LearningModule;
  progress?: number;
  onPress: () => void;
}

export function LessonCard({ module, progress = 0, onPress }: LessonCardProps) {
  const isComplete = progress >= 100;
  const theme = CATEGORY_COLORS[module.category] ?? CATEGORY_COLORS.default;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-[28px] overflow-hidden"
      style={{
        backgroundColor: theme.bg,
        shadowColor: theme.accent,
        shadowOpacity: 0.08,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View className="px-6 py-6 border border-white/40 rounded-[28px]">
        {/* Top Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="w-12 h-12 rounded-[16px] bg-white/70 items-center justify-center">
            <Text className="text-[24px]">{theme.icon}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            {progress > 0 && !isComplete && (
              <View className="px-3 py-1 rounded-full bg-white/60">
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: theme.accent }}
                >
                  {Math.round(progress)}%
                </Text>
              </View>
            )}
            {isComplete && (
              <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-white/60 border border-white/80">
                <CheckCircle2 color={theme.accent} size={14} strokeWidth={3} />
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: theme.accent }}
                >
                  Done
                </Text>
              </View>
            )}
            <View className="px-3 py-1 rounded-full bg-white/60">
              <Text
                className="text-[12px] font-bold capitalize"
                style={{ color: theme.accent }}
              >
                {module.category.replace("_", " ")}
              </Text>
            </View>
          </View>
        </View>

        {/* Title & Description */}
        <View className="mb-4">
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-1">
            {module.title}
          </Text>
          <Text
            className="text-[14px] leading-snug"
            style={{ color: theme.accent, opacity: 0.8 }}
            numberOfLines={2}
          >
            {module.description}
          </Text>
        </View>

        {/* Progress Bar (if started) */}
        {progress > 0 && progress < 100 && (
          <View className="h-1.5 bg-white/50 rounded-full mb-4 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: theme.accent,
              }}
            />
          </View>
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between mt-auto">
          <View className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50">
            <Timer color={theme.accent} size={14} opacity={0.8} />
            <Text
              className="text-[13px] font-semibold"
              style={{ color: theme.accent }}
            >
              {module.duration}
            </Text>
          </View>

          <View className="w-8 h-8 rounded-full bg-white/80 items-center justify-center border border-white">
            <ChevronRight color={theme.accent} size={18} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
