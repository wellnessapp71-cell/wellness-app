import { View, Text } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

export type InsightLevel = "positive" | "neutral" | "warning" | "critical";

interface InsightCardProps {
  icon: string;
  title: string;
  description: string;
  level?: InsightLevel;
}

const LEVEL_COLORS: Record<InsightLevel, { bg: string; border: string; text: string }> = {
  positive: { bg: "#34C75908", border: "#34C75930", text: "#34C759" },
  neutral: { bg: "#AF52DE08", border: "#AF52DE30", text: "#AF52DE" },
  warning: { bg: "#FF950008", border: "#FF950030", text: "#FF9500" },
  critical: { bg: "#FF3B3008", border: "#FF3B3030", text: "#FF3B30" },
};

export function InsightCard({ icon, title, description, level = "neutral" }: InsightCardProps) {
  const colors = LEVEL_COLORS[level];

  return (
    <GlassCard
      className="p-4 mb-3"
      style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="w-10 h-10 rounded-2xl items-center justify-center"
          style={{ backgroundColor: colors.text + "15" }}
        >
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-black tracking-tight mb-0.5">
            {title}
          </Text>
          <Text className="text-[13px] text-[#3C3C43] leading-relaxed">
            {description}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}
