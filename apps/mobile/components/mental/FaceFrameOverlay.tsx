import { View, Text, Dimensions } from "react-native";
import Svg, { Rect, Defs, Mask, Circle, Ellipse } from "react-native-svg";

interface FaceFrameOverlayProps {
  scanning: boolean;
  signalQuality: number;  // 0–1
  countdown: number;       // seconds remaining
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const FRAME_SIZE = SCREEN_WIDTH * 0.65;

/**
 * Camera overlay with face position guide.
 * Shows an oval face frame, pulsing border when signal is locked,
 * and a countdown timer.
 */
export function FaceFrameOverlay({ scanning, signalQuality, countdown }: FaceFrameOverlayProps) {
  const borderColor =
    !scanning ? "#ffffff50" :
    signalQuality >= 0.5 ? "#34C759" :
    signalQuality >= 0.25 ? "#FF9500" :
    "#FF3B30";

  return (
    <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
      {/* Dark vignette mask around the face oval */}
      <Svg width={SCREEN_WIDTH} height={SCREEN_WIDTH * 1.3} className="absolute">
        <Defs>
          <Mask id="faceMask">
            <Rect width="100%" height="100%" fill="white" />
            <Ellipse
              cx={SCREEN_WIDTH / 2}
              cy={(SCREEN_WIDTH * 1.3) / 2}
              rx={FRAME_SIZE / 2}
              ry={FRAME_SIZE * 0.65}
              fill="black"
            />
          </Mask>
        </Defs>
        <Rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#faceMask)"
        />
        {/* Face oval border */}
        <Ellipse
          cx={SCREEN_WIDTH / 2}
          cy={(SCREEN_WIDTH * 1.3) / 2}
          rx={FRAME_SIZE / 2}
          ry={FRAME_SIZE * 0.65}
          stroke={borderColor}
          strokeWidth={3}
          fill="none"
          strokeDasharray={scanning && signalQuality >= 0.5 ? "0" : "8 6"}
        />
      </Svg>

      {/* Guide text */}
      {!scanning && (
        <View className="absolute bottom-20 items-center">
          <Text className="text-white/80 text-[15px] font-medium text-center">
            Position your face within the oval
          </Text>
        </View>
      )}

      {/* Countdown timer during scan */}
      {scanning && countdown > 0 && (
        <View className="absolute bottom-20 items-center">
          <View className="bg-black/60 px-5 py-2 rounded-full">
            <Text className="text-white text-[20px] font-bold">
              {countdown}s
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
