import { View, Text, Pressable } from "react-native";
import {
  Timer,
  CheckCircle2,
  ChevronRight,
  Layers,
  Zap,
  BookOpen,
} from "lucide-react-native";
import type { LearningModule } from "@aura/types";

const CATEGORY_COLORS: Record<
  string,
  { bg: string; accent: string; icon: string; lightBg: string }
> = {
  stress: { bg: "#F0F7F3", accent: "#2D8A56", icon: "🌿", lightBg: "#E0F0E6" },
  sleep: { bg: "#EEF1F7", accent: "#4D627A", icon: "🌙", lightBg: "#DDE3EE" },
  boundaries: { bg: "#EFF8FC", accent: "#2A839E", icon: "🛡️", lightBg: "#D8EEF6" },
  emotional_regulation: { bg: "#FDF0F2", accent: "#B24D61", icon: "❤️", lightBg: "#F9D8DE" },
  self_worth: { bg: "#FFF8EB", accent: "#B87A1F", icon: "⭐", lightBg: "#F7E9C5" },
  grief: { bg: "#FAF2FA", accent: "#9E5B8E", icon: "🌧️", lightBg: "#F0D8ED" },
  resilience: { bg: "#F5F0FA", accent: "#814AB5", icon: "⛰️", lightBg: "#E4D4F2" },
  default: { bg: "#EEF3FD", accent: "#3A63AB", icon: "💡", lightBg: "#D4E0F8" },
};

const DIFFICULTY_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  beginner: { bg: "#E8F5EE", color: "#2D8A56", label: "Beginner" },
  intermediate: { bg: "#FFF6E0", color: "#B87A1F", label: "Intermediate" },
  advanced: { bg: "#FDE9EC", color: "#B24D61", label: "Advanced" },
};

interface LessonCardProps {
  module: LearningModule;
  progress?: number;
  slideCount?: number;
  onPress: () => void;
}

export function LessonCard({
  module,
  progress = 0,
  slideCount,
  onPress,
}: LessonCardProps) {
  const isComplete = progress >= 100;
  const hasStarted = progress > 0;
  const theme = CATEGORY_COLORS[module.category] ?? CATEGORY_COLORS.default;
  const diff = DIFFICULTY_COLORS[module.difficulty] ?? DIFFICULTY_COLORS.beginner;

  return (
    <Pressable
      onPress={onPress}
      className="mb-4 rounded-[24px] overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        shadowColor: theme.accent,
        shadowOpacity: 0.06,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        borderWidth: 1,
        borderColor: isComplete ? theme.accent + "30" : "#F0F1F5",
      }}
    >
      <View className="p-5">
        {/* ── Top Row: Icon + Badges ── */}
        <View className="flex-row justify-between items-start mb-3.5">
          <View
            className="w-12 h-12 rounded-[16px] items-center justify-center"
            style={{ backgroundColor: theme.bg }}
          >
            <Text className="text-[24px]">{theme.icon}</Text>
          </View>

          <View className="flex-row items-center gap-1.5 flex-wrap justify-end" style={{ maxWidth: "60%" }}>
            {/* Difficulty Badge */}
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: diff.bg }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{ color: diff.color }}
              >
                {diff.label}
              </Text>
            </View>

            {/* Category Badge */}
            <View
              className="px-2.5 py-1 rounded-full"
              style={{ backgroundColor: theme.bg }}
            >
              <Text
                className="text-[11px] font-bold capitalize"
                style={{ color: theme.accent }}
              >
                {module.category.replace("_", " ")}
              </Text>
            </View>

            {/* Completion Badge */}
            {isComplete && (
              <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-[#E8F5EE]">
                <CheckCircle2 color="#2D8A56" size={12} strokeWidth={3} />
                <Text className="text-[11px] font-bold text-[#2D8A56]">
                  Done
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Title & Description ── */}
        <View className="mb-3">
          <Text className="text-[18px] font-bold text-[#1C1C1E] tracking-tight leading-6">
            {module.title}
          </Text>
          <Text
            className="text-[13px] leading-5 mt-1.5"
            style={{ color: "#6B7B8F" }}
            numberOfLines={2}
          >
            {module.description}
          </Text>
        </View>

        {/* ── Progress Bar (if started) ── */}
        {hasStarted && !isComplete && (
          <View className="mb-3.5">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-[11px] font-bold text-[#8E8E93]">
                PROGRESS
              </Text>
              <Text
                className="text-[11px] font-bold"
                style={{ color: theme.accent }}
              >
                {Math.round(progress)}%
              </Text>
            </View>
            <View className="h-[5px] bg-[#F0F1F5] rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  backgroundColor: theme.accent,
                }}
              />
            </View>
          </View>
        )}

        {/* ── Footer: Meta + Arrow ── */}
        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center gap-3">
            {/* Duration */}
            <View className="flex-row items-center gap-1.5">
              <Timer color="#8E8E93" size={13} />
              <Text className="text-[12px] font-semibold text-[#8E8E93]">
                {module.duration}
              </Text>
            </View>

            {/* Slide Count */}
            {slideCount != null && slideCount > 0 && (
              <View className="flex-row items-center gap-1.5">
                <Layers color="#8E8E93" size={13} />
                <Text className="text-[12px] font-semibold text-[#8E8E93]">
                  {slideCount} slides
                </Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <View
            className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-full"
            style={{
              backgroundColor: isComplete
                ? theme.bg
                : hasStarted
                  ? theme.accent
                  : theme.bg,
            }}
          >
            {isComplete ? (
              <>
                <BookOpen
                  color={theme.accent}
                  size={14}
                  strokeWidth={2.5}
                />
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: theme.accent }}
                >
                  Review
                </Text>
              </>
            ) : hasStarted ? (
              <>
                <Zap color="#FFFFFF" size={14} strokeWidth={2.5} />
                <Text className="text-[12px] font-bold text-white">
                  Resume
                </Text>
              </>
            ) : (
              <>
                <ChevronRight
                  color={theme.accent}
                  size={16}
                  strokeWidth={2.5}
                />
                <Text
                  className="text-[12px] font-bold"
                  style={{ color: theme.accent }}
                >
                  Start
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
