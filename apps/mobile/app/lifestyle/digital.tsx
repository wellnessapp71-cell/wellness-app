import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getDigitalLogs,
  getLifestyleBaseline,
  getLifestyleCheckIns,
} from "@/lib/lifestyle-store";
import type { DigitalBalanceLog, LifestyleBaseline } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Smartphone,
  Sunset,
  Focus,
  Moon,
  Plus,
} from "lucide-react-native";

const THEME = "#AF52DE";

export default function DigitalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [avgScreenHours, setAvgScreenHours] = useState(0);
  const [avgBedtimeScreen, setAvgBedtimeScreen] = useState(0);
  const [recentLogs, setRecentLogs] = useState<DigitalBalanceLog[]>([]);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        const logs = await getDigitalLogs();
        setRecentLogs(logs.slice(-14).reverse());

        const checkIns = await getLifestyleCheckIns();
        const recent = checkIns.slice(-7);
        if (recent.length > 0) {
          setAvgScreenHours(
            Math.round(
              (recent.reduce((s, c) => s + c.screenHoursNonWork, 0) /
                recent.length) *
                10,
            ) / 10,
          );
        }

        const recentDigital = logs.slice(-7);
        if (recentDigital.length > 0) {
          setAvgBedtimeScreen(
            Math.round(
              recentDigital.reduce((s, l) => s + l.bedtimeScreenMinutes, 0) /
                recentDigital.length,
            ),
          );
        }
      })();
    }, []),
  );

  const scoreColor =
    (baseline?.digitalScore ?? 0) >= 80
      ? "#34C759"
      : (baseline?.digitalScore ?? 0) >= 60
        ? "#FFCC00"
        : (baseline?.digitalScore ?? 0) >= 40
          ? "#FF9500"
          : "#FF3B30";

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFAFC]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.duration(800).springify()}
          className="pt-6 flex-row items-center justify-between mb-8"
        >
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </Pressable>
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">
            Digital Balance
          </Text>
          <View className="w-10" />
        </Animated.View>

        {/* Score */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <View
              className="w-14 h-14 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: THEME + "15" }}
            >
              <Smartphone size={28} color={THEME} strokeWidth={2} />
            </View>
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Digital Score
            </Text>
            <Text
              className="text-[48px] font-bold tracking-tighter"
              style={{ color: scoreColor }}
            >
              {baseline?.digitalScore ?? "—"}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Stats */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            This Week
          </Text>
          <View className="flex-row gap-3 justify-between">
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Smartphone size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {avgScreenHours}h
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Avg Screen
                </Text>
              </GlassCard>
            </View>
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                <Moon size={20} color="#FF3B30" strokeWidth={2} />
                <Text className="text-[24px] font-bold text-[#1C1C1E] mt-2">
                  {avgBedtimeScreen}m
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1">
                  Bed Screen
                </Text>
              </GlassCard>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Actions
          </Text>
          <View className="gap-3">
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: "#FF9500" }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#FF950015" }}
              >
                <Sunset size={22} color="#FF9500" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Digital Sunset
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Screen-free hour before bed
                </Text>
              </View>
            </GlassCard>
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: "#007AFF" }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#007AFF15" }}
              >
                <Focus size={22} color="#007AFF" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Focus Mode
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  Block notifications during work
                </Text>
              </View>
            </GlassCard>
            <GlassCard
              className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 3, borderLeftColor: "#5856D6" }}
            >
              <View
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "#5856D615" }}
              >
                <Moon size={22} color="#5856D6" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#1C1C1E]">
                  Bedtime Lock
                </Text>
                <Text className="text-[13px] text-[#8A8A8E]">
                  No screens 30 min before sleep
                </Text>
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* Prompt */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard
            className="p-5 border border-black/5 bg-white/60"
            style={{ borderLeftWidth: 3, borderLeftColor: "#FF3B30" }}
          >
            <Text className="text-[14px] font-bold text-[#1C1C1E] mb-1">
              Self-reflection
            </Text>
            <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
              Did screen use affect your sleep or mood recently? Awareness is
              the first step.
            </Text>
          </GlassCard>
        </Animated.View>

        {/* Premium */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(800).springify()}
        >
          <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
            <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Premium
            </Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">
              Deeper Pattern Analysis
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
              Screen time vs sleep quality correlations and personalised limits
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
