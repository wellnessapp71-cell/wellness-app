import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MoodSlider } from "@/components/mental/MoodSlider";
import { TriggerTagPicker } from "@/components/mental/TriggerTagPicker";
import { saveMentalCheckIn } from "@/lib/mental-store";
import { api } from "@/lib/api";
import { getBestIntervention } from "@aura/mental-engine";
import { recordFailedSync, captureError } from "@/lib/error-reporting";
import { recalcMentalScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";
import {
  MENTAL_INTERVENTION_TYPES,
  type TriggerTag,
  type InterventionType,
  type InterventionRecommendation,
} from "@aura/types";

const SLEEP_PRESETS = [5, 6, 7, 8, 9];

const INTERVENTION_LABELS: Record<InterventionType, string> = {
  breathing: "🌬️ Breathing",
  grounding: "🌍 Grounding",
  body_scan: "🧘 Body Scan",
  calm_audio: "🎵 Calm Audio",
  journal_prompt: "📝 Journaling",
};

export default function MentalCheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fiveColCardWidth = Math.floor((contentWidth - 16) / 5);

  const [moodScore, setMoodScore] = useState(5);
  const [stressScore, setStressScore] = useState(5);
  const [anxietyScore, setAnxietyScore] = useState(5);
  const [energyScore, setEnergyScore] = useState(5);
  const [focusScore, setFocusScore] = useState(5);
  const [sleepHours, setSleepHours] = useState(7);
  const [triggerTags, setTriggerTags] = useState<TriggerTag[]>([]);
  const [copingAction, setCopingAction] = useState<
    InterventionType | undefined
  >();
  const [supportRequested, setSupportRequested] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [intervention, setIntervention] =
    useState<InterventionRecommendation | null>(null);

  async function handleSave() {
    setSaving(true);
    const now = new Date();
    const dateIso = now.toISOString().split("T")[0];
    const checkinId = `mc_${Date.now().toString(36)}`;

    const checkIn = {
      checkinId,
      userId: "local",
      dateIso,
      moodScore,
      stressScoreManual: stressScore,
      anxietyScore,
      energyScore,
      focusScore,
      sleepHours,
      stressTriggerTags: triggerTags,
      copingActionUsed: copingAction,
      supportRequested,
    };

    await saveMentalCheckIn(checkIn);

    try {
      await api.post("/mental/checkin", {
        mood: moodScore,
        stressManual: stressScore,
        anxiety: anxietyScore,
        energy: energyScore,
        focus: focusScore,
        sleep: sleepHours,
        stressTriggers: triggerTags,
        copingAction: copingAction || undefined,
        supportReq: supportRequested,
      });
    } catch (err) {
      recordFailedSync("mental checkin sync", err);
    }

    // Recalculate mental score using full 4-signal model
    try {
      const score = await recalcMentalScore();
      await updateScores({ mental: score });
    } catch (err) {
      recordFailedSync("mental score recalc", err);
    }

    // Check if stress is high or mood is low → suggest intervention
    let showIntervention = false;
    if (stressScore >= 7 || anxietyScore >= 7 || moodScore <= 3) {
      try {
        const stressIndex = stressScore * 10; // convert 0-10 to 0-100 scale
        const rec = getBestIntervention(stressIndex);
        setIntervention(rec);
        showIntervention = true;
      } catch (err) {
        captureError(err, { context: "mental checkin intervention engine" });
      }
    }

    setSaving(false);
    setSaved(true);

    // Only auto-navigate if no intervention to show
    if (!showIntervention) {
      setTimeout(() => router.back(), 1200);
    }
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

            {intervention ? (
              <GlassCard
                className="p-5 mt-6 mx-2"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: stressScore >= 8 ? "#FF3B30" : "#FF9500",
                }}
              >
                <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  {stressScore >= 8
                    ? "🆘 High stress detected"
                    : "⚠️ Elevated stress detected"}
                </Text>
                <Text className="text-[16px] font-bold text-black mb-1">
                  {intervention.title}
                </Text>
                <Text className="text-[14px] text-[#3C3C43] leading-relaxed mb-1">
                  {intervention.description}
                </Text>
                <Text className="text-[12px] text-[#8A8A8E] mb-3">
                  ⏱️ {intervention.durationMinutes} min · {intervention.reason}
                </Text>
                <Pressable
                  onPress={() => router.replace("/mental/calm-toolkit")}
                  className="rounded-2xl py-3 items-center mb-2"
                  style={{ backgroundColor: "#AF52DE" }}
                >
                  <Text className="text-white text-[15px] font-semibold">
                    Start Calming
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => router.back()}
                  className="py-2 items-center"
                >
                  <Text className="text-[14px] text-[#8A8A8E]">
                    Skip for now
                  </Text>
                </Pressable>
              </GlassCard>
            ) : (
              <Text className="text-[15px] text-[#8A8A8E] mt-1">
                Returning to hub...
              </Text>
            )}
          </View>
        ) : (
          <View className="pt-4 pb-10">
            {/* Sliders */}
            <MoodSlider
              label="Mood"
              value={moodScore}
              onChange={setMoodScore}
              color="#AF52DE"
            />
            <MoodSlider
              label="Stress"
              value={stressScore}
              onChange={setStressScore}
              color="#FF3B30"
              invert
            />
            <MoodSlider
              label="Anxiety"
              value={anxietyScore}
              onChange={setAnxietyScore}
              color="#FF9500"
              invert
            />
            <MoodSlider
              label="Energy"
              value={energyScore}
              onChange={setEnergyScore}
              color="#34C759"
            />
            <MoodSlider
              label="Focus"
              value={focusScore}
              onChange={setFocusScore}
              color="#007AFF"
            />

            {/* Sleep hours */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Hours of Sleep
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {SLEEP_PRESETS.map((h) => (
                <View key={h} style={{ width: fiveColCardWidth }}>
                  <Pressable
                    onPress={() => setSleepHours(h)}
                    className="h-12 rounded-xl items-center justify-center"
                    style={{
                      backgroundColor: sleepHours === h ? "#5856D6" : "#fff",
                      borderWidth: 1.5,
                      borderColor: sleepHours === h ? "#5856D6" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="font-bold text-[16px]"
                      style={{ color: sleepHours === h ? "#fff" : "#000" }}
                    >
                      {h}h
                    </Text>
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Triggers (optional) */}
            <TriggerTagPicker
              label="Stress triggers today (optional)"
              selected={triggerTags}
              onChange={setTriggerTags}
              color="#FF9500"
            />

            {/* Coping action (optional) */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Coping technique used (optional)
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {MENTAL_INTERVENTION_TYPES.map((type) => {
                const active = copingAction === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setCopingAction(active ? undefined : type)}
                    className="px-3.5 py-2.5 rounded-full"
                    style={{
                      backgroundColor: active ? "#AF52DE" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#AF52DE" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {INTERVENTION_LABELS[type]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Support requested */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
                  Request support
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mt-0.5">
                  Notify your wellness coordinator
                </Text>
              </View>
              <Switch
                value={supportRequested}
                onValueChange={setSupportRequested}
                trackColor={{ false: "#E5E5EA", true: "#AF52DE" }}
                thumbColor="#fff"
              />
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
            style={{ backgroundColor: saving ? "#C6C6C8" : "#AF52DE" }}
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
