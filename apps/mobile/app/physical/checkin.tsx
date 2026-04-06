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
import { saveDailyCheckIn, getTodayCheckIn } from "@/lib/onboarding-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import { recalcPhysicalScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";

const MOODS = [
  { value: "great", label: "Great", emoji: "😁" },
  { value: "good", label: "Good", emoji: "🙂" },
  { value: "okay", label: "Okay", emoji: "😐" },
  { value: "low", label: "Low", emoji: "😔" },
  { value: "bad", label: "Bad", emoji: "😣" },
] as const;

const ENERGY_LEVELS = [
  { value: "high", label: "High", emoji: "⚡" },
  { value: "moderate", label: "Moderate", emoji: "🔋" },
  { value: "low", label: "Low", emoji: "🪫" },
  { value: "exhausted", label: "Exhausted", emoji: "😴" },
] as const;

type Mood = (typeof MOODS)[number]["value"];
type Energy = (typeof ENERGY_LEVELS)[number]["value"];

export default function CheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const moodCardWidth = Math.floor((contentWidth - 16) / 5);
  const energyCardWidth = Math.floor((contentWidth - 12) / 4);
  const [mood, setMood] = useState<Mood>("good");
  const [energy, setEnergy] = useState<Energy>("moderate");
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [fatigueLevel, setFatigueLevel] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [soreness, setSoreness] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const dateIso = new Date().toISOString().split("T")[0];
    const checkIn = {
      dateIso,
      mood,
      energy,
      sleepHours,
      sleepQuality,
      fatigueLevel,
      soreness,
    };

    // Save locally
    await saveDailyCheckIn(checkIn);

    // Try to sync to server
    try {
      await api.post("/progress/checkin", checkIn);
    } catch (err) {
      recordFailedSync("physical checkin sync", err);
    }

    // Recalculate physical score using all inputs
    try {
      const score = await recalcPhysicalScore();
      await updateScores({ physical: score });
    } catch (err) {
      recordFailedSync("physical score recalc", err);
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
          <View className="items-center justify-center py-20">
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
            {/* Mood */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              How are you feeling?
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {MOODS.map((m) => (
                <View key={m.value} style={{ width: moodCardWidth }}>
                  <Pressable
                    onPress={() => setMood(m.value)}
                    className="items-center py-3 rounded-2xl"
                    style={{
                      backgroundColor: mood === m.value ? "#007AFF" : "#fff",
                      borderWidth: 1.5,
                      borderColor: mood === m.value ? "#007AFF" : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                    <Text
                      className="text-[11px] font-semibold mt-1"
                      style={{ color: mood === m.value ? "#fff" : "#3C3C43" }}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Energy */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Energy Level
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {ENERGY_LEVELS.map((e) => (
                <View key={e.value} style={{ width: energyCardWidth }}>
                  <Pressable
                    onPress={() => setEnergy(e.value)}
                    className="items-center py-3 rounded-2xl"
                    style={{
                      backgroundColor: energy === e.value ? "#FF9500" : "#fff",
                      borderWidth: 1.5,
                      borderColor: energy === e.value ? "#FF9500" : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{e.emoji}</Text>
                    <Text
                      className="text-[11px] font-semibold mt-1"
                      style={{ color: energy === e.value ? "#fff" : "#3C3C43" }}
                    >
                      {e.label}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Sleep Hours */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Hours of Sleep
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setSleepHours(h)}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{
                    backgroundColor: sleepHours === h ? "#AF52DE" : "#fff",
                    borderWidth: 1.5,
                    borderColor: sleepHours === h ? "#AF52DE" : "#E5E5EA",
                  }}
                >
                  <Text
                    className="font-bold text-[16px]"
                    style={{ color: sleepHours === h ? "#fff" : "#000" }}
                  >
                    {h}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Sleep Quality */}
            <RatingRow
              label="Sleep Quality"
              value={sleepQuality}
              onChange={setSleepQuality}
              color="#AF52DE"
            />

            {/* Fatigue Level */}
            <RatingRow
              label="Fatigue Level"
              value={fatigueLevel}
              onChange={setFatigueLevel}
              color="#FF9500"
            />

            {/* Soreness */}
            <RatingRow
              label="Muscle Soreness"
              value={soreness}
              onChange={setSoreness}
              color="#FF3B30"
            />
          </View>
        )}
      </ScrollView>

      {!saved && (
        <View className="px-6 pb-6 pt-2">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : "#007AFF" }}
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

function RatingRow({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  color: string;
}) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const cardWidth = Math.floor((contentWidth - 8) / 5);

  return (
    <View className="mb-6">
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
        {label}
      </Text>
      <View
        className="flex-row justify-between"
        style={{ maxWidth: contentWidth, width: "100%", alignSelf: "center" }}
      >
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <View key={n} style={{ width: cardWidth }}>
            <Pressable
              onPress={() => onChange(n)}
              className="h-12 rounded-xl items-center justify-center"
              style={{
                backgroundColor: value === n ? color : "#fff",
                borderWidth: 1.5,
                borderColor: value === n ? color : "#E5E5EA",
              }}
            >
              <Text
                className="font-bold text-[16px]"
                style={{ color: value === n ? "#fff" : "#000" }}
              >
                {n}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      <View className="flex-row justify-between mt-1 px-1">
        <Text className="text-[10px] text-[#8A8A8E]">Low</Text>
        <Text className="text-[10px] text-[#8A8A8E]">High</Text>
      </View>
    </View>
  );
}
