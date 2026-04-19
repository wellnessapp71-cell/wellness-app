import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { recordFailedSync } from "@/lib/error-reporting";
import {
  addWeightEntry,
  getWeightHistory,
  type WeightEntryLocal,
} from "@/lib/onboarding-store";
import { api } from "@/lib/api";

export default function WeightLogScreen() {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState("");
  const [history, setHistory] = useState<WeightEntryLocal[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const h = await getWeightHistory();
        setHistory(h.reverse()); // newest first
      })();
    }, []),
  );

  async function handleSave() {
    const kg = parseFloat(weightKg);
    if (!kg || kg <= 0) return;
    setSaving(true);
    const entry: WeightEntryLocal = {
      dateIso: new Date().toISOString().split("T")[0],
      weightKg: kg,
    };

    await addWeightEntry(entry);
    setHistory((prev) => [entry, ...prev]);

    try {
      await api.post("/progress/weight", { weightKg: kg });
    } catch (err) {
      recordFailedSync("weight log sync", err);
    }

    setWeightKg("");
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const minWeight = history.length > 0 ? Math.min(...history.map((e) => e.weightKg)) : 0;
  const maxWeight = history.length > 0 ? Math.max(...history.map((e) => e.weightKg)) : 100;
  const range = Math.max(1, maxWeight - minWeight);

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <Text className="text-[20px] font-bold text-black tracking-tight">Weight Tracker</Text>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Input */}
          <GlassCard className="p-4 mt-4 mb-4">
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
              Log Today's Weight
            </Text>
            <View className="flex-row items-center gap-3">
              <TextInput
                value={weightKg}
                onChangeText={setWeightKg}
                placeholder="e.g. 72.5"
                placeholderTextColor="#C6C6C8"
                keyboardType="numeric"
                className="flex-1 bg-[#F2F2F7] rounded-xl px-4 py-3.5 text-[17px] text-black"
              />
              <Text className="text-[15px] text-[#8A8A8E] font-medium">kg</Text>
              <Pressable
                onPress={handleSave}
                disabled={saving || !weightKg}
                className="px-5 py-3 rounded-xl"
                style={{
                  backgroundColor: saving || !weightKg ? "#D1D1D6" : "#1C1C1E",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: saving || !weightKg ? 0 : 0.15,
                  shadowRadius: 8,
                  elevation: saving || !weightKg ? 0 : 3,
                }}
              >
                <Text
                  className="font-bold text-[15px]"
                  style={{ color: saving || !weightKg ? "#8A8A8E" : "#FFFFFF" }}
                >
                  {saving ? "..." : "Save"}
                </Text>
              </Pressable>
            </View>
            {saved && (
              <Text className="text-[#34C759] font-medium text-[13px] mt-2">Saved!</Text>
            )}
          </GlassCard>

          {/* Simple Chart */}
          {history.length >= 2 && (
            <GlassCard className="p-4 mb-4">
              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
                Weight Trend
              </Text>
              <View className="h-[120px] flex-row items-end gap-1">
                {history.slice(0, 20).reverse().map((e, i) => {
                  const pct = range > 0 ? ((e.weightKg - minWeight) / range) * 100 : 50;
                  const height = Math.max(8, (pct / 100) * 100);
                  return (
                    <View key={i} className="flex-1 items-center">
                      <View
                        className="w-full rounded-t-sm"
                        style={{
                          height,
                          backgroundColor: i === history.slice(0, 20).length - 1 ? "#007AFF" : "#007AFF60",
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  );
                })}
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-[10px] text-[#8A8A8E]">{minWeight.toFixed(1)} kg</Text>
                <Text className="text-[10px] text-[#8A8A8E]">{maxWeight.toFixed(1)} kg</Text>
              </View>
            </GlassCard>
          )}

          {/* History */}
          <Text className="text-[17px] font-bold text-black tracking-tight mb-3">
            History
          </Text>
          {history.length === 0 ? (
            <GlassCard className="p-4 items-center">
              <Text className="text-[#8A8A8E]">No entries yet. Log your first weight above.</Text>
            </GlassCard>
          ) : (
            <View className="gap-2 mb-10">
              {history.slice(0, 30).map((e, i) => {
                const prev = history[i + 1];
                const diff = prev ? e.weightKg - prev.weightKg : 0;
                const diffColor = diff < 0 ? "#34C759" : diff > 0 ? "#FF3B30" : "#8A8A8E";
                return (
                  <GlassCard key={i} className="p-3 flex-row justify-between items-center">
                    <View>
                      <Text className="text-[15px] font-bold text-black">{e.weightKg.toFixed(1)} kg</Text>
                      <Text className="text-[12px] text-[#8A8A8E]">{e.dateIso}</Text>
                    </View>
                    {diff !== 0 && (
                      <Text className="text-[13px] font-semibold" style={{ color: diffColor }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)} kg
                      </Text>
                    )}
                  </GlassCard>
                );
              })}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
