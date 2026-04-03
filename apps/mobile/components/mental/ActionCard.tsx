import { View, Text, Pressable } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

interface ActionCardProps {
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  color: string;
  onPress: () => void;
}

export function ActionCard({ icon, title, description, actionLabel, color, onPress }: ActionCardProps) {
  return (
    <Pressable onPress={onPress} className="w-full">
      <GlassCard
        className="p-4 flex-row items-start gap-4"
        style={{ borderLeftWidth: 3, borderLeftColor: color }}
      >
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: color + "15" }}
        >
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View className="flex-1 min-w-0">
          <Text className="text-[15px] font-bold text-black tracking-tight leading-5" numberOfLines={2}>
            {title}
          </Text>
          <Text className="text-[13px] text-[#8A8A8E] mt-0.5 leading-5" numberOfLines={3}>
            {description}
          </Text>
        </View>
        <View
          className="px-3 py-1.5 rounded-full shrink-0 self-start"
          style={{ backgroundColor: color + "15" }}
        >
          <Text className="text-[12px] font-semibold" style={{ color }} numberOfLines={2}>
            {actionLabel}
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}
