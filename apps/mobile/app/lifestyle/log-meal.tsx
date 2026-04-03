import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { saveMealLog } from "@/lib/lifestyle-store";

const THEME = "#FF9500";

const MEAL_TYPES = [
  { value: "breakfast" as const, label: "Breakfast", icon: "🌅" },
  { value: "lunch" as const, label: "Lunch", icon: "☀️" },
  { value: "dinner" as const, label: "Dinner", icon: "🌙" },
  { value: "snack" as const, label: "Snack", icon: "🍿" },
];

const QUALITY_FLAGS = [
  { value: "good" as const, label: "Good", icon: "✅", color: "#34C759" },
  { value: "fair" as const, label: "Fair", icon: "⚠️", color: "#FFCC00" },
  { value: "poor" as const, label: "Poor", icon: "❌", color: "#FF3B30" },
];

export default function LogMealScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fourColCardWidth = Math.floor((contentWidth - 24) / 4);
  const threeColCardWidth = Math.floor((contentWidth - 24) / 3);
  const [mealType, setMealType] = useState<
    "breakfast" | "lunch" | "dinner" | "snack"
  >("lunch");
  const [description, setDescription] = useState("");
  const [quality, setQuality] = useState<"good" | "fair" | "poor">("good");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const now = new Date();

    const log = {
      id: `meal_${Date.now().toString(36)}`,
      date: now.toISOString().split("T")[0],
      mealType,
      description: description || `${mealType} meal`,
      calories: null,
      proteinG: null,
      fiberG: null,
      sugarG: null,
      foodQualityFlag: quality,
      createdAt: now.toISOString(),
    };

    await saveMealLog(log);
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
          Log Meal
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {saved ? (
          <View className="items-center justify-center py-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4">
              Meal Logged!
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mt-1">
              Returning to hub...
            </Text>
          </View>
        ) : (
          <View className="pt-4 pb-10">
            {/* Meal type */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Meal Type
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {MEAL_TYPES.map((m) => {
                const active = mealType === m.value;
                return (
                  <View key={m.value} style={{ width: fourColCardWidth }}>
                    <Pressable
                      onPress={() => setMealType(m.value)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                      <Text
                        className="text-[11px] font-bold mt-1"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Description */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              What did you eat? (optional)
            </Text>
            <GlassCard className="p-3 mb-6">
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Grilled chicken with salad"
                placeholderTextColor="#C7C7CC"
                className="text-[15px] text-black min-h-[60px]"
                multiline
                textAlignVertical="top"
              />
            </GlassCard>

            {/* Quality flag */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Meal Quality
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {QUALITY_FLAGS.map((q) => {
                const active = quality === q.value;
                return (
                  <View key={q.value} style={{ width: threeColCardWidth }}>
                    <Pressable
                      onPress={() => setQuality(q.value)}
                      className="py-4 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? q.color : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? q.color : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{q.icon}</Text>
                      <Text
                        className="text-[13px] font-bold mt-1"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {q.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
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
              {saving ? "Saving..." : "Log Meal"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
