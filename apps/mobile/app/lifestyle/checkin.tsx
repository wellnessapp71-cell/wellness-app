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
import { saveLifestyleCheckIn } from "@/lib/lifestyle-store";
import { pushCheckIn } from "@/lib/lifestyle-sync";
import { LIFESTYLE_BLOCKER_TAGS, type LifestyleBlockerTag } from "@aura/types";
import { recalcLifestyleScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";
import { recordFailedSync } from "@/lib/error-reporting";

const THEME = "#FF9500";

const SLEEP_PRESETS = [4, 5, 6, 7, 8, 9, 10];
const QUALITY_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const SERVING_PRESETS = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const WATER_PRESETS = [
  { label: "250ml", value: 250 },
  { label: "500ml", value: 500 },
  { label: "1L", value: 1000 },
  { label: "1.5L", value: 1500 },
  { label: "2L", value: 2000 },
  { label: "2.5L+", value: 2500 },
];
const MINUTES_PRESETS = [0, 5, 10, 15, 20, 30, 45, 60];
const SCREEN_MINUTES_PRESETS = [0, 30, 60, 90, 120, 180, 240];
const BEDTIME_SCREEN_PRESETS = [0, 10, 20, 30, 45, 60];
const OUTDOOR_PRESETS = [0, 5, 10, 15, 20, 30, 45, 60];
const MEALS_PRESETS = [0, 1, 2, 3, 4, 5];
const ROUTINE_OPTIONS = [
  { label: "Fully", value: "fully" as const },
  { label: "Mostly", value: "mostly" as const },
  { label: "Partly", value: "partly" as const },
  { label: "No", value: "no" as const },
];

const BLOCKER_LABELS: Record<
  LifestyleBlockerTag,
  { label: string; icon: string }
> = {
  work: { label: "Work", icon: "💼" },
  travel: { label: "Travel", icon: "✈️" },
  stress: { label: "Stress", icon: "😰" },
  social: { label: "Social", icon: "🎉" },
  fatigue: { label: "Fatigue", icon: "😫" },
  other: { label: "Other", icon: "❓" },
};

export default function LifestyleCheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const twoColCardWidth = Math.floor((contentWidth - 12) / 2);
  const threeColCardWidth = Math.floor((contentWidth - 24) / 3);
  const fourColCardWidth = Math.floor((contentWidth - 36) / 4);

  // Sleep
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(5);

  // Nutrition
  const [mealsEaten, setMealsEaten] = useState(3);
  const [fruitServings, setFruitServings] = useState(1);
  const [vegServings, setVegServings] = useState(1);

  // Hydration
  const [waterMl, setWaterMl] = useState(1500);

  // Movement
  const [activeMinutes, setActiveMinutes] = useState(20);
  const [movementBreaks, setMovementBreaks] = useState(2);
  const [strengthOrYoga, setStrengthOrYoga] = useState(false);

  // Digital
  const [screenMinutesNonWork, setScreenMinutesNonWork] = useState(120);
  const [bedtimeScreenMinutes, setBedtimeScreenMinutes] = useState(30);

  // Nature
  const [outdoorMinutes, setOutdoorMinutes] = useState(10);
  const [morningDaylightMinutes, setMorningDaylightMinutes] = useState(5);

  // Routine
  const [morningRoutineDone, setMorningRoutineDone] = useState<
    "fully" | "mostly" | "partly" | "no"
  >("partly");
  const [eveningRoutineDone, setEveningRoutineDone] = useState<
    "fully" | "mostly" | "partly" | "no"
  >("partly");

  // Blockers
  const [blockers, setBlockers] = useState<LifestyleBlockerTag[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleBlocker(tag: LifestyleBlockerTag) {
    setBlockers((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSave() {
    setSaving(true);
    const now = new Date();
    const date = now.toISOString().split("T")[0];

    const checkIn = {
      id: `lc_${Date.now().toString(36)}`,
      date,
      sleepHours,
      sleepQuality,
      mealsEaten,
      fruitServings,
      vegServings,
      fruitVegServings: fruitServings + vegServings,
      proteinFiberMeals: Math.min(mealsEaten, Math.max(0, fruitServings)),
      ultraProcessedServings: 0,
      sugaryServings: 0,
      lateEatingCount: 0,
      stressEating: "no" as const,
      waterMl,
      waterBeforeNoon: waterMl >= 750 ? 2 : waterMl >= 400 ? 1 : 0,
      hydrationSpanHours: 10,
      metWaterGoal:
        waterMl >= 2600
          ? ("exceeded" as const)
          : waterMl >= 2000
            ? ("yes" as const)
            : waterMl >= 1400
              ? ("mostly" as const)
              : waterMl >= 900
                ? ("partly" as const)
                : ("no" as const),
      activeMinutes,
      movementBreaks,
      strengthOrYoga,
      sittingMinutesMax: 120,
      strengthYogaDone: strengthOrYoga
        ? ("moderate" as const)
        : ("no" as const),
      screenMinutesNonWork,
      screenHoursNonWork: Math.round((screenMinutesNonWork / 60) * 10) / 10,
      bedtimeScreenMinutes,
      notificationsAfter8pm: Math.max(0, Math.round(screenMinutesNonWork / 45)),
      usedFocusMode:
        screenMinutesNonWork <= 90
          ? ("mostly" as const)
          : screenMinutesNonWork <= 150
            ? ("partly" as const)
            : ("no" as const),
      outdoorMinutes,
      morningDaylightMinutes,
      gotOutdoors: outdoorMinutes >= 10,
      morningRoutineDone,
      eveningRoutineDone,
      sameWakeTimeDays: 4,
      routineCompletion:
        morningRoutineDone === "fully" || eveningRoutineDone === "fully"
          ? ("yes" as const)
          : morningRoutineDone === "partly" || eveningRoutineDone === "partly"
            ? ("partly" as const)
            : ("no" as const),
      blockers,
      createdAt: now.toISOString(),
    };

    await saveLifestyleCheckIn(checkIn);

    // Sync to server (fire & forget)
    pushCheckIn(checkIn);

    // Recalculate lifestyle score using all 7 domains
    try {
      const score = await recalcLifestyleScore();
      await updateScores({ lifestyle: score });
    } catch (err) {
      recordFailedSync("lifestyle score recalc", err);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.back(), 1200);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          Daily Check-in
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {saved ? (
          <View className="items-center justify-center py-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4">
              Check-in Saved!
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mt-1">
              Returning to hub...
            </Text>
          </View>
        ) : (
          <View className="pt-4 pb-10">
            {/* ── Sleep ── */}
            <SectionLabel label="Hours of sleep last night" icon="😴" />
            <PresetRow
              values={SLEEP_PRESETS}
              selected={sleepHours}
              onSelect={setSleepHours}
              suffix="h"
              color="#5856D6"
            />

            <SectionLabel label="Sleep quality (1-10)" icon="🌙" />
            <PresetRow
              values={QUALITY_PRESETS}
              selected={sleepQuality}
              onSelect={setSleepQuality}
              color="#5856D6"
            />

            {/* ── Nutrition ── */}
            <SectionLabel label="Meals eaten today" icon="🍽️" />
            <PresetRow
              values={MEALS_PRESETS}
              selected={mealsEaten}
              onSelect={setMealsEaten}
              color="#FF2D55"
            />

            <SectionLabel label="Fruit servings" icon="🍎" />
            <PresetRow
              values={SERVING_PRESETS}
              selected={fruitServings}
              onSelect={setFruitServings}
              color="#34C759"
            />

            <SectionLabel label="Vegetable servings" icon="🥗" />
            <PresetRow
              values={SERVING_PRESETS}
              selected={vegServings}
              onSelect={setVegServings}
              color="#34C759"
            />

            {/* ── Hydration ── */}
            <SectionLabel label="Water intake today" icon="💧" />
            <View className="flex-row flex-wrap gap-2 mb-6">
              {WATER_PRESETS.map((w) => {
                const active = waterMl === w.value;
                return (
                  <Pressable
                    key={w.value}
                    onPress={() => setWaterMl(w.value)}
                    className="px-4 py-3 rounded-xl"
                    style={{
                      backgroundColor: active ? "#007AFF" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#007AFF" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-bold text-[14px]"
                      style={{ color: active ? "#fff" : "#000" }}
                    >
                      {w.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Movement ── */}
            <SectionLabel label="Active minutes today" icon="🏃" />
            <PresetRow
              values={MINUTES_PRESETS}
              selected={activeMinutes}
              onSelect={setActiveMinutes}
              suffix="m"
              color="#FF9500"
            />

            <SectionLabel label="Movement breaks" icon="🚶" />
            <PresetRow
              values={[0, 1, 2, 3, 4, 5, 6]}
              selected={movementBreaks}
              onSelect={setMovementBreaks}
              color="#FF9500"
            />

            <SectionLabel label="Strength or yoga today?" icon="💪" />
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {[true, false].map((val) => {
                const active = strengthOrYoga === val;
                return (
                  <View key={String(val)} style={{ width: twoColCardWidth }}>
                    <Pressable
                      onPress={() => setStrengthOrYoga(val)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? "#FF9500" : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? "#FF9500" : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[16px]"
                        style={{ color: active ? "#fff" : "#000" }}
                      >
                        {val ? "Yes" : "No"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* ── Digital ── */}
            <SectionLabel label="Non-work screen time (minutes)" icon="📱" />
            <PresetRow
              values={SCREEN_MINUTES_PRESETS}
              selected={screenMinutesNonWork}
              onSelect={setScreenMinutesNonWork}
              suffix="m"
              color="#FF3B30"
            />

            <SectionLabel label="Bedtime screen time (minutes)" icon="📵" />
            <PresetRow
              values={BEDTIME_SCREEN_PRESETS}
              selected={bedtimeScreenMinutes}
              onSelect={setBedtimeScreenMinutes}
              suffix="m"
              color="#FF3B30"
            />

            {/* ── Nature ── */}
            <SectionLabel label="Outdoor minutes today" icon="🌿" />
            <PresetRow
              values={OUTDOOR_PRESETS}
              selected={outdoorMinutes}
              onSelect={setOutdoorMinutes}
              suffix="m"
              color="#34C759"
            />

            <SectionLabel label="Morning daylight (minutes)" icon="☀️" />
            <PresetRow
              values={[0, 5, 10, 15, 20, 30]}
              selected={morningDaylightMinutes}
              onSelect={setMorningDaylightMinutes}
              suffix="m"
              color="#FF9500"
            />

            {/* ── Routine ── */}
            <SectionLabel label="Morning routine completed?" icon="🌅" />
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {ROUTINE_OPTIONS.map((opt) => {
                const active = morningRoutineDone === opt.value;
                return (
                  <View key={opt.value} style={{ width: fourColCardWidth }}>
                    <Pressable
                      onPress={() => setMorningRoutineDone(opt.value)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[14px]"
                        style={{ color: active ? "#fff" : "#000" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <SectionLabel label="Evening routine completed?" icon="🌙" />
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {ROUTINE_OPTIONS.map((opt) => {
                const active = eveningRoutineDone === opt.value;
                return (
                  <View key={opt.value} style={{ width: fourColCardWidth }}>
                    <Pressable
                      onPress={() => setEveningRoutineDone(opt.value)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[14px]"
                        style={{ color: active ? "#fff" : "#000" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* ── Blockers ── */}
            <SectionLabel label="Any blockers today? (optional)" icon="🚧" />
            <View className="flex-row flex-wrap gap-2 mb-6">
              {LIFESTYLE_BLOCKER_TAGS.map((tag) => {
                const active = blockers.includes(tag);
                const info = BLOCKER_LABELS[tag];
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleBlocker(tag)}
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
          </View>
        )}
      </ScrollView>

      {/* Save button */}
      {!saved && (
        <View className="px-6 pb-6 pt-2">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : THEME }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving ? "Saving..." : "Save Check-in"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Shared components ────────────────────────────────────────

function SectionLabel({ label, icon }: { label: string; icon: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
        {label}
      </Text>
    </View>
  );
}

function PresetRow({
  values,
  selected,
  onSelect,
  suffix = "",
  color = "#007AFF",
}: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
  suffix?: string;
  color?: string;
}) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const columns = Math.min(values.length, 5);
  const gapPx = 6;
  const cardWidth = Math.floor(
    (contentWidth - gapPx * (columns - 1)) / columns,
  );

  return (
    <View
      className="flex-row flex-wrap gap-1.5 mb-6"
      style={{ maxWidth: contentWidth, width: "100%", alignSelf: "center" }}
    >
      {values.map((v) => {
        const active = selected === v;
        return (
          <View key={v} style={{ width: cardWidth }}>
            <Pressable
              onPress={() => onSelect(v)}
              className="h-11 rounded-xl items-center justify-center"
              style={{
                backgroundColor: active ? color : "#fff",
                borderWidth: 1.5,
                borderColor: active ? color : "#E5E5EA",
              }}
            >
              <Text
                className="font-bold text-[13px]"
                style={{ color: active ? "#fff" : "#3C3C43" }}
              >
                {v}
                {suffix}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}
