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
import { Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { GlassCard } from "@/components/ui/glass-card";
import { savePracticeSession } from "@/lib/spiritual-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import { recalcSpiritualScore } from "@/lib/scoring-engine";
import { updateScores } from "@/lib/user-store";

const TEAL = "#30B0C7";
const SIZE = 220;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const DURATION_OPTIONS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
  { label: "10 min", seconds: 600 },
  { label: "15 min", seconds: 900 },
  { label: "20 min", seconds: 1200 },
];

const BACKGROUND_OPTIONS = [
  { id: "none", label: "Silence", icon: "🤫" },
  { id: "rain", label: "Rain", icon: "🌧️" },
  { id: "ocean", label: "Ocean", icon: "🌊" },
  { id: "forest", label: "Forest", icon: "🌲" },
];

type MeditationState = "setup" | "active" | "complete";

export default function SpiritualMeditationScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const twoColWidth = Math.floor((contentWidth - 12) / 2);
  const fourColWidth = Math.floor((contentWidth - 24) / 4);
  const [state, setState] = useState<MeditationState>("setup");
  const [duration, setDuration] = useState(300); // 5 min default
  const [background, setBackground] = useState("none");
  const [meditationType, setMeditationType] = useState<
    "meditation" | "silent_sitting"
  >("meditation");

  // Active state
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Progress ring
  const progressPercent = duration > 0 ? (elapsed / duration) * 100 : 0;
  const progressOffset =
    CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(100, progressPercent)) / 100;

  // Remaining time
  const remaining = Math.max(0, duration - elapsed);
  const displayMin = Math.floor(remaining / 60);
  const displaySec = remaining % 60;

  // Gentle pulse animation during meditation
  useEffect(() => {
    if (state !== "active") return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [state]);

  function startMeditation() {
    setElapsed(0);
    startRef.current = Date.now();
    setState("active");

    intervalRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(sec);
      if (sec >= duration) {
        finishSession(sec);
      }
    }, 1000);
  }

  async function finishSession(finalElapsed?: number) {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const totalMinutes = Math.max(
      1,
      Math.round((finalElapsed ?? elapsed) / 60),
    );

    const session = {
      id: `med_${Date.now().toString(36)}`,
      type: meditationType,
      contentId: background !== "none" ? background : null,
      durationMinutes: totalMinutes,
      completedAt: new Date().toISOString(),
      rating: null,
    };

    await savePracticeSession(session);

    try {
      await api.post("/spiritual/practice", session);
    } catch (err) {
      recordFailedSync("meditation practice sync", err);
    }

    try {
      const score = await recalcSpiritualScore();
      await updateScores({ spiritual: score });
    } catch (err) {
      recordFailedSync("spiritual score recalc after meditation", err);
    }

    setState("complete");
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function handleBack() {
    if (state === "active") {
      finishSession();
    } else {
      router.back();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={handleBack}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">{state === "active" ? "✕" : "‹"}</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          {state === "complete" ? "Session Complete" : "Meditation"}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* ── Setup ── */}
        {state === "setup" && (
          <View className="pt-4 pb-10">
            <Text style={{ fontSize: 48, textAlign: "center" }}>🧘</Text>
            <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4 mb-6">
              Meditation Timer
            </Text>

            {/* Type selector */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Type
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {[
                { key: "meditation" as const, label: "Guided", icon: "🎧" },
                {
                  key: "silent_sitting" as const,
                  label: "Silent Sitting",
                  icon: "🤫",
                },
              ].map((opt) => {
                const active = meditationType === opt.key;
                return (
                  <View key={opt.key} style={{ width: twoColWidth }}>
                    <Pressable
                      onPress={() => setMeditationType(opt.key)}
                      className="py-3.5 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{opt.icon}</Text>
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

            {/* Duration */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Duration
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {DURATION_OPTIONS.map((opt) => {
                const active = duration === opt.seconds;
                return (
                  <Pressable
                    key={opt.seconds}
                    onPress={() => setDuration(opt.seconds)}
                    className="py-3 rounded-xl items-center"
                    style={{
                      width: "31%",
                      backgroundColor: active ? TEAL : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? TEAL : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="text-[15px] font-bold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Background sound */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Background Sound
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {BACKGROUND_OPTIONS.map((opt) => {
                const active = background === opt.id;
                return (
                  <View key={opt.id} style={{ width: fourColWidth }}>
                    <Pressable
                      onPress={() => setBackground(opt.id)}
                      className="py-3 rounded-xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{opt.icon}</Text>
                      <Text
                        className="text-[11px] font-semibold mt-0.5"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Start */}
            <Pressable
              onPress={startMeditation}
              className="rounded-2xl py-4 items-center"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white text-[17px] font-semibold">
                Begin Meditation
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Active ── */}
        {state === "active" && (
          <View className="items-center pt-8 pb-10">
            {/* Type label */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-4">
              {meditationType === "silent_sitting"
                ? "Silent Sitting"
                : "Meditation"}
              {background !== "none"
                ? ` · ${BACKGROUND_OPTIONS.find((b) => b.id === background)?.label}`
                : ""}
            </Text>

            {/* Progress ring with pulse */}
            <Animated.View
              className="items-center justify-center mb-6"
              style={{
                width: SIZE,
                height: SIZE,
                transform: [{ scale: pulseAnim }],
              }}
            >
              <Svg width={SIZE} height={SIZE}>
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#E5E5EA"
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                />
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke={TEAL}
                  strokeWidth={STROKE_WIDTH}
                  fill="none"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  rotation="-90"
                  origin={`${SIZE / 2}, ${SIZE / 2}`}
                />
              </Svg>
              <View className="absolute items-center">
                <Text className="text-[40px] font-bold text-black">
                  {displayMin}:{displaySec.toString().padStart(2, "0")}
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mt-1">
                  remaining
                </Text>
              </View>
            </Animated.View>

            {/* Guidance text */}
            <GlassCard
              className="p-4 mb-6 w-full"
              style={{ backgroundColor: TEAL + "08" }}
            >
              <Text
                className="text-[14px] text-center leading-relaxed"
                style={{ color: TEAL }}
              >
                {meditationType === "silent_sitting"
                  ? "Sit comfortably. Let your thoughts come and go. Just be."
                  : "Close your eyes. Follow your breath in and out. Be present."}
              </Text>
            </GlassCard>

            {/* End early */}
            <Pressable
              onPress={() => finishSession()}
              className="w-full rounded-2xl py-4 items-center bg-[#FF3B30]"
            >
              <Text className="text-white text-[17px] font-semibold">
                End Session
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Complete ── */}
        {state === "complete" && (
          <View className="items-center pt-10 pb-10">
            <Text style={{ fontSize: 60 }}>🔔</Text>
            <Text className="text-[22px] font-bold text-black mt-4 mb-2">
              Meditation Complete
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] text-center mb-2">
              {Math.max(1, Math.round(elapsed / 60))} minute
              {Math.round(elapsed / 60) !== 1 ? "s" : ""} of{" "}
              {meditationType === "silent_sitting"
                ? "silent sitting"
                : "meditation"}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mb-8">
              Session logged to your practice history.
            </Text>

            <Pressable
              onPress={() => {
                setState("setup");
                setElapsed(0);
              }}
              className="w-full rounded-2xl py-4 items-center mb-3"
              style={{ backgroundColor: TEAL }}
            >
              <Text className="text-white text-[17px] font-semibold">
                Meditate Again
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
