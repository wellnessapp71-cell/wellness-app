import { View, Text, Pressable, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import Svg, { Path as SvgPath, Text as SvgText } from "react-native-svg";
import { getProfile } from "@/lib/user-store";

const PILLARS = [
  { key: "scorePhysical", label: "Physical", color: "#007AFF", icon: "💪" },
  { key: "scoreMental", label: "Mental", color: "#AF52DE", icon: "🧠" },
  { key: "scoreSpiritual", label: "Spiritual", color: "#30B0C7", icon: "🧘" },
  { key: "scoreLifestyle", label: "Lifestyle", color: "#FF9500", icon: "🌿" },
] as const;

type ScoreKey = (typeof PILLARS)[number]["key"];

function AnimatedScore({ target, color }: { target: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: target,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      delay: 300,
    }).start();
    const id = anim.addListener(({ value }) => setDisplay(Math.round(value)));
    return () => anim.removeListener(id);
  }, [target]);

  return (
    <Text className="text-[28px] font-bold" style={{ color }}>
      {display}
    </Text>
  );
}

export default function ScoringScreen() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    scorePhysical: 0,
    scoreMental: 0,
    scoreSpiritual: 0,
    scoreLifestyle: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const profile = await getProfile();
      if (profile) {
        setScores({
          scorePhysical: profile.scorePhysical,
          scoreMental: profile.scoreMental,
          scoreSpiritual: profile.scoreSpiritual,
          scoreLifestyle: profile.scoreLifestyle,
        });
      }
    })();
  }, []);

  async function handleGetStarted() {
    setLoading(true);
    router.replace("/(tabs)/dashboard");
  }

  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 100;
  const innerR = 22;
  const gapAngle = 0.05;
  const total = PILLARS.length;

  function describeSegment(
    index: number,
    fillRatio: number,
    radius: number,
  ): string {
    const sliceAngle = (2 * Math.PI) / total;
    const startAngle = index * sliceAngle - Math.PI / 2 + gapAngle / 2;
    const endAngle = startAngle + sliceAngle - gapAngle;
    const fillR = fillRatio < 1 ? innerR + (radius - innerR) * fillRatio : radius;

    const cos = Math.cos;
    const sin = Math.sin;
    const x1 = cx + fillR * cos(startAngle);
    const y1 = cy + fillR * sin(startAngle);
    const x2 = cx + fillR * cos(endAngle);
    const y2 = cy + fillR * sin(endAngle);
    const xi1 = cx + innerR * cos(startAngle);
    const yi1 = cy + innerR * sin(startAngle);
    const xi2 = cx + innerR * cos(endAngle);
    const yi2 = cy + innerR * sin(endAngle);
    return `M ${xi1} ${yi1} L ${x1} ${y1} A ${fillR} ${fillR} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 0 0 ${xi1} ${yi1} Z`;
  }

  const overall = Math.round(
    (scores.scorePhysical +
      scores.scoreMental +
      scores.scoreSpiritual +
      scores.scoreLifestyle) /
      4,
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <View className="flex-1 px-6 pt-6">
        <Text className="text-[34px] font-bold text-black tracking-tight leading-tight mb-1">
          Your Baseline
        </Text>
        <Text className="text-[17px] text-[#8A8A8E] font-medium mb-8">
          Here's your initial wellness profile.
        </Text>

        {/* Wellness Wheel */}
        <View className="items-center mb-8">
          <Svg width={size} height={size}>
            {/* Track rings */}
            {PILLARS.map((pillar, i) => (
              <SvgPath
                key={`track-${i}`}
                d={describeSegment(i, 1, outerR)}
                fill={pillar.color + "20"}
              />
            ))}
            {/* Fill segments */}
            {PILLARS.map((pillar, i) => (
              <SvgPath
                key={`fill-${i}`}
                d={describeSegment(i, scores[pillar.key] / 100, outerR)}
                fill={pillar.color}
              />
            ))}
            {/* Labels */}
            {PILLARS.map((pillar, i) => {
              const sliceAngle = (2 * Math.PI) / total;
              const midAngle = i * sliceAngle - Math.PI / 2 + sliceAngle / 2;
              const labelR = outerR + 20;
              const lx = cx + labelR * Math.cos(midAngle);
              const ly = cy + labelR * Math.sin(midAngle);
              return (
                <SvgText
                  key={`label-${i}`}
                  x={lx}
                  y={ly + 4}
                  textAnchor="middle"
                  fill={pillar.color}
                  fontSize={11}
                  fontWeight="700"
                >
                  {pillar.label}
                </SvgText>
              );
            })}
          </Svg>
          <View
            className="absolute items-center justify-center"
            style={{ width: size, height: size }}
          >
            <Text className="text-[32px] font-bold text-black">{overall}</Text>
            <Text className="text-[12px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
              Overall
            </Text>
          </View>
        </View>

        {/* Pillar score grid */}
        <View className="flex-row flex-wrap gap-3 mb-8">
          {PILLARS.map((pillar) => (
            <View
              key={pillar.key}
              className="flex-1 bg-white rounded-2xl p-4"
              style={{
                minWidth: "45%",
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text className="text-[20px] mb-1">{pillar.icon}</Text>
              <Text className="text-[13px] font-semibold text-[#8A8A8E] mb-0.5">
                {pillar.label}
              </Text>
              <AnimatedScore target={scores[pillar.key]} color={pillar.color} />
            </View>
          ))}
        </View>

        <View className="flex-1" />

        <Text className="text-[13px] text-[#8A8A8E] text-center mb-4 leading-relaxed">
          Scores update as you complete each section's detailed assessment.
        </Text>

        <Pressable
          onPress={handleGetStarted}
          disabled={loading}
          className="mb-6 rounded-2xl py-4 items-center"
          style={{ backgroundColor: loading ? "#C6C6C8" : "#007AFF" }}
        >
          <Text className="text-white text-[17px] font-semibold">
            Get Started
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
