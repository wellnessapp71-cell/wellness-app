import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface StressMeterProps {
  stressIndex: number;   // 0–100
  heartRateBpm: number;
  signalQuality: number; // 0–1
}

const SIZE = 200;
const STROKE_WIDTH = 16;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular stress gauge with color gradient from green (low) to red (high).
 * Shows BPM in the center and stress index on the arc.
 */
export function StressMeter({ stressIndex, heartRateBpm, signalQuality }: StressMeterProps) {
  const clamped = Math.max(0, Math.min(100, stressIndex));
  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * clamped) / 100;

  const stressColor =
    clamped < 30 ? "#34C759" :
    clamped < 60 ? "#FF9500" :
    clamped < 80 ? "#FF3B30" :
    "#AF1740";

  const stressLabel =
    clamped < 30 ? "Relaxed" :
    clamped < 60 ? "Moderate" :
    clamped < 80 ? "Elevated" :
    "High";

  const qualityBadge =
    signalQuality >= 0.75 ? { label: "High confidence", color: "#34C759" } :
    signalQuality >= 0.5 ? { label: "Moderate confidence", color: "#FF9500" } :
    { label: "Low confidence", color: "#FF3B30" };

  return (
    <View className="items-center">
      <View style={{ width: SIZE, height: SIZE }}>
        <Svg width={SIZE} height={SIZE}>
          <G rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`}>
            {/* Track */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke="#E5E5EA"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Fill */}
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              stroke={stressColor}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </G>
        </Svg>
        {/* Center content */}
        <View
          className="absolute items-center justify-center"
          style={{ width: SIZE, height: SIZE }}
        >
          <Text className="text-[44px] font-bold" style={{ color: stressColor }}>
            {clamped}
          </Text>
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
            Stress Index
          </Text>
        </View>
      </View>

      {/* Label */}
      <View
        className="px-4 py-1.5 rounded-full mt-3"
        style={{ backgroundColor: stressColor + "20" }}
      >
        <Text className="text-[15px] font-bold" style={{ color: stressColor }}>
          {stressLabel}
        </Text>
      </View>

      {/* BPM + Signal quality row */}
      <View className="flex-row items-center gap-6 mt-4">
        <View className="items-center">
          <Text className="text-[28px] font-bold text-black">{heartRateBpm}</Text>
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
            BPM
          </Text>
        </View>
        <View className="w-px h-10 bg-[#E5E5EA]" />
        <View className="items-center">
          <View className="flex-row items-center gap-1.5">
            <View
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: qualityBadge.color }}
            />
            <Text className="text-[13px] font-semibold" style={{ color: qualityBadge.color }}>
              {qualityBadge.label}
            </Text>
          </View>
          <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider mt-1">
            Signal Quality
          </Text>
        </View>
      </View>
    </View>
  );
}
