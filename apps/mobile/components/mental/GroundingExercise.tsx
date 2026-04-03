import { View, Text, Pressable } from "react-native";
import { useState, useEffect, useRef } from "react";

// ─── 5-4-3-2-1 Grounding Steps ─────────────────────────────────────────────

const STEPS = [
  { count: 5, sense: "see", icon: "👁️", prompt: "Name 5 things you can see around you." },
  { count: 4, sense: "touch", icon: "✋", prompt: "Name 4 things you can touch right now." },
  { count: 3, sense: "hear", icon: "👂", prompt: "Name 3 things you can hear." },
  { count: 2, sense: "smell", icon: "👃", prompt: "Name 2 things you can smell." },
  { count: 1, sense: "taste", icon: "👅", prompt: "Name 1 thing you can taste." },
];

const AUTO_ADVANCE_MS = 15000; // 15 seconds per step

// ─── Props ──────────────────────────────────────────────────────────────────

interface GroundingExerciseProps {
  onComplete: (durationSeconds: number) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GroundingExercise({ onComplete }: GroundingExerciseProps) {
  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(AUTO_ADVANCE_MS / 1000);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;
  const isDone = stepIdx >= STEPS.length;

  useEffect(() => {
    if (!started || isDone) return;

    setTimeLeft(AUTO_ADVANCE_MS / 1000);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          advance();
          return AUTO_ADVANCE_MS / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, stepIdx]);

  function start() {
    setStarted(true);
    setStepIdx(0);
    startTimeRef.current = Date.now();
  }

  function advance() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isLast) {
      setStepIdx(STEPS.length); // done
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
      onComplete(elapsed);
    } else {
      setStepIdx((prev) => prev + 1);
    }
  }

  if (!started) {
    return (
      <View className="items-center">
        <Text style={{ fontSize: 48 }}>🌍</Text>
        <Text className="text-[22px] font-bold text-black text-center mt-4 mb-2">
          5-4-3-2-1 Grounding
        </Text>
        <Text className="text-[15px] text-[#8A8A8E] text-center mb-8 leading-relaxed px-4">
          Engage your five senses to anchor yourself in the present moment and interrupt anxious thought loops.
        </Text>
        <Pressable
          onPress={start}
          className="w-full rounded-2xl py-4 items-center bg-[#AF52DE]"
        >
          <Text className="text-white text-[17px] font-semibold">Begin Grounding</Text>
        </Pressable>
      </View>
    );
  }

  if (isDone) {
    return (
      <View className="items-center py-8">
        <Text style={{ fontSize: 48 }}>✨</Text>
        <Text className="text-[22px] font-bold text-black text-center mt-4 mb-2">
          Well done
        </Text>
        <Text className="text-[15px] text-[#8A8A8E] text-center leading-relaxed px-4">
          You've completed the grounding exercise. You are here. You are safe.
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center">
      {/* Progress dots */}
      <View className="flex-row gap-2 mb-6">
        {STEPS.map((_, i) => (
          <View
            key={i}
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: i <= stepIdx ? "#AF52DE" : "#E5E5EA" }}
          />
        ))}
      </View>

      {/* Step indicator */}
      <Text style={{ fontSize: 56 }}>{currentStep.icon}</Text>
      <Text className="text-[48px] font-bold text-[#AF52DE] mt-2">
        {currentStep.count}
      </Text>
      <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-4">
        Things you can {currentStep.sense}
      </Text>

      {/* Prompt */}
      <Text className="text-[17px] text-[#3C3C43] text-center leading-relaxed px-4 mb-6">
        {currentStep.prompt}
      </Text>

      {/* Timer */}
      <Text className="text-[13px] text-[#8A8A8E] mb-6">
        Auto-advances in {timeLeft}s
      </Text>

      {/* Manual advance */}
      <Pressable
        onPress={advance}
        className="w-full rounded-2xl py-4 items-center bg-[#AF52DE]"
      >
        <Text className="text-white text-[17px] font-semibold">
          {isLast ? "Finish" : "Next Sense"}
        </Text>
      </Pressable>
    </View>
  );
}
