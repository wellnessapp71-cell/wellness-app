import { View, Text } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

interface MetricCardProps {
  label: string;
  value: string;
  icon: string;
  color: string;
  subtitle?: string;
}

export function MetricCard({ label, value, icon, color, subtitle }: MetricCardProps) {
  return (
    <GlassCard className="flex-1 p-3.5">
      <View className="flex-row items-center gap-2 mb-2">
        <View
          className="w-8 h-8 rounded-full items-center justify-center"
          style={{ backgroundColor: color + "15" }}
        >
          <Text style={{ fontSize: 16 }}>{icon}</Text>
        </View>
      </View>
      <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
        {label}
      </Text>
      <Text className="text-[20px] font-bold text-black mt-0.5">{value}</Text>
      {subtitle && (
        <Text className="text-[11px] text-[#8A8A8E] mt-0.5">{subtitle}</Text>
      )}
    </GlassCard>
  );
}
