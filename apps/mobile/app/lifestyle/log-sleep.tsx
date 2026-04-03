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
import { saveSleepLog } from "@/lib/lifestyle-store";

const THEME = "#5856D6";

const QUALITY_PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const WAKEUP_PRESETS = [0, 1, 2, 3, 4, 5];

export default function LogSleepScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [qualityScore, setQualityScore] = useState(5);
  const [latencyMinutes, setLatencyMinutes] = useState(15);
  const [wakeups, setWakeups] = useState(0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);
  const fiveColCardWidth = Math.floor((safeContentWidth - 8) / 5);
  const fourColCardWidth = Math.floor((safeContentWidth - 24) / 4);

  function computeDuration(): number {
    const [bh, bm] = bedtime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let bedMin = bh * 60 + bm;
    let wakeMin = wh * 60 + wm;
    if (wakeMin <= bedMin) wakeMin += 24 * 60;
    return wakeMin - bedMin;
  }

  async function handleSave() {
    setSaving(true);
    const now = new Date();
    const duration = computeDuration();

    const log = {
      id: `slp_${Date.now().toString(36)}`,
      date: now.toISOString().split("T")[0],
      bedtime,
      wakeTime,
      durationMinutes: duration,
      qualityScore,
      latencyMinutes,
      wakeups,
      notes: notes || null,
      createdAt: now.toISOString(),
    };

    await saveSleepLog(log);
    setSaving(false);
    setSaved(true);
    setTimeout(() => router.back(), 1200);
  }

  const durationHours = Math.round((computeDuration() / 60) * 10) / 10;

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
          Log Sleep
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {saved ? (
          <View className="items-center justify-center py-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4">
              Sleep Logged!
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mt-1">
              Returning to hub...
            </Text>
          </View>
        ) : (
          <View className="pt-4 pb-10">
            {/* Bedtime & wake time */}
            <View className="flex-row gap-3 mb-6 justify-between">
              <View style={{ width: twoColCardWidth }}>
                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  Bedtime
                </Text>
                <GlassCard className="p-3 items-center">
                  <TextInput
                    value={bedtime}
                    onChangeText={setBedtime}
                    className="text-[24px] font-bold text-black text-center"
                    placeholder="23:00"
                    keyboardType="numbers-and-punctuation"
                  />
                </GlassCard>
              </View>
              <View style={{ width: twoColCardWidth }}>
                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  Wake Time
                </Text>
                <GlassCard className="p-3 items-center">
                  <TextInput
                    value={wakeTime}
                    onChangeText={setWakeTime}
                    className="text-[24px] font-bold text-black text-center"
                    placeholder="07:00"
                    keyboardType="numbers-and-punctuation"
                  />
                </GlassCard>
              </View>
            </View>

            {/* Duration display */}
            <GlassCard className="p-4 items-center mb-6">
              <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
                Duration
              </Text>
              <Text className="text-[32px] font-bold" style={{ color: THEME }}>
                {durationHours}h
              </Text>
            </GlassCard>

            {/* Quality */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Sleep Quality (1-10)
            </Text>
            <View
              className="flex-row flex-wrap gap-1 mb-6"
              style={{
                maxWidth: safeContentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {QUALITY_PRESETS.map((v) => {
                const active = qualityScore === v;
                return (
                  <View key={v} style={{ width: fiveColCardWidth }}>
                    <Pressable
                      onPress={() => setQualityScore(v)}
                      className="h-11 rounded-xl items-center justify-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[13px]"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {v}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Latency */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Time to fall asleep (minutes)
            </Text>
            <View
              className="flex-row flex-wrap gap-2 mb-6"
              style={{
                maxWidth: safeContentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {[5, 10, 15, 20, 30, 45, 60].map((m) => {
                const active = latencyMinutes === m;
                return (
                  <View key={m} style={{ width: fourColCardWidth }}>
                    <Pressable
                      onPress={() => setLatencyMinutes(m)}
                      className="py-2.5 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[11px]"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {m}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Wakeups */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Night wakeups
            </Text>
            <View
              className="flex-row flex-wrap gap-2 mb-6"
              style={{
                maxWidth: safeContentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {WAKEUP_PRESETS.map((w) => {
                const active = wakeups === w;
                return (
                  <View key={w} style={{ width: fourColCardWidth }}>
                    <Pressable
                      onPress={() => setWakeups(w)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? THEME : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? THEME : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="font-bold text-[16px]"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {w === 5 ? "5+" : w}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Notes */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Notes (optional)
            </Text>
            <GlassCard className="p-3 mb-6">
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Caffeine, alcohol, screens, stress..."
                placeholderTextColor="#C7C7CC"
                className="text-[15px] text-black min-h-[50px]"
                multiline
                textAlignVertical="top"
              />
            </GlassCard>
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
              {saving ? "Saving..." : "Log Sleep"}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
