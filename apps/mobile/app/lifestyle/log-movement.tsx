import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { saveMovementLog } from "@/lib/lifestyle-store";
import { MOVEMENT_BREAK_TYPES, type MovementBreakType } from "@aura/types";

const THEME = "#34C759";

const BREAK_LABELS: Record<MovementBreakType, { label: string; icon: string }> =
  {
    walk: { label: "Walk", icon: "🚶" },
    stretch: { label: "Stretch", icon: "🤸" },
    stand: { label: "Stand Up", icon: "🧍" },
    stairs: { label: "Stairs", icon: "🪜" },
    micro_activity: { label: "Micro Activity", icon: "⚡" },
  };

const ACTIVE_MINUTE_PRESETS = [5, 10, 15, 20, 30, 45, 60];

export default function LogMovementScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fourColCardWidth = Math.floor((contentWidth - 24) / 4);
  const [breakType, setBreakType] = useState<MovementBreakType | null>(null);
  const [activeMinutes, setActiveMinutes] = useState(15);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const now = new Date();

    const log = {
      id: `mov_${Date.now().toString(36)}`,
      date: now.toISOString().split("T")[0],
      steps: null,
      activeMinutes,
      sedentaryMinutes: null,
      breakType,
      createdAt: now.toISOString(),
    };

    await saveMovementLog(log);
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.back(), 1200);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          Log Movement
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {saved ? (
          <View className="items-center justify-center py-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4">
              Movement Logged!
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mt-1">
              Returning to hub...
            </Text>
          </View>
        ) : (
          <View className="pt-4 pb-10">
            {/* Break type */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Activity Type
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {MOVEMENT_BREAK_TYPES.map((type) => {
                const active = breakType === type;
                const info = BREAK_LABELS[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => setBreakType(active ? null : type)}
                    className="flex-row items-center gap-2 px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: active ? THEME : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? THEME : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 18 }}>{info.icon}</Text>
                    <Text
                      className="text-[14px] font-semibold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {info.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Active minutes */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Active Minutes
            </Text>
            <View
              className="flex-row flex-wrap gap-2 mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {ACTIVE_MINUTE_PRESETS.map((m) => {
                const active = activeMinutes === m;
                return (
                  <View key={m} style={{ width: fourColCardWidth }}>
                    <Pressable
                      onPress={() => setActiveMinutes(m)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[14px]"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Quick actions */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Quick Start
            </Text>
            <View className="gap-2">
              {[
                {
                  icon: "🚶",
                  label: "3-min walk",
                  desc: "Get up and move",
                  mins: 3,
                  type: "walk" as MovementBreakType,
                },
                {
                  icon: "🤸",
                  label: "5-min stretch",
                  desc: "Quick desk stretch",
                  mins: 5,
                  type: "stretch" as MovementBreakType,
                },
                {
                  icon: "🧍",
                  label: "Stand & move",
                  desc: "Stand up for 1 minute",
                  mins: 1,
                  type: "stand" as MovementBreakType,
                },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => {
                    setBreakType(action.type);
                    setActiveMinutes(action.mins);
                  }}
                >
                  <GlassCard className="p-4 flex-row items-center gap-3">
                    <Text style={{ fontSize: 24 }}>{action.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-[15px] font-semibold text-black">
                        {action.label}
                      </Text>
                      <Text className="text-[13px] text-[#8A8A8E]">
                        {action.desc}
                      </Text>
                    </View>
                    <Text
                      className="text-[12px] font-semibold"
                      style={{ color: THEME }}
                    >
                      {action.mins} min
                    </Text>
                  </GlassCard>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {!saved && (
        <View className="px-6 pb-6 pt-2">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : THEME }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving ? "Saving..." : "Log Movement"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
