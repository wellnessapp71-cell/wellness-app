import { View, Text, Pressable } from "react-native";

const TEAL = "#30B0C7";

interface DomainScoreCardProps {
  domain: string;
  score: number;
  icon: string;
}

export function DomainScoreCard({ domain, score, icon }: DomainScoreCardProps) {
  // Band color
  const barColor =
    score >= 80 ? "#34C759" :
    score >= 60 ? TEAL :
    score >= 40 ? "#FF9500" :
    "#FF3B30";

  return (
    <View
      className="flex-1 bg-white rounded-[16px] border border-black/5 shadow-sm p-3.5"
      style={{ minWidth: 100 }}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-2">
        {domain}
      </Text>
      <Text className="text-[22px] font-bold text-black mt-0.5">{score}</Text>
      {/* Small bar indicator */}
      <View className="h-1 bg-[#E5E5EA] rounded-full mt-2">
        <View
          className="h-1 rounded-full"
          style={{ width: `${Math.min(100, score)}%`, backgroundColor: barColor }}
        />
      </View>
    </View>
  );
}
