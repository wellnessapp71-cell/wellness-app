import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getLifestyleBaseline,
  getLifestyleCheckIns,
  getWeeklyReviews,
} from "@/lib/lifestyle-store";
import {
  analyzeLifestyleTrends,
  countCheckInDays,
  generateCoachMessage,
  generateDomainCoachMessage,
} from "@aura/lifestyle-engine";
import type { LifestyleTrendAnalysis, FieldTrend, TrendDirection } from "@aura/lifestyle-engine";
import type { LifestyleBaseline, LifestyleWeeklyReview } from "@aura/types";
import { LIFESTYLE_DOMAIN_LABELS, type LifestyleDomain } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  BarChart2,
  CalendarDays,
  AlertTriangle,
  Moon,
  Droplets,
  Utensils,
  Footprints,
  Smartphone,
  Leaf,
  Activity,
} from "lucide-react-native";

const THEME = "#AF52DE";

const TREND_CONFIG: Record<TrendDirection, { icon: any; color: string; label: string }> = {
  improving: { icon: TrendingUp, color: "#34C759", label: "Improving" },
  stable: { icon: Minus, color: "#8A8A8E", label: "Stable" },
  declining: { icon: TrendingDown, color: "#FF3B30", label: "Declining" },
};

const FIELD_ICONS: Record<string, any> = {
  "Sleep Hours": Moon,
  "Sleep Quality": Moon,
  "Fruit & Veg": Utensils,
  "Water Intake": Droplets,
  "Screen Time": Smartphone,
};

export default function InsightsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [trends7, setTrends7] = useState<LifestyleTrendAnalysis | null>(null);
  const [trends30, setTrends30] = useState<LifestyleTrendAnalysis | null>(null);
  const [checkInCount, setCheckInCount] = useState(0);
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [coachTip, setCoachTip] = useState("");
  const [weeklyScores, setWeeklyScores] = useState<{ week: string; change: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const bl = await getLifestyleBaseline();
        setBaseline(bl);

        const checkIns = await getLifestyleCheckIns();
        setTotalCheckIns(checkIns.length);
        setCheckInCount(countCheckInDays(checkIns, 7));

        if (checkIns.length >= 3) {
          setTrends7(analyzeLifestyleTrends(checkIns, 7));
          setTrends30(analyzeLifestyleTrends(checkIns, 30));
        }

        // Weekly score trend from saved reviews
        const reviews = await getWeeklyReviews();
        setWeeklyScores(
          reviews.slice(-8).map((r) => ({
            week: r.weekStart.slice(5),
            change: r.scoreChange,
          })),
        );

        // Domain coach tip for weakest area
        if (bl) {
          try {
            const msg = generateCoachMessage(bl);
            setCoachTip(msg.text);
          } catch {}
        }
      })();
    }, []),
  );

  const activeTrends = trends7?.fields ?? [];
  const blockers = trends7?.topBlockers ?? [];

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top", "left", "right"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(800).springify()} className="pt-6 flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
          >
            <ChevronLeft size={24} color="#1C1C1E" />
          </Pressable>
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Insights</Text>
          <View className="w-10" />
        </Animated.View>

        {/* Engagement Stat */}
        <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-8">
          <GlassCard className="p-5 items-center border border-black/5 bg-white/60">
            <View className="flex-row items-center gap-3">
              <View className="items-center">
                <CalendarDays size={20} color={THEME} strokeWidth={2} />
                <Text className="text-[36px] font-bold text-[#1C1C1E] tracking-tighter mt-1">
                  {checkInCount}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider">
                  This week
                </Text>
              </View>
              <View className="w-px h-16 bg-black/5 mx-4" />
              <View className="items-center">
                <Activity size={20} color="#FF9500" strokeWidth={2} />
                <Text className="text-[36px] font-bold text-[#1C1C1E] tracking-tighter mt-1">
                  {totalCheckIns}
                </Text>
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider">
                  All time
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {activeTrends.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(150).duration(800).springify()}>
            <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
              <BarChart2 size={32} color="#8A8A8E" strokeWidth={1.5} />
              <Text className="text-[16px] font-bold text-[#1C1C1E] mt-4 mb-2">
                Not Enough Data
              </Text>
              <Text className="text-[14px] text-[#8A8A8E] text-center leading-relaxed">
                Complete at least 3 daily check-ins to see trend analysis and insights.
              </Text>
            </GlassCard>
          </Animated.View>
        ) : (
          <>
            {/* 7-Day Trends */}
            <Animated.View entering={FadeInDown.delay(150).duration(800).springify()} className="mb-8">
              <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                7-Day Trends
              </Text>
              <View className="gap-2">
                {activeTrends.map((trend) => {
                  const config = TREND_CONFIG[trend.direction];
                  const TrendIcon = config.icon;
                  const FieldIcon = FIELD_ICONS[trend.field] ?? Activity;
                  return (
                    <GlassCard
                      key={trend.field}
                      className="p-4 flex-row items-center gap-3 border border-black/5 bg-white/60"
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: config.color + "15" }}
                      >
                        <FieldIcon size={20} color={config.color} strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-[#1C1C1E]">{trend.field}</Text>
                        <Text className="text-[12px] text-[#8A8A8E]">
                          Avg: {trend.average}
                          {trend.changePercent !== 0 && (
                            <Text> · {trend.changePercent > 0 ? "+" : ""}{trend.changePercent}%</Text>
                          )}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <TrendIcon size={16} color={config.color} strokeWidth={2.5} />
                        <Text className="text-[12px] font-bold" style={{ color: config.color }}>
                          {config.label}
                        </Text>
                      </View>
                    </GlassCard>
                  );
                })}
              </View>
            </Animated.View>

            {/* 30-Day Trends */}
            {trends30 && trends30.fields.length > 0 && (
              <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="mb-8">
                <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                  30-Day Trends
                </Text>
                <View className="gap-2">
                  {trends30.fields.map((trend) => {
                    const config = TREND_CONFIG[trend.direction];
                    const TrendIcon = config.icon;
                    return (
                      <GlassCard
                        key={trend.field}
                        className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                      >
                        <View className="flex-1">
                          <Text className="text-[14px] font-bold text-[#1C1C1E]">{trend.field}</Text>
                          <Text className="text-[11px] text-[#8A8A8E]">Avg: {trend.average}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <TrendIcon size={14} color={config.color} strokeWidth={2.5} />
                          <Text className="text-[11px] font-bold" style={{ color: config.color }}>
                            {config.label}
                          </Text>
                        </View>
                      </GlassCard>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Top Blockers */}
            {blockers.length > 0 && (
              <Animated.View entering={FadeInDown.delay(250).duration(800).springify()} className="mb-8">
                <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                  Top Blockers
                </Text>
                <View className="gap-2">
                  {blockers.map((b, i) => (
                    <GlassCard
                      key={b.tag}
                      className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                      style={i === 0 ? { borderLeftWidth: 3, borderLeftColor: "#FF9500" } : undefined}
                    >
                      <AlertTriangle size={16} color="#FF9500" strokeWidth={2} />
                      <Text className="text-[14px] font-bold text-[#1C1C1E] capitalize flex-1">
                        {b.tag.replace(/_/g, " ")}
                      </Text>
                      <Text className="text-[14px] font-bold text-[#FF9500]">{b.count}x</Text>
                    </GlassCard>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Weekly Score Trend */}
            {weeklyScores.length > 1 && (
              <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} className="mb-8">
                <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                  Score History
                </Text>
                <GlassCard className="p-4 border border-black/5 bg-white/60">
                  <View className="flex-row items-end gap-2 h-20">
                    {weeklyScores.map((w, i) => {
                      const absChange = Math.abs(w.change);
                      const barH = Math.max(8, Math.min(80, absChange * 4));
                      const barColor = w.change >= 0 ? "#34C759" : "#FF3B30";
                      return (
                        <View key={i} className="flex-1 items-center">
                          <Text className="text-[9px] font-bold mb-1" style={{ color: barColor }}>
                            {w.change >= 0 ? "+" : ""}{w.change}
                          </Text>
                          <View
                            className="w-full rounded-t-sm"
                            style={{ height: barH, backgroundColor: barColor }}
                          />
                        </View>
                      );
                    })}
                  </View>
                  <View className="flex-row justify-between mt-2">
                    {weeklyScores.map((w, i) => (
                      <Text key={i} className="text-[8px] text-[#8A8A8E] font-bold flex-1 text-center">
                        {w.week}
                      </Text>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>
            )}

            {/* Coach Tip */}
            {coachTip ? (
              <Animated.View entering={FadeInDown.delay(350).duration(800).springify()} className="mb-8">
                <GlassCard
                  className="p-5 border border-black/5 bg-white/60"
                  style={{ borderLeftWidth: 4, borderLeftColor: THEME }}
                >
                  <View className="flex-row items-start gap-3">
                    <Lightbulb size={20} color={THEME} strokeWidth={2} />
                    <View className="flex-1">
                      <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                        Coach Insight
                      </Text>
                      <Text className="text-[15px] text-[#1C1C1E] font-medium leading-relaxed">
                        {coachTip}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Animated.View>
            ) : null}
          </>
        )}

        {/* Premium */}
        <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
          <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
            <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">Premium</Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">Advanced Analytics</Text>
            <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
              Cross-domain correlations, predictive scoring, and personalised recommendations
            </Text>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
