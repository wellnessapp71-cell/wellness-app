import { View, Text, Pressable } from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Animated, Easing } from "react-native";

// ─── Breathing Patterns ─────────────────────────────────────────────────────

export interface BreathingPattern {
  name: string;
  phases: { label: string; durationMs: number }[];
}

export const PATTERNS: Record<string, BreathingPattern> = {
  "4-7-8": {
    name: "4-7-8 Relaxing",
    phases: [
      { label: "Inhale", durationMs: 4000 },
      { label: "Hold", durationMs: 7000 },
      { label: "Exhale", durationMs: 8000 },
      { label: "Pause", durationMs: 2000 },
    ],
  },
  box: {
    name: "Box Breathing",
    phases: [
      { label: "Inhale", durationMs: 4000 },
      { label: "Hold", durationMs: 4000 },
      { label: "Exhale", durationMs: 4000 },
      { label: "Hold", durationMs: 4000 },
    ],
  },
  slow: {
    name: "Slow Breath",
    phases: [
      { label: "Inhale", durationMs: 4000 },
      { label: "Hold", durationMs: 4000 },
      { label: "Exhale", durationMs: 6000 },
      { label: "Pause", durationMs: 2000 },
    ],
  },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BreathingExerciseProps {
  patternKey?: keyof typeof PATTERNS;
  durationSeconds?: number; // total exercise time
  onComplete: (durationSeconds: number) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BreathingExercise({
  patternKey = "4-7-8",
  durationSeconds = 180,
  onComplete,
}: BreathingExerciseProps) {
  const pattern = PATTERNS[patternKey] ?? PATTERNS["4-7-8"];
  const [running, setRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const scale = useRef(new Animated.Value(0.5)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const currentPhase = pattern.phases[phaseIdx];
  const isExpanding = currentPhase.label === "Inhale";
  const isContracting = currentPhase.label === "Exhale";

  const advancePhase = useCallback(() => {
    setPhaseIdx((prev) => {
      const next = (prev + 1) % pattern.phases.length;
      if (next === 0) setCycleCount((c) => c + 1);
      return next;
    });
  }, [pattern.phases.length]);

  // Animate circle for current phase
  useEffect(() => {
    if (!running) return;

    const targetScale = isExpanding ? 1 : isContracting ? 0.5 : 0.75;

    Animated.timing(scale, {
      toValue: targetScale,
      duration: currentPhase.durationMs,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();

    timerRef.current = setTimeout(advancePhase, currentPhase.durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [running, phaseIdx]);

  // Elapsed timer + auto-finish
  useEffect(() => {
    if (!running) return;

    startTimeRef.current = Date.now();
    elapsedRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(sec);
      if (sec >= durationSeconds) {
        stop(sec);
      }
    }, 1000);

    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [running, durationSeconds]);

  function start() {
    setPhaseIdx(0);
    setCycleCount(0);
    setElapsed(0);
    scale.setValue(0.5);
    setRunning(true);
  }

  function stop(finalElapsed?: number) {
    setRunning(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    onComplete(finalElapsed ?? elapsed);
  }

  const remaining = Math.max(0, durationSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <View className="items-center">
      {/* Timer */}
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
        {pattern.name}
      </Text>
      <Text className="text-[32px] font-bold text-black mb-6">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </Text>

      {/* Breathing circle */}
      <View
        className="items-center justify-center mb-6"
        style={{ width: 220, height: 220 }}
      >
        <Animated.View
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: "#AF52DE20",
            borderWidth: 3,
            borderColor: "#AF52DE",
            transform: [{ scale }],
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-[22px] font-bold text-[#AF52DE]">
            {running ? currentPhase.label : "Ready"}
          </Text>
        </Animated.View>
      </View>

      {/* Cycle count */}
      {running && (
        <Text className="text-[13px] text-[#8A8A8E] mb-6">
          Cycle {cycleCount + 1}
        </Text>
      )}

      {/* Controls */}
      {!running ? (
        <Pressable
          onPress={start}
          className="w-full rounded-2xl py-4 items-center bg-[#AF52DE]"
        >
          <Text className="text-white text-[17px] font-semibold">
            Start Breathing
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => stop()}
          className="w-full rounded-2xl py-4 items-center bg-[#FF3B30]"
        >
          <Text className="text-white text-[17px] font-semibold">
            End Early
          </Text>
        </Pressable>
      )}
    </View>
  );
}
