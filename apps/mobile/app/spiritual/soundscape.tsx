import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { savePracticeSession } from "@/lib/spiritual-store";
import { api } from "@/lib/api";

const TEAL = "#30B0C7";

// ─── Soundscapes ────────────────────────────────────────────────────────────

const SOUNDSCAPES = [
  {
    id: "rain",
    label: "Gentle Rain",
    icon: "🌧️",
    desc: "Soft rainfall on leaves",
    mood: "pre-sleep",
    bgColor: "#4A90D9",
  },
  {
    id: "ocean",
    label: "Ocean Waves",
    icon: "🌊",
    desc: "Rhythmic waves on shore",
    mood: "stress reset",
    bgColor: "#2E86AB",
  },
  {
    id: "forest",
    label: "Forest",
    icon: "🌲",
    desc: "Birds and rustling trees",
    mood: "deep work",
    bgColor: "#2D936C",
  },
  {
    id: "wind",
    label: "Mountain Wind",
    icon: "🏔️",
    desc: "Calm breeze through valleys",
    mood: "recovery",
    bgColor: "#5B7065",
  },
  {
    id: "night",
    label: "Night Crickets",
    icon: "🌙",
    desc: "Peaceful evening sounds",
    mood: "pre-sleep",
    bgColor: "#3C4F76",
  },
  {
    id: "stream",
    label: "Mountain Stream",
    icon: "💧",
    desc: "Flowing water over stones",
    mood: "deep work",
    bgColor: "#3B92B5",
  },
];

const TIMER_OPTIONS = [
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
];

const MOOD_LABELS: Record<string, { emoji: string; color: string }> = {
  "pre-sleep": { emoji: "😴", color: "#5856D6" },
  "deep work": { emoji: "🎯", color: "#007AFF" },
  "stress reset": { emoji: "🌬️", color: TEAL },
  recovery: { emoji: "🌿", color: "#34C759" },
};

type SoundscapeState = "select" | "playing" | "complete";

export default function SpiritualSoundscapeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fiveColWidth = Math.floor((contentWidth - 32) / 5);
  const [state, setState] = useState<SoundscapeState>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [timerDuration, setTimerDuration] = useState(300); // 5 min default
  const [loop, setLoop] = useState(false);

  // Playing state
  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  const selectedScene = SOUNDSCAPES.find((s) => s.id === selectedId);

  function startPlaying() {
    if (!selectedId) return;
    setTimeLeft(timerDuration);
    startRef.current = Date.now();
    setState("playing");

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (loop) {
          // Restart timer for loop
          startRef.current = Date.now();
        } else {
          stopPlaying(true);
        }
      }
    }, 1000);
  }

  async function stopPlaying(completed = false) {
    if (intervalRef.current) clearInterval(intervalRef.current);

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
    } catch {
      /* offline-first */
    }

    setState("complete");
  }

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleBack() {
    if (state === "playing") {
      stopPlaying(false);
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

            {/* Soundscape cards */}
            {SOUNDSCAPES.map((scene) => {
              const active = selectedId === scene.id;
              const moodInfo = MOOD_LABELS[scene.mood];
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
                      style={{ backgroundColor: scene.bgColor + "25" }}
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
                      <View className="flex-row items-center gap-1 mt-1">
                        <Text style={{ fontSize: 10 }}>{moodInfo?.emoji}</Text>
                        <Text
                          className="text-[10px] font-semibold uppercase"
                          style={{ color: moodInfo?.color ?? TEAL }}
                        >
                          {scene.mood}
                        </Text>
                      </View>
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

            <Text className="text-[11px] text-[#8A8A8E] text-center mt-3">
              Audio assets are placeholders — plug in real ambient sound files
              for production.
            </Text>
          </View>
        )}

        {/* ── Playing ── */}
        {state === "playing" && selectedScene && (
          <View className="items-center pt-10 pb-10">
            {/* Visual background indicator */}
            <View
              className="w-40 h-40 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: selectedScene.bgColor + "30" }}
            >
              <Text style={{ fontSize: 64 }}>{selectedScene.icon}</Text>
            </View>

            <Text className="text-[22px] font-bold text-black">
              {selectedScene.label}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mt-1 mb-2">
              {selectedScene.desc}
            </Text>

            {/* Mood badge */}
            <View
              className="px-3 py-1 rounded-full mb-8"
              style={{ backgroundColor: TEAL + "15" }}
            >
              <Text
                className="text-[11px] font-semibold uppercase"
                style={{ color: TEAL }}
              >
                {selectedScene.mood} {loop ? "· looping" : ""}
              </Text>
            </View>

            {/* Timer */}
            <Text
              className="text-[48px] font-bold mb-2"
              style={{ color: TEAL }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mb-8">Playing...</Text>

            {/* Stop button */}
            <Pressable
              onPress={() => stopPlaying(false)}
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
