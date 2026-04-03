import { View, Text } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

const SIZE = 180;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface MentalScoreRingProps {
  score: number;         // 0–100
  previousScore?: number; // for delta indicator
}

export function MentalScoreRing({ score, previousScore }: MentalScoreRingProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const offset = CIRCUMFERENCE - (CIRCUMFERENCE * Math.min(100, Math.max(0, score))) / 100;
  const delta = previousScore != null ? score - previousScore : null;

  // Color gradient based on score
  const ringColor =
    score >= 70 ? "#34C759" :
    score >= 40 ? "#FF9500" :
    "#FF3B30";

  return (
    <View className="items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <Svg width={SIZE} height={SIZE}>
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
          stroke={ringColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View className="absolute items-center">
        <Text className="text-[40px] font-bold text-black">{score}</Text>
        <Text className="text-[11px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
          Mental Score
        </Text>
        {delta != null && delta !== 0 && (
          <Text
            className="text-[13px] font-semibold mt-1"
            style={{ color: delta > 0 ? "#34C759" : "#FF3B30" }}
          >
            {delta > 0 ? `+${delta} ↑` : `${delta} ↓`}
          </Text>
        )}
      </View>
    </View>
  );
}
