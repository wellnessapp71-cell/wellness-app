import { View, Text, Pressable } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";

interface CounselorCardProps {
  name: string;
  specialties: string[];
  modes: string[];
  rating?: number;
  onPress?: () => void;
}

const MODE_ICONS: Record<string, string> = {
  chat: "💬",
  audio: "🎧",
  video: "📹",
  in_person: "🏥",
};

export function CounselorCard({ name, specialties, modes, rating, onPress }: CounselorCardProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <GlassCard className="p-4 mb-3">
        <View className="flex-row items-start gap-3">
          {/* Avatar placeholder */}
          <View className="w-12 h-12 rounded-full bg-[#AF52DE12] items-center justify-center">
            <Text style={{ fontSize: 24 }}>🧑‍⚕️</Text>
          </View>

          <View className="flex-1">
            {/* Name */}
            <Text className="text-[16px] font-bold text-black tracking-tight">{name}</Text>

            {/* Specialties */}
            <View className="flex-row flex-wrap gap-1.5 mt-1.5">
              {specialties.slice(0, 3).map((s) => (
                <View key={s} className="px-2 py-0.5 rounded-full bg-[#AF52DE10]">
                  <Text className="text-[11px] font-semibold text-[#AF52DE] capitalize">
                    {s.replace("_", " ")}
                  </Text>
                </View>
              ))}
            </View>

            {/* Modes & rating */}
            <View className="flex-row items-center gap-3 mt-2">
              <View className="flex-row items-center gap-1">
                {modes.map((m) => (
                  <Text key={m} style={{ fontSize: 14 }}>{MODE_ICONS[m] ?? "💬"}</Text>
                ))}
              </View>
              {rating !== undefined && (
                <Text className="text-[12px] text-[#FF9500] font-semibold">
                  ⭐ {rating.toFixed(1)}
                </Text>
              )}
            </View>
          </View>

          {onPress && (
            <Text className="text-[#AF52DE] text-[18px] mt-3">›</Text>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}
