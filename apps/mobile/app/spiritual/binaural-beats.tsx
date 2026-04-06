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
import {
  BINAURAL_PRESETS,
  playBinauralBeat,
  stopCurrentSound,
  setVolume,
  type BinauralPreset,
} from "@/lib/audio-engine";
import { recordFailedSync } from "@/lib/error-reporting";
import { recalcSpiritualScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";

const TEAL = "#30B0C7";

// Group presets by band
const BANDS = ["Delta", "Theta", "Alpha", "Beta", "Gamma"] as const;
const BAND_INFO: Record<
  string,
  { range: string; desc: string; color: string }
> = {
  Delta: { range: "0.5–4 Hz", desc: "Deep sleep & healing", color: "#5856D6" },
  Theta: { range: "4–8 Hz", desc: "Meditation & creativity", color: "#AF52DE" },
  Alpha: { range: "8–14 Hz", desc: "Relaxation & calm focus", color: "#30B0C7" },
  Beta: { range: "14–30 Hz", desc: "Alertness & concentration", color: "#FF9500" },
  Gamma: { range: "30–100 Hz", desc: "Higher cognition & insight", color: "#FF2D55" },
};

const TIMER_OPTIONS = [
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
  { label: "30 min", seconds: 1800 },
];

type ScreenState = "select" | "playing" | "complete";

export default function BinauralBeatsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const fiveColWidth = Math.floor((contentWidth - 32) / 5);

  const [state, setState] = useState<ScreenState>("select");
  const [selectedPreset, setSelectedPreset] = useState<BinauralPreset | null>(
    null,
  );
  const [expandedBand, setExpandedBand] = useState<string | null>("Alpha");
  const [timerDuration, setTimerDuration] = useState(600);
  const [volume, setVolumeLocal] = useState(0.5);

  const [timeLeft, setTimeLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);

  async function startPlaying() {
    if (!selectedPreset) return;
    setTimeLeft(timerDuration);
    startRef.current = Date.now();
    setState("playing");

    await playBinauralBeat(selectedPreset);

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, timerDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        doStop(true);
      }
    }, 1000);
  }

  async function doStop(completed = false) {
    if (intervalRef.current) clearInterval(intervalRef.current);

    await stopCurrentSound();

    const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
    const totalMinutes = Math.max(1, Math.round(elapsed / 60));

    const session = {
      id: `bb_${Date.now().toString(36)}`,
      type: "soundscape" as const,
      contentId: selectedPreset?.id ?? null,
      durationMinutes: totalMinutes,
      completedAt: new Date().toISOString(),
      rating: null,
    };

    await savePracticeSession(session);

    try {
      await api.post("/spiritual/practice", session);
    } catch (err) {
      recordFailedSync("binaural beats practice sync", err);
    }

    try {
      const score = await recalcSpiritualScore();
      await updateScores({ spiritual: score });
    } catch (err) {
      recordFailedSync("spiritual score recalc after binaural beats", err);
    }

    setState("complete");
  }

  async function handleVolumeChange(newVol: number) {
    setVolumeLocal(newVol);
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
          {state === "complete" ? "Session Complete" : "Binaural Beats"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* ── Selection ── */}
        {state === "select" && (
          <View className="pt-4 pb-10">
            <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
              Binaural Beats
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mb-2 leading-relaxed">
              Binaural beats use two slightly different frequencies in each ear
              to create a perceived third tone that can influence brainwave
              patterns.
            </Text>
            <View
              className="px-3 py-2 rounded-xl mb-6"
              style={{ backgroundColor: "#FF950015" }}
            >
              <Text className="text-[12px] text-[#FF9500] font-semibold">
                🎧 Headphones required for binaural effect
              </Text>
            </View>

            {/* Band accordion */}
            {BANDS.map((band) => {
              const info = BAND_INFO[band];
              const isExpanded = expandedBand === band;
              const presets = BINAURAL_PRESETS.filter((p) => p.band === band);

              return (
                <View key={band} className="mb-3">
                  {/* Band header */}
                  <Pressable
                    onPress={() =>
                      setExpandedBand(isExpanded ? null : band)
                    }
                  >
                    <GlassCard
                      className="p-4 flex-row items-center gap-3"
                      style={
                        isExpanded
                          ? { borderWidth: 2, borderColor: info.color + "40" }
                          : undefined
                      }
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: info.color + "15" }}
                      >
                        <Text
                          className="text-[14px] font-black"
                          style={{ color: info.color }}
                        >
                          {band.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[16px] font-bold text-black">
                          {band}
                          <Text className="text-[13px] text-[#8A8A8E] font-medium">
                            {"  "}
                            {info.range}
                          </Text>
                        </Text>
                        <Text className="text-[12px] text-[#8A8A8E] mt-0.5">
                          {info.desc}
                        </Text>
                      </View>
                      <Text className="text-[16px] text-[#C7C7CC]">
                        {isExpanded ? "▾" : "▸"}
                      </Text>
                    </GlassCard>
                  </Pressable>

                  {/* Expanded presets */}
                  {isExpanded &&
                    presets.map((preset) => {
                      const isSelected = selectedPreset?.id === preset.id;
                      return (
                        <Pressable
                          key={preset.id}
                          onPress={() => setSelectedPreset(preset)}
                          className="ml-4 mt-2"
                        >
                          <GlassCard
                            className="p-4 flex-row items-center gap-3"
                            style={
                              isSelected
                                ? {
                                    borderWidth: 2,
                                    borderColor: preset.color,
                                    backgroundColor: preset.color + "08",
                                  }
                                : undefined
                            }
                          >
                            <Text style={{ fontSize: 24 }}>{preset.icon}</Text>
                            <View className="flex-1">
                              <Text className="text-[15px] font-bold text-black">
                                {preset.label}
                              </Text>
                              <Text className="text-[12px] text-[#8A8A8E] mt-0.5">
                                {preset.desc}
                              </Text>
                              <Text
                                className="text-[11px] font-bold mt-1"
                                style={{ color: preset.color }}
                              >
                                {preset.beatFrequency} Hz beat · {preset.baseFrequency} Hz
                                carrier
                              </Text>
                            </View>
                            {isSelected && (
                              <Text
                                className="font-bold"
                                style={{ color: preset.color }}
                              >
                                ✓
                              </Text>
                            )}
                          </GlassCard>
                        </Pressable>
                      );
                    })}
                </View>
              );
            })}

            {/* Timer selection */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-6 mb-3">
              Duration
            </Text>
            <View
              className="flex-row justify-between mb-6"
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

            {/* Play button */}
            <Pressable
              onPress={startPlaying}
              disabled={!selectedPreset}
              className="rounded-2xl py-4 items-center"
              style={{
                backgroundColor: selectedPreset
                  ? selectedPreset.color
                  : "#C6C6C8",
              }}
            >
              <Text className="text-white text-[17px] font-semibold">
                Start Session
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Playing ── */}
        {state === "playing" && selectedPreset && (
          <View className="items-center pt-10 pb-10">
            {/* Animated visual */}
            <View
              className="w-44 h-44 rounded-full items-center justify-center mb-6"
              style={{ backgroundColor: selectedPreset.color + "20" }}
            >
              <View
                className="w-28 h-28 rounded-full items-center justify-center"
                style={{ backgroundColor: selectedPreset.color + "30" }}
              >
                <Text style={{ fontSize: 48 }}>{selectedPreset.icon}</Text>
              </View>
            </View>

            <Text className="text-[22px] font-bold text-black">
              {selectedPreset.label}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mt-1 mb-1">
              {selectedPreset.desc}
            </Text>

            {/* Band & frequency badges */}
            <View className="flex-row gap-2 mb-6">
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: selectedPreset.color + "15" }}
              >
                <Text
                  className="text-[11px] font-bold uppercase"
                  style={{ color: selectedPreset.color }}
                >
                  {selectedPreset.band}
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: "#1C1C1E10" }}
              >
                <Text className="text-[11px] font-bold text-[#8A8A8E]">
                  {selectedPreset.beatFrequency} Hz
                </Text>
              </View>
            </View>

            {/* Timer */}
            <Text
              className="text-[48px] font-bold mb-2"
              style={{ color: selectedPreset.color }}
            >
              {minutes}:{seconds.toString().padStart(2, "0")}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mb-4">
              Playing binaural beat...
            </Text>

            {/* Volume */}
            <View className="flex-row items-center gap-3 mb-8 w-full px-4">
              <Text className="text-[12px] text-[#8A8A8E]">🔈</Text>
              <View className="flex-1 h-2 bg-[#E5E5EA] rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${volume * 100}%`,
                    backgroundColor: selectedPreset.color,
                  }}
                />
              </View>
              <Text className="text-[12px] text-[#8A8A8E]">🔊</Text>
            </View>

            {/* Volume buttons */}
            <View className="flex-row gap-3 mb-8">
              <Pressable
                onPress={() => handleVolumeChange(Math.max(0, volume - 0.1))}
                className="px-5 py-2 rounded-xl bg-white border border-[#E5E5EA]"
              >
                <Text className="text-[14px] font-bold text-[#3C3C43]">
                  Vol −
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleVolumeChange(Math.min(1, volume + 0.1))}
                className="px-5 py-2 rounded-xl bg-white border border-[#E5E5EA]"
              >
                <Text className="text-[14px] font-bold text-[#3C3C43]">
                  Vol +
                </Text>
              </Pressable>
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
              Session Complete
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-2">
              {selectedPreset?.label} · Session logged
            </Text>
            <Text className="text-[13px] text-[#C7C7CC] text-center mb-8">
              {selectedPreset?.band} band · {selectedPreset?.beatFrequency} Hz
            </Text>

            <Pressable
              onPress={() => {
                setState("select");
                setSelectedPreset(null);
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
