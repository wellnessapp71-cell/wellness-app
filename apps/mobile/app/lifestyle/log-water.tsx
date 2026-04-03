import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { saveHydrationLog, getHydrationLogs } from "@/lib/lifestyle-store";
import { DRINK_TYPES, type DrinkType } from "@aura/types";

const THEME = "#007AFF";
const WATER_GOAL_ML = 2500;

const CUP_OPTIONS = [
  { label: "Small cup", ml: 200, icon: "🥤" },
  { label: "Glass", ml: 250, icon: "🥛" },
  { label: "Bottle", ml: 500, icon: "🍶" },
  { label: "Large bottle", ml: 750, icon: "💧" },
  { label: "1 Litre", ml: 1000, icon: "🫗" },
];

const DRINK_LABELS: Record<DrinkType, { label: string; icon: string }> = {
  water: { label: "Water", icon: "💧" },
  tea: { label: "Tea", icon: "🍵" },
  coffee: { label: "Coffee", icon: "☕" },
  juice: { label: "Juice", icon: "🧃" },
  electrolyte: { label: "Electrolyte", icon: "⚡" },
  other: { label: "Other", icon: "🥤" },
};

export default function LogWaterScreen() {
  const router = useRouter();
  const [drinkType, setDrinkType] = useState<DrinkType>("water");
  const [todayTotal, setTodayTotal] = useState(0);
  const [saved, setSaved] = useState(false);

  const todayDate = new Date().toISOString().split("T")[0];

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const logs = await getHydrationLogs();
        const todayLogs = logs.filter((l) => l.date === todayDate);
        setTodayTotal(todayLogs.reduce((s, l) => s + l.volumeMl, 0));
      })();
    }, []),
  );

  async function logDrink(ml: number) {
    const log = {
      id: `hyd_${Date.now().toString(36)}`,
      date: todayDate,
      drinkType,
      volumeMl: ml,
      caffeineFlag: drinkType === "coffee" || drinkType === "tea",
      createdAt: new Date().toISOString(),
    };

    await saveHydrationLog(log);
    setTodayTotal((prev) => prev + ml);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  const progress = Math.min(100, Math.round((todayTotal / WATER_GOAL_ML) * 100));

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
          Log Water
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Progress ring */}
        <GlassCard className="p-5 items-center mt-4 mb-5">
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
            Today's Hydration
          </Text>
          <View
            className="w-28 h-28 rounded-full items-center justify-center"
            style={{
              borderWidth: 6,
              borderColor: progress >= 100 ? "#34C759" : THEME,
            }}
          >
            <Text className="text-[24px] font-bold" style={{ color: progress >= 100 ? "#34C759" : THEME }}>
              {todayTotal}
            </Text>
            <Text className="text-[11px] text-[#8A8A8E]">/ {WATER_GOAL_ML}ml</Text>
          </View>
          <View className="w-full h-2 rounded-full bg-[#E5E5EA] mt-4">
            <View
              className="h-2 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: progress >= 100 ? "#34C759" : THEME,
              }}
            />
          </View>
        </GlassCard>

        {/* Drink type selector */}
        <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
          Drink Type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {DRINK_TYPES.map((type) => {
            const active = drinkType === type;
            const info = DRINK_LABELS[type];
            return (
              <Pressable
                key={type}
                onPress={() => setDrinkType(type)}
                className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-full"
                style={{
                  backgroundColor: active ? THEME : "#fff",
                  borderWidth: 1.5,
                  borderColor: active ? THEME : "#E5E5EA",
                }}
              >
                <Text style={{ fontSize: 14 }}>{info.icon}</Text>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: active ? "#fff" : "#3C3C43" }}
                >
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* One-tap amounts */}
        <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
          Tap to Log
        </Text>
        <View className="gap-2 mb-6">
          {CUP_OPTIONS.map((opt) => (
            <Pressable
              key={opt.ml}
              onPress={() => logDrink(opt.ml)}
              className="flex-row items-center gap-3 p-4 rounded-xl bg-white"
              style={{ borderWidth: 1.5, borderColor: "#E5E5EA" }}
            >
              <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-black">{opt.label}</Text>
                <Text className="text-[13px] text-[#8A8A8E]">{opt.ml}ml</Text>
              </View>
              <View className="px-3 py-1.5 rounded-full" style={{ backgroundColor: THEME + "15" }}>
                <Text className="text-[12px] font-semibold" style={{ color: THEME }}>+ Add</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {saved && (
          <View className="items-center mb-6">
            <Text className="text-[15px] font-semibold text-[#34C759]">✅ Logged!</Text>
          </View>
        )}

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
