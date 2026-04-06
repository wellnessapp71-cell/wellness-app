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
import { MoodSlider } from "@/components/mental/MoodSlider";
import {
  saveSpiritualCheckIn,
  getSpiritualCheckInHistory,
} from "@/lib/spiritual-store";
import { api } from "@/lib/api";
import { recordFailedSync, captureError } from "@/lib/error-reporting";
import { recalcSpiritualScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";
import {
  detectDailyAlerts,
  generateCoachMessage,
  classifyCalmBand,
} from "@aura/spiritual-engine";
import {
  SPIRITUAL_FEELING_TAGS,
  SPIRITUAL_BLOCKER_TAGS,
  type SpiritualFeelingTag,
  type SpiritualBlockerTag,
} from "@aura/types";

const TEAL = "#30B0C7";

const FEELING_LABELS: Record<
  SpiritualFeelingTag,
  { emoji: string; label: string }
> = {
  peaceful: { emoji: "😌", label: "Peaceful" },
  distracted: { emoji: "😵‍💫", label: "Distracted" },
  heavy: { emoji: "😔", label: "Heavy" },
  grateful: { emoji: "🙏", label: "Grateful" },
  restless: { emoji: "😤", label: "Restless" },
  inspired: { emoji: "✨", label: "Inspired" },
};

const BLOCKER_LABELS: Record<
  SpiritualBlockerTag,
  { emoji: string; label: string }
> = {
  work: { emoji: "💼", label: "Work" },
  conflict: { emoji: "⚡", label: "Conflict" },
  phone_overload: { emoji: "📱", label: "Phone" },
  loneliness: { emoji: "😞", label: "Loneliness" },
  worry: { emoji: "😰", label: "Worry" },
  health: { emoji: "🤒", label: "Health" },
  other: { emoji: "❓", label: "Other" },
};

const CONNECTED_OPTIONS = [
  { value: "yes", label: "Yes", emoji: "💚" },
  { value: "a_little", label: "A little", emoji: "💛" },
  { value: "no", label: "No", emoji: "🤍" },
] as const;

export default function SpiritualCheckInScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const twoColCardWidth = Math.floor((contentWidth - 12) / 2);
  const threeColCardWidth = Math.floor((contentWidth - 16) / 3);

  // Step 1: Calm slider (0-10)
  const [calmScore, setCalmScore] = useState(5);
  // Step 2: Feeling chips (multi-select)
  const [feelings, setFeelings] = useState<SpiritualFeelingTag[]>([]);
  // Step 3: Quick questions
  const [didPractice, setDidPractice] = useState(false);
  const [feltConnected, setFeltConnected] = useState<"yes" | "a_little" | "no">(
    "a_little",
  );
  const [natureHelped, setNatureHelped] = useState<"yes" | "a_little" | "no">(
    "a_little",
  );
  // Step 4: Blockers (multi-select)
  const [blockers, setBlockers] = useState<SpiritualBlockerTag[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);

  function toggleFeeling(tag: SpiritualFeelingTag) {
    setFeelings((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  function toggleBlocker(tag: SpiritualBlockerTag) {
    setBlockers((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleSave() {
    setSaving(true);
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const checkinId = `sc_${Date.now().toString(36)}`;

    const checkIn = {
      id: checkinId,
      date: dateStr,
      calmScore,
      didPractice,
      feltConnected,
      natureOrReflectionHelped: natureHelped,
      blockers,
      feelings,
      createdAt: now.toISOString(),
    };

    await saveSpiritualCheckIn(checkIn);

    // Sync to API (fire & forget)
    try {
      await api.post("/spiritual/checkin", {
        date: dateStr,
        calmScore,
        didPractice,
        feltConnected,
        natureOrReflectionHelped: natureHelped,
        blockers,
        feelings,
      });
    } catch (err) {
      recordFailedSync("spiritual checkin sync", err);
    }

    // Recalculate spiritual score using all inputs
    try {
      const score = await recalcSpiritualScore();
      await updateScores({ spiritual: score });
    } catch (err) {
      recordFailedSync("spiritual score recalc", err);
    }

    // Check if we should show a coach message (worsening trend)
    try {
      const history = await getSpiritualCheckInHistory(7);
      const band = classifyCalmBand(calmScore);
      if (band === "red" || band === "orange") {
        const msg = generateCoachMessage(
          band,
          "peace",
          "declining",
          blockers[0] ?? null,
        );
        setCoachMessage(msg.text);
      }
    } catch (err) {
      captureError(err, { context: "spiritual checkin trend analysis" });
    }

    setSaving(false);
    setSaved(true);

    if (!coachMessage) {
      setTimeout(() => router.back(), 1200);
    }
  }

  // Calm band color
  const calmBandColor =
    calmScore >= 7
      ? "#34C759"
      : calmScore >= 5
        ? TEAL
        : calmScore >= 3
          ? "#FF9500"
          : "#FF3B30";

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
            {coachMessage ? (
              <GlassCard
                className="p-4 mt-6 mx-4"
                style={{ borderLeftWidth: 3, borderLeftColor: calmBandColor }}
              >
                <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  🧘 Message from your guide
                </Text>
                <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
                  {coachMessage}
                </Text>
                <Pressable
                  onPress={() => router.back()}
                  className="mt-4 rounded-2xl py-3 items-center"
                  style={{ backgroundColor: TEAL }}
                >
                  <Text className="text-white text-[15px] font-semibold">
                    Got it
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
            {/* ─── Step 1: Calm Slider ─── */}
            <MoodSlider
              label="Inner Calm"
              value={calmScore}
              onChange={setCalmScore}
              color={TEAL}
            />

            {/* Calm band indicator */}
            <View className="flex-row items-center justify-center gap-2 mb-6 -mt-2">
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: calmBandColor }}
              />
              <Text
                className="text-[12px] font-semibold"
                style={{ color: calmBandColor }}
              >
                {calmScore >= 7
                  ? "Calm"
                  : calmScore >= 5
                    ? "Okay"
                    : calmScore >= 3
                      ? "Low"
                      : "Very Low"}
              </Text>
            </View>

            {/* ─── Step 2: Feeling Chips ─── */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              How are you feeling?
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SPIRITUAL_FEELING_TAGS.map((tag) => {
                const active = feelings.includes(tag);
                const info = FEELING_LABELS[tag];
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleFeeling(tag)}
                    className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-full"
                    style={{
                      backgroundColor: active ? TEAL : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? TEAL : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{info.emoji}</Text>
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

            {/* ─── Step 3: Quick Questions ─── */}
            {/* Did you practice today? */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Did you pause for quiet, breath, or meditation today?
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {[true, false].map((val) => {
                const active = didPractice === val;
                return (
                  <View key={String(val)} style={{ width: twoColCardWidth }}>
                    <Pressable
                      onPress={() => setDidPractice(val)}
                      className="py-3.5 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="text-[15px] font-semibold"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {val ? "✓ Yes" : "✗ No"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Felt connected? */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Did you feel connected to yourself or others?
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {CONNECTED_OPTIONS.map((opt) => {
                const active = feltConnected === opt.value;
                return (
                  <View key={opt.value} style={{ width: threeColCardWidth }}>
                    <Pressable
                      onPress={() => setFeltConnected(opt.value)}
                      className="py-3.5 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                      <Text
                        className="text-[13px] font-semibold mt-1"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Nature / reflection helped? */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Did nature, silence, or reflection help today?
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {CONNECTED_OPTIONS.map((opt) => {
                const active = natureHelped === opt.value;
                return (
                  <View key={opt.value} style={{ width: threeColCardWidth }}>
                    <Pressable
                      onPress={() => setNatureHelped(opt.value)}
                      className="py-3.5 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                      <Text
                        className="text-[13px] font-semibold mt-1"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* ─── Step 4: Blocker Chips ─── */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              What blocked your calm? (optional)
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SPIRITUAL_BLOCKER_TAGS.map((tag) => {
                const active = blockers.includes(tag);
                const info = BLOCKER_LABELS[tag];
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleBlocker(tag)}
                    className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-full"
                    style={{
                      backgroundColor: active ? "#FF9500" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#FF9500" : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{info.emoji}</Text>
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
            style={{ backgroundColor: saving ? "#C6C6C8" : TEAL }}
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
