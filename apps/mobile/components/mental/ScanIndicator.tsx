import { View, Text } from "react-native";

interface ScanIndicatorProps {
  signalQuality: number;  // 0.0–1.0
  sampleCount: number;
  targetSamples: number;
}

/**
 * Real-time signal quality indicator during rPPG scan.
 * Shows signal bars (like cell signal) + progress.
 */
export function ScanIndicator({ signalQuality, sampleCount, targetSamples }: ScanIndicatorProps) {
  const bars = Math.min(4, Math.floor(signalQuality * 5));
  const progress = Math.min(100, Math.round((sampleCount / targetSamples) * 100));

  const qualityLabel =
    signalQuality >= 0.75 ? "Excellent" :
    signalQuality >= 0.5 ? "Good" :
    signalQuality >= 0.25 ? "Fair" :
    "Weak";

  const qualityColor =
    signalQuality >= 0.75 ? "#34C759" :
    signalQuality >= 0.5 ? "#FF9500" :
    "#FF3B30";

  return (
    <View className="flex-row items-center gap-3">
      {/* Signal bars */}
      <View className="flex-row items-end gap-0.5">
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            className="rounded-sm"
            style={{
              width: 4,
              height: 6 + level * 4,
              backgroundColor: level <= bars ? qualityColor : "#ffffff30",
            }}
          />
        ))}
      </View>

      {/* Quality label */}
      <Text className="text-[12px] font-semibold" style={{ color: qualityColor }}>
        {qualityLabel}
      </Text>

      {/* Divider */}
      <View className="w-px h-4 bg-white/20" />

      {/* Progress */}
      <Text className="text-[12px] font-medium text-white/70">
        {progress}%
      </Text>
    </View>
  );
}
