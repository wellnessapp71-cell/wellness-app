import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  BreathingExercise,
  PATTERNS,
} from "@/components/mental/BreathingExercise";
import { GroundingExercise } from "@/components/mental/GroundingExercise";
import { BodyScanGuide } from "@/components/mental/BodyScanGuide";
import { saveCopingSession } from "@/lib/mental-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import {
  NATURE_SOUNDS,
  playNatureSound,
  stopCurrentSound,
} from "@/lib/audio-engine";
import type { InterventionType } from "@aura/types";

// ─── State Machine ──────────────────────────────────────────────────────────

type ToolkitState =
  | "menu"
  | "breathing"
  | "breathing_pattern"
  | "grounding"
  | "body_scan"
  | "calm_audio"
  | "complete";

const AUDIO_SCENES = [
  { id: "rain", label: NATURE_SOUNDS.rain.label, icon: NATURE_SOUNDS.rain.icon, desc: NATURE_SOUNDS.rain.desc },
  { id: "ocean", label: NATURE_SOUNDS.ocean.label, icon: NATURE_SOUNDS.ocean.icon, desc: NATURE_SOUNDS.ocean.desc },
  { id: "forest", label: NATURE_SOUNDS.forest.label, icon: NATURE_SOUNDS.forest.icon, desc: NATURE_SOUNDS.forest.desc },
  { id: "thunder", label: NATURE_SOUNDS.thunder.label, icon: NATURE_SOUNDS.thunder.icon, desc: NATURE_SOUNDS.thunder.desc },
  { id: "fire", label: NATURE_SOUNDS.fire.label, icon: NATURE_SOUNDS.fire.icon, desc: NATURE_SOUNDS.fire.desc },
];

const AUDIO_TIMERS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
];

export default function CalmToolkitScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const threeColCardWidth = Math.floor((contentWidth - 24) / 3);
  const [state, setState] = useState<ToolkitState>("menu");
  const [breathingPattern, setBreathingPattern] = useState<string>("4-7-8");
  const [completedType, setCompletedType] = useState<InterventionType | null>(
    null,
  );
  const [completedDuration, setCompletedDuration] = useState(0);

  // Audio player state
  const [audioScene, setAudioScene] = useState<string | null>(null);
  const [audioTimer, setAudioTimer] = useState(180);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTimeLeft, setAudioTimeLeft] = useState(0);
  const [audioIntervalId, setAudioIntervalId] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopCurrentSound();
    };
  }, []);

  const logSession = useCallback(
    async (
      type: InterventionType,
      durationSeconds: number,
      completed: boolean,
    ) => {
      const session = {
        sessionId: `cs_${Date.now().toString(36)}`,
        userId: "local",
        interventionType: type,
        durationSeconds,
        completed,
        completedAtIso: new Date().toISOString(),
      };

      await saveCopingSession(session);
      try {
        await api.post("/mental/coping", {
          interventionType: type,
          duration: durationSeconds,
          completion: completed,
        });
      } catch (err) {
        recordFailedSync("mental coping session sync", err);
      }

      setCompletedType(type);
      setCompletedDuration(durationSeconds);
      setState("complete");
    },
    [],
  );

  async function startAudio() {
    if (!audioScene) return;
    setAudioPlaying(true);
    setAudioTimeLeft(audioTimer);

    // Start real audio playback
    await playNatureSound(audioScene);

    const id = setInterval(() => {
      setAudioTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setAudioPlaying(false);
          stopCurrentSound();
          logSession("calm_audio", audioTimer, true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setAudioIntervalId(id);
  }

  async function stopAudio() {
    if (audioIntervalId) clearInterval(audioIntervalId);
    setAudioPlaying(false);
    await stopCurrentSound();
    const elapsed = audioTimer - audioTimeLeft;
    logSession("calm_audio", elapsed, false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={() => {
            if (state === "menu" || state === "complete") {
              router.back();
            } else {
              if (audioIntervalId) clearInterval(audioIntervalId);
              setAudioPlaying(false);
              stopCurrentSound();
              setState("menu");
            }
          }}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">
            {state === "menu" || state === "complete" ? "‹" : "✕"}
          </Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          {state === "menu"
            ? "Calm Toolkit"
            : state === "complete"
              ? "Done"
              : ""}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* ── Menu ── */}
        {state === "menu" && (
          <View className="pt-4 pb-10">
            <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
              Take a short reset
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mb-6">
              Pick an intervention that suits your mood right now.
            </Text>

            <InterventionCard
              icon="🌬️"
              title="Guided Breathing"
              desc="4-7-8, box, or slow breath patterns"
              duration="1–3 min"
              color="#AF52DE"
              onPress={() => setState("breathing_pattern")}
            />
            <InterventionCard
              icon="🌍"
              title="5-4-3-2-1 Grounding"
              desc="Engage your five senses to find calm"
              duration="~2 min"
              color="#007AFF"
              onPress={() => setState("grounding")}
            />
            <InterventionCard
              icon="🧘"
              title="Body Scan"
              desc="Progressive muscle relaxation, feet to head"
              duration="~4 min"
              color="#34C759"
              onPress={() => setState("body_scan")}
            />
            <InterventionCard
              icon="🎵"
              title="Calm Audio"
              desc="Nature sounds — rain, ocean, or forest"
              duration="1–5 min"
              color="#FF9500"
              onPress={() => setState("calm_audio")}
            />
            <InterventionCard
              icon="📝"
              title="Quick Journal"
              desc="Write one sentence about how you feel"
              duration="~1 min"
              color="#5856D6"
              onPress={() => router.push("/mental/journal-entry")}
            />
          </View>
        )}

        {/* ── Breathing pattern select ── */}
        {state === "breathing_pattern" && (
          <View className="pt-4 pb-10">
            <Text className="text-[22px] font-bold text-black tracking-tight mb-4">
              Choose a pattern
            </Text>
            {Object.entries(PATTERNS).map(([key, pattern]) => {
              const active = breathingPattern === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setBreathingPattern(key)}
                  className="mb-3"
                >
                  <GlassCard
                    className="p-4 flex-row items-center gap-3"
                    style={
                      active
                        ? { borderWidth: 2, borderColor: "#AF52DE" }
                        : undefined
                    }
                  >
                    <View className="w-10 h-10 rounded-full bg-[#AF52DE15] items-center justify-center">
                      <Text style={{ fontSize: 20 }}>🌬️</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-black">
                        {pattern.name}
                      </Text>
                      <Text className="text-[12px] text-[#8A8A8E]">
                        {pattern.phases
                          .map((p) => `${p.label} ${p.durationMs / 1000}s`)
                          .join(" · ")}
                      </Text>
                    </View>
                    {active && (
                      <Text className="text-[#AF52DE] font-bold">✓</Text>
                    )}
                  </GlassCard>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setState("breathing")}
              className="rounded-2xl py-4 items-center bg-[#AF52DE] mt-4"
            >
              <Text className="text-white text-[17px] font-semibold">
                Start
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Breathing ── */}
        {state === "breathing" && (
          <View className="pt-8 pb-10">
            <BreathingExercise
              patternKey={breathingPattern}
              durationSeconds={180}
              onComplete={(dur) => logSession("breathing", dur, true)}
            />
          </View>
        )}

        {/* ── Grounding ── */}
        {state === "grounding" && (
          <View className="pt-8 pb-10">
            <GroundingExercise
              onComplete={(dur) => logSession("grounding", dur, true)}
            />
          </View>
        )}

        {/* ── Body Scan ── */}
        {state === "body_scan" && (
          <View className="pt-8 pb-10">
            <BodyScanGuide
              onComplete={(dur) => logSession("body_scan", dur, true)}
            />
          </View>
        )}

        {/* ── Calm Audio ── */}
        {state === "calm_audio" && (
          <View className="pt-4 pb-10">
            {!audioPlaying ? (
              <>
                <Text className="text-[22px] font-bold text-black tracking-tight mb-4">
                  Choose a soundscape
                </Text>
                {AUDIO_SCENES.map((scene) => {
                  const active = audioScene === scene.id;
                  return (
                    <Pressable
                      key={scene.id}
                      onPress={() => setAudioScene(scene.id)}
                      className="mb-3"
                    >
                      <GlassCard
                        className="p-4 flex-row items-center gap-3"
                        style={
                          active
                            ? { borderWidth: 2, borderColor: "#FF9500" }
                            : undefined
                        }
                      >
                        <Text style={{ fontSize: 28 }}>{scene.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-[15px] font-bold text-black">
                            {scene.label}
                          </Text>
                          <Text className="text-[12px] text-[#8A8A8E]">
                            {scene.desc}
                          </Text>
                        </View>
                        {active && (
                          <Text className="text-[#FF9500] font-bold">✓</Text>
                        )}
                      </GlassCard>
                    </Pressable>
                  );
                })}

                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-4 mb-3">
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
                  {AUDIO_TIMERS.map((t) => {
                    const active = audioTimer === t.seconds;
                    return (
                      <View
                        key={t.seconds}
                        style={{ width: threeColCardWidth }}
                      >
                        <Pressable
                          onPress={() => setAudioTimer(t.seconds)}
                          className="py-3 rounded-xl items-center"
                          style={{
                            backgroundColor: active ? "#FF9500" : "#fff",
                            borderWidth: 1.5,
                            borderColor: active ? "#FF9500" : "#E5E5EA",
                          }}
                        >
                          <Text
                            className="text-[15px] font-bold"
                            style={{ color: active ? "#fff" : "#3C3C43" }}
                          >
                            {t.label}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                <Pressable
                  onPress={startAudio}
                  disabled={!audioScene}
                  className="rounded-2xl py-4 items-center"
                  style={{
                    backgroundColor: audioScene ? "#FF9500" : "#C6C6C8",
                  }}
                >
                  <Text className="text-white text-[17px] font-semibold">
                    Play
                  </Text>
                </Pressable>

                <Text className="text-[11px] text-[#8A8A8E] text-center mt-3">
                  Use headphones for the best experience.
                </Text>
              </>
            ) : (
              <View className="items-center pt-10">
                <Text style={{ fontSize: 64 }}>
                  {AUDIO_SCENES.find((s) => s.id === audioScene)?.icon ?? "🎵"}
                </Text>
                <Text className="text-[22px] font-bold text-black mt-4">
                  {AUDIO_SCENES.find((s) => s.id === audioScene)?.label}
                </Text>
                <Text className="text-[48px] font-bold text-[#FF9500] mt-6">
                  {Math.floor(audioTimeLeft / 60)}:
                  {(audioTimeLeft % 60).toString().padStart(2, "0")}
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mt-2 mb-8">
                  Playing...
                </Text>
                <Pressable
                  onPress={stopAudio}
                  className="w-full rounded-2xl py-4 items-center bg-[#FF3B30]"
                >
                  <Text className="text-white text-[17px] font-semibold">
                    Stop
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* ── Complete ── */}
        {state === "complete" && (
          <View className="items-center pt-10 pb-10">
            <Text style={{ fontSize: 60 }}>✅</Text>
            <Text className="text-[22px] font-bold text-black mt-4 mb-2">
              Session Complete
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-8">
              {completedType &&
                `${completedType.replace("_", " ")} · ${Math.round(completedDuration)}s`}
            </Text>

            <Pressable
              onPress={() => router.push("/mental/scan")}
              className="w-full mb-3"
            >
              <GlassCard
                className="p-4 flex-row items-center gap-3"
                style={{ borderWidth: 1.5, borderColor: "#AF52DE30" }}
              >
                <Text style={{ fontSize: 24 }}>📸</Text>
                <View className="flex-1">
                  <Text className="text-[15px] font-bold text-black">
                    Re-scan stress
                  </Text>
                  <Text className="text-[13px] text-[#8A8A8E]">
                    See if your stress improved
                  </Text>
                </View>
                <Text className="text-[#AF52DE] text-[18px]">›</Text>
              </GlassCard>
            </Pressable>

            <Pressable
              onPress={() => setState("menu")}
              className="w-full rounded-2xl py-4 items-center bg-[#AF52DE] mb-3"
            >
              <Text className="text-white text-[17px] font-semibold">
                Try Another
              </Text>
            </Pressable>

            <Pressable onPress={() => router.back()}>
              <Text className="text-[15px] text-[#AF52DE] font-medium mt-2">
                Return to Hub
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared intervention card ───────────────────────────────────────────────

function InterventionCard({
  icon,
  title,
  desc,
  duration,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  desc: string;
  duration: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mb-3">
      <GlassCard className="p-4 flex-row items-center gap-4">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: color + "15" }}
        >
          <Text style={{ fontSize: 24 }}>{icon}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[16px] font-bold text-black tracking-tight">
            {title}
          </Text>
          <Text className="text-[13px] text-[#8A8A8E] mt-0.5">{desc}</Text>
        </View>
        <View className="items-end">
          <Text className="text-[12px] text-[#8A8A8E] font-medium">
            {duration}
          </Text>
          <Text className="text-[18px]" style={{ color }}>
            ›
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}
