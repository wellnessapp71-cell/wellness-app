import { View, Text, Pressable } from "react-native";
import { useState, useEffect, useRef } from "react";
import Svg, { Ellipse, Rect, Circle, Line } from "react-native-svg";

// ─── Body Zones (bottom-up) ─────────────────────────────────────────────────

const ZONES = [
  {
    id: "feet",
    label: "Feet & Toes",
    instruction: "Bring your attention to your feet. Curl your toes tightly for 5 seconds, then release.",
    durationMs: 45000,
  },
  {
    id: "legs",
    label: "Legs & Thighs",
    instruction: "Notice any tension in your calves and thighs. Tense the muscles, hold, then let go.",
    durationMs: 45000,
  },
  {
    id: "torso",
    label: "Torso & Back",
    instruction: "Feel your belly rise and fall. Notice your back against the chair. Release any tightness.",
    durationMs: 60000,
  },
  {
    id: "arms",
    label: "Arms & Hands",
    instruction: "Make fists with your hands. Squeeze tight for 5 seconds, then open and relax.",
    durationMs: 45000,
  },
  {
    id: "head",
    label: "Neck, Face & Head",
    instruction: "Relax your jaw. Unclench your teeth. Soften the muscles around your eyes and forehead.",
    durationMs: 45000,
  },
];

// Zone highlight positions (relative to SVG viewbox)
const ZONE_HIGHLIGHTS: Record<string, { cy: number; rx: number; ry: number }> = {
  feet: { cy: 270, rx: 30, ry: 18 },
  legs: { cy: 215, rx: 28, ry: 40 },
  torso: { cy: 140, rx: 35, ry: 45 },
  arms: { cy: 150, rx: 55, ry: 30 },
  head: { cy: 55, rx: 22, ry: 28 },
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface BodyScanGuideProps {
  onComplete: (durationSeconds: number) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BodyScanGuide({ onComplete }: BodyScanGuideProps) {
  const [started, setStarted] = useState(false);
  const [zoneIdx, setZoneIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const startTimeRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentZone = ZONES[zoneIdx];
  const isDone = zoneIdx >= ZONES.length;

  useEffect(() => {
    if (!started || isDone) return;

    const durSec = Math.round(currentZone.durationMs / 1000);
    setTimeLeft(durSec);

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          advance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, zoneIdx]);

  function start() {
    setStarted(true);
    setZoneIdx(0);
    startTimeRef.current = Date.now();
  }

  function advance() {
    if (timerRef.current) clearInterval(timerRef.current);
    const nextIdx = zoneIdx + 1;
    if (nextIdx >= ZONES.length) {
      setZoneIdx(ZONES.length);
      onComplete(Math.round((Date.now() - startTimeRef.current) / 1000));
    } else {
      setZoneIdx(nextIdx);
    }
  }

  if (!started) {
    return (
      <View className="items-center">
        <Text style={{ fontSize: 48 }}>🧘</Text>
        <Text className="text-[22px] font-bold text-black text-center mt-4 mb-2">
          Body Scan Relaxation
        </Text>
        <Text className="text-[15px] text-[#8A8A8E] text-center mb-8 leading-relaxed px-4">
          Progressive muscle awareness from feet to head. Release tension stored in your body. Takes about 4 minutes.
        </Text>
        <Pressable
          onPress={start}
          className="w-full rounded-2xl py-4 items-center bg-[#AF52DE]"
        >
          <Text className="text-white text-[17px] font-semibold">Begin Body Scan</Text>
        </Pressable>
      </View>
    );
  }

  if (isDone) {
    return (
      <View className="items-center py-8">
        <Text style={{ fontSize: 48 }}>🌟</Text>
        <Text className="text-[22px] font-bold text-black text-center mt-4 mb-2">
          Scan Complete
        </Text>
        <Text className="text-[15px] text-[#8A8A8E] text-center leading-relaxed px-4">
          Your whole body is relaxed. Carry this feeling with you.
        </Text>
      </View>
    );
  }

  const highlight = ZONE_HIGHLIGHTS[currentZone.id];

  return (
    <View className="items-center">
      {/* Progress */}
      <View className="flex-row gap-2 mb-4">
        {ZONES.map((z, i) => (
          <View
            key={z.id}
            className="flex-1 h-1 rounded-full"
            style={{ backgroundColor: i <= zoneIdx ? "#AF52DE" : "#E5E5EA" }}
          />
        ))}
      </View>

      {/* Body outline with highlight */}
      <View className="mb-4" style={{ width: 140, height: 300 }}>
        <Svg viewBox="0 0 140 300" width={140} height={300}>
          {/* Simple body silhouette */}
          {/* Head */}
          <Circle cx={70} cy={45} r={24} fill="#E5E5EA" />
          {/* Neck */}
          <Rect x={62} y={69} width={16} height={14} fill="#E5E5EA" rx={4} />
          {/* Torso */}
          <Ellipse cx={70} cy={140} rx={38} ry={52} fill="#E5E5EA" />
          {/* Left arm */}
          <Rect x={18} y={100} width={14} height={70} fill="#E5E5EA" rx={7} />
          {/* Right arm */}
          <Rect x={108} y={100} width={14} height={70} fill="#E5E5EA" rx={7} />
          {/* Left leg */}
          <Rect x={44} y={188} width={16} height={80} fill="#E5E5EA" rx={8} />
          {/* Right leg */}
          <Rect x={80} y={188} width={16} height={80} fill="#E5E5EA" rx={8} />
          {/* Feet */}
          <Ellipse cx={52} cy={274} rx={14} ry={8} fill="#E5E5EA" />
          <Ellipse cx={88} cy={274} rx={14} ry={8} fill="#E5E5EA" />

          {/* Active zone highlight */}
          {highlight && (
            <Ellipse
              cx={70}
              cy={highlight.cy}
              rx={highlight.rx}
              ry={highlight.ry}
              fill="#AF52DE30"
              stroke="#AF52DE"
              strokeWidth={2}
            />
          )}
        </Svg>
      </View>

      {/* Zone label */}
      <Text className="text-[20px] font-bold text-[#AF52DE] mb-2">
        {currentZone.label}
      </Text>

      {/* Instruction */}
      <Text className="text-[15px] text-[#3C3C43] text-center leading-relaxed px-4 mb-4">
        {currentZone.instruction}
      </Text>

      {/* Timer */}
      <Text className="text-[13px] text-[#8A8A8E] mb-6">
        {timeLeft}s remaining · Step {zoneIdx + 1}/{ZONES.length}
      </Text>

      {/* Manual advance */}
      <Pressable
        onPress={advance}
        className="w-full rounded-2xl py-4 items-center bg-[#AF52DE]"
      >
        <Text className="text-white text-[17px] font-semibold">
          {zoneIdx === ZONES.length - 1 ? "Finish" : "Next Zone"}
        </Text>
      </Pressable>
    </View>
  );
}
