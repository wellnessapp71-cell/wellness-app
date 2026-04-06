import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { savePracticeSession } from "@/lib/spiritual-store";
import { api } from "@/lib/api";
import {
  NATURE_SOUNDS,
  playNatureSound,
  stopCurrentSound,
  setVolume,
} from "@/lib/audio-engine";
import type { AudioPlayer } from "expo-audio";
import { recordFailedSync } from "@/lib/error-reporting";
import { recalcSpiritualScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";

const TEAL = "#30B0C7";

const SOUNDSCAPES = Object.entries(NATURE_SOUNDS).map(([id, s]) => ({
  id,
  label: s.label,
  icon: s.icon,
  desc: s.desc,
}));

const MOOD_MAP: Record<string, { mood: string; emoji: string; color: string }> = {
  rain: { mood: "pre-sleep", emoji: "😴", color: "#5856D6" },
  ocean: { mood: "stress reset", emoji: "🌬️", color: TEAL },
  forest: { mood: "deep work", emoji: "🎯", color: "#007AFF" },
  wind: { mood: "recovery", emoji: "🌿", color: "#34C759" },
  night: { mood: "pre-sleep", emoji: "😴", color: "#5856D6" },
  stream: { mood: "deep work", emoji: "🎯", color: "#007AFF" },
  thunder: { mood: "stress reset", emoji: "🌬️", color: TEAL },
  fire: { mood: "recovery", emoji: "🌿", color: "#34C759" },
};

const BG_COLORS: Record<string, string> = {
  rain: "#4A90D9",
  ocean: "#2E86AB",
  forest: "#2D936C",
  wind: "#5B7065",
  night: "#3C4F76",
  stream: "#3B92B5",
  thunder: "#4A5568",
  fire: "#C0392B",
};

const TIMER_OPTIONS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
];

type SoundscapeState = "select" | "playing" | "complete";

export default function SpiritualSoundscapeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fiveColWidth = Math.floor((contentWidth - 32) / 5);
  const [state, setState] = useState<SoundscapeState>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timerDuration, setTimerDuration] = useState(300);
  const [loop, setLoop] = useState(false);
  const [volume, setVolumeState] = useState(0.8);

  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const soundRef = useRef<AudioPlayer | null>(null);
  const sliderWidthRef = useRef(200);

  const selectedScene = SOUNDSCAPES.find((s) => s.id === selectedId);

  async function startPlaying() {
    if (!selectedId) return;
    setTimeLeft(timerDuration);
    startRef.current = Date.now();
    setState("playing");

    // Start real audio playback
    const sound = await playNatureSound(selectedId);
    soundRef.current = sound;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (loop) {
          startRef.current = Date.now();
        } else {
          doStop(true);
        }
      }
    }, 1000);
  }

  async function doStop(completed = false) {
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Stop audio
    await stopCurrentSound();
    soundRef.current = null;

    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    const totalMinutes = Math.max(1, Math.round(elapsed / 60));

    const session = {
      id: `ss_${Date.now().toString(36)}`,
      type: "soundscape" as const,
      contentId: selectedId,
      durationMinutes: totalMinutes,
      completedAt: new Date().toISOString(),
      rating: null,
    };

    await savePracticeSession(session);

    try {
      await api.post("/spiritual/practice", session);
    } catch (err) {
      recordFailedSync("soundscape practice sync", err);
    }

    try {
      const score = await recalcSpiritualScore();
      await updateScores({ spiritual: score });
    } catch (err) {
      recordFailedSync("spiritual score recalc after soundscape", err);
    }

    setState("complete");
  }

  async function handleVolumeChange(newVol: number) {
    setVolumeState(newVol);
    await setVolume(newVol);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopCurrentSound();
    };
  }, []);

  function handleBack() {
    if (state === "playing") {
      doStop(false);
    } else {
      router.back();
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={handleBack}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">{state === "playing" ? "✕" : "‹"}</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          {state === "complete" ? "Session Complete" : "Soundscapes"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* ── Selection ── */}
        {state === "select" && (
          <View className="pt-4 pb-10">
            <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
              Ambient sounds
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mb-6">
              Immerse yourself in calming natural soundscapes.
            </Text>

            {SOUNDSCAPES.map((scene) => {
              const active = selectedId === scene.id;
              const moodInfo = MOOD_MAP[scene.id];
              const bgColor = BG_COLORS[scene.id] ?? TEAL;
              return (
                <Pressable
                  key={scene.id}
                  onPress={() => setSelectedId(scene.id)}
                  className="mb-3"
                >
                  <GlassCard
                    className="p-4 flex-row items-center gap-4"
                    style={
                      active ? { borderWidth: 2, borderColor: TEAL } : undefined
                    }
                  >
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: bgColor + "25" }}
                    >
                      <Text style={{ fontSize: 24 }}>{scene.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-black">
                        {scene.label}
                      </Text>
                      <Text className="text-[12px] text-[#8A8A8E] mt-0.5">
                        {scene.desc}
                      </Text>
                      {moodInfo && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Text style={{ fontSize: 10 }}>{moodInfo.emoji}</Text>
                          <Text
                            className="text-[10px] font-semibold uppercase"
                            style={{ color: moodInfo.color }}
                          >
                            {moodInfo.mood}
                          </Text>
                        </View>
                      )}
                    </View>
                    {active && (
                      <Text className="font-bold" style={{ color: TEAL }}>
                        ✓
                      </Text>
                    )}
                  </GlassCard>
                </Pressable>
              );
            })}

            {/* Timer selection */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-4 mb-3">
              Duration
            </Text>
            <View
              className="flex-row justify-between mb-4"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {TIMER_OPTIONS.map((opt) => {
                const active = timerDuration === opt.seconds;
                return (
                  <View key={opt.seconds} style={{ width: fiveColWidth }}>
                    <Pressable
                      onPress={() => setTimerDuration(opt.seconds)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text
                        className="text-[13px] font-bold"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Loop toggle */}
            <Pressable
              onPress={() => setLoop(!loop)}
              className="flex-row items-center gap-3 mb-6"
            >
              <View
                className="w-6 h-6 rounded items-center justify-center"
                style={{
                  backgroundColor: loop ? TEAL : "transparent",
                  borderWidth: 2,
                  borderColor: loop ? TEAL : "#E5E5EA",
                }}
              >
                {loop && (
                  <Text className="text-white text-[12px] font-bold">✓</Text>
                )}
              </View>
              <Text className="text-[14px] text-[#3C3C43] font-medium">
                Loop continuously
              </Text>
            </Pressable>

            {/* Play button */}
            <Pressable
              onPress={startPlaying}
              disabled={!selectedId}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: selectedId ? TEAL : "#C6C6C8" }}
            >
              <Text className="text-white text-[17px] font-semibold">Play</Text>
            </Pressable>
          </View>
        )}

        {/* ── Playing ── */}
        {state === "playing" && selectedScene && (
          <View className="items-center pt-10 pb-10">
            <View
              className="w-40 h-40 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: (BG_COLORS[selectedScene.id] ?? TEAL) + "30" }}
            >
              <Text style={{ fontSize: 64 }}>{selectedScene.icon}</Text>
            </View>

            <Text className="text-[22px] font-bold text-black">
              {selectedScene.label}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mt-1 mb-2">
              {selectedScene.desc}
            </Text>

            <View
              className="px-3 py-1 rounded-full mb-6"
              style={{ backgroundColor: TEAL + "15" }}
            >
              <Text
                className="text-[11px] font-semibold uppercase"
                style={{ color: TEAL }}
              >
                {MOOD_MAP[selectedScene.id]?.mood ?? "ambient"}{" "}
                {loop ? "· looping" : ""}
              </Text>
            </View>

            {/* Timer */}
            <Text
              className="text-[48px] font-bold mb-2"
              style={{ color: TEAL }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mb-4">Playing...</Text>

            {/* Volume control */}
            <View className="flex-row items-center gap-3 mb-8 w-full px-4">
              <Text className="text-[12px] text-[#8A8A8E]">🔈</Text>
              <View
                className="flex-1 h-8 justify-center"
                onLayout={(e: LayoutChangeEvent) => {
                  sliderWidthRef.current = e.nativeEvent.layout.width;
                }}
              >
                <Pressable
                  onPress={(e: GestureResponderEvent) => {
                    const ratio = e.nativeEvent.locationX / sliderWidthRef.current;
                    handleVolumeChange(Math.max(0, Math.min(1, ratio)));
                  }}
                  className="h-2 bg-[#E5E5EA] rounded-full overflow-hidden justify-center"
                >
                  <View
                    className="h-full rounded-full"
                    style={{ width: `${volume * 100}%`, backgroundColor: TEAL }}
                  />
                </Pressable>
              </View>
              <Text className="text-[12px] text-[#8A8A8E]">🔊</Text>
            </View>

            {/* Stop button */}
            <Pressable
              onPress={() => doStop(false)}
              className="w-full rounded-2xl py-4 items-center bg-[#FF3B30]"
            >
              <Text className="text-white text-[17px] font-semibold">Stop</Text>
            </Pressable>
          </View>
        )}

        {/* ── Complete ── */}
        {state === "complete" && (
          <View className="items-center pt-10 pb-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4 mb-2">
              Soundscape Complete
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-8">
              {selectedScene?.label} · Session logged
            </Text>

            <Pressable
              onPress={() => {
                setState("select");
                setSelectedId(null);
              }}
              className="w-full rounded-2xl py-4 items-center mb-3"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white text-[17px] font-semibold">
                Try Another
              </Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <Text
                className="text-[15px] font-medium mt-2"
                style={{ color: TEAL }}
              >
                Return to Hub
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
