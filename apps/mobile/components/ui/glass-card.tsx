import type { ReactNode } from "react";
import {
  View,
  Pressable,
  Animated,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { useRef, useCallback } from "react";

type GlassCardProps = ViewProps & {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

/**
 * Premium glass-morphism card component.
 *
 * Uses React Native's built-in Animated API for the press scale effect
 * instead of Reanimated worklets — avoids the Babel plugin version
 * mismatch that was crashing the entire render tree.
 */
export function GlassCard({
  children,
  className = "",
  style,
  onPress,
  ...props
}: GlassCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      friction: 8,
      tension: 200,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 200,
    }).start();
  }, [scaleAnim]);

  const cardStyle: ViewStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  const CardContent = (
    <View
      className={`bg-white/95 rounded-[24px] border border-black/[0.04] overflow-hidden ${className}`}
      style={[cardStyle, style]}
      {...props}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {CardContent}
        </Animated.View>
      </Pressable>
    );
  }

  return CardContent;
}
