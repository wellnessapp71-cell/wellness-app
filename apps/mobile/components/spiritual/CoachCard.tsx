import { View, Text } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

const TEAL = "#30B0C7";

interface CoachCardProps {
  message: string;
  suggestedAction: string | null;
  band: string;
}

export function CoachCard({ message, suggestedAction, band }: CoachCardProps) {
  const borderColor =
    band === "red" ? "#FF3B30" :
    band === "orange" ? "#FF9500" :
    band === "yellow" ? "#FFD60A" :
    TEAL;

  return (
    <GlassCard
      className="p-4"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        <View className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: TEAL + "15" }}
        >
          <Text style={{ fontSize: 16 }}>🧘</Text>
        </View>
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
          Your Guide
        </Text>
      </View>
      <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
        {message}
      </Text>
      {suggestedAction && (
        <View className="mt-2 px-3 py-1.5 rounded-full self-start" style={{ backgroundColor: TEAL + "15" }}>
          <Text className="text-[12px] font-semibold" style={{ color: TEAL }}>
            {suggestedAction}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}
