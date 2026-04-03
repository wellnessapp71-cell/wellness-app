import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getLifestyleBaseline,
  getLifestyleCheckIns,
  getWeeklyReviews,
  getMonthlyReviews,
  saveMonthlyReview,
} from "@/lib/lifestyle-store";
import {
  generateMonthlyReview,
  generateMonthlyInsight,
} from "@aura/lifestyle-engine";
import { pushMonthlyReview } from "@/lib/lifestyle-sync";
import type { LifestyleMonthlyReview } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Moon,
  Utensils,
  Droplets,
  Footprints,
  Smartphone,
  Leaf,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Crown,
} from "lucide-react-native";

const THEME = "#5856D6";

const DOMAIN_CONFIG = [
  { key: "sleepImproved" as const, label: "Sleep", icon: Moon, color: "#5856D6" },
  { key: "mealQualityImproved" as const, label: "Nutrition", icon: Utensils, color: "#FF2D55" },
  { key: "hydrationImproved" as const, label: "Hydration", icon: Droplets, color: "#5AC8FA" },
  { key: "movementImproved" as const, label: "Movement", icon: Footprints, color: "#FF9500" },
  { key: "screenBalanceImproved" as const, label: "Digital", icon: Smartphone, color: "#AF52DE" },
  { key: "natureImproved" as const, label: "Nature", icon: Leaf, color: "#34C759" },
  { key: "routineImproved" as const, label: "Routine", icon: CheckCircle2, color: "#007AFF" },
];

export default function MonthlyReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [review, setReview] = useState<LifestyleMonthlyReview | null>(null);
  const [insight, setInsight] = useState("");
  const [pastReviews, setPastReviews] = useState<LifestyleMonthlyReview[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const baseline = await getLifestyleBaseline();
        if (!baseline) return;

        const checkIns = await getLifestyleCheckIns();
        const weeklyReviews = await getWeeklyReviews();
        const monthlyReviews = await getMonthlyReviews();
        setPastReviews(monthlyReviews.slice(-6).reverse());

        const currentMonth = new Date().toISOString().slice(0, 7);

        // Check if a review already exists for this month
        const existing = monthlyReviews.find((r) => r.month === currentMonth);
        if (existing) {
          setReview(existing);
          setInsight(generateMonthlyInsight(existing));
          return;
        }

        // Need at least 7 check-ins to generate
        if (checkIns.length < 7) return;

        const newReview = generateMonthlyReview({
          baseline,
          checkIns,
          weeklyReviews,
          planPreference: "same",
          month: currentMonth,
        });

        setReview(newReview);
        setInsight(generateMonthlyInsight(newReview));
        await saveMonthlyReview(newReview);
        pushMonthlyReview(newReview);
      })();
    }, []),
  );

  const improvedCount = review
    ? DOMAIN_CONFIG.filter((d) => review[d.key]).length
    : 0;

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
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">Monthly Review</Text>
          <View className="w-10" />
        </Animated.View>

        {!review ? (
          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()}>
            <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
              <CalendarDays size={32} color="#8A8A8E" strokeWidth={1.5} />
              <Text className="text-[16px] font-bold text-[#1C1C1E] mt-4 mb-2">Not Enough Data</Text>
              <Text className="text-[14px] text-[#8A8A8E] text-center leading-relaxed">
                Complete at least 7 daily check-ins to generate your monthly review.
              </Text>
            </GlassCard>
          </Animated.View>
        ) : (
          <>
            {/* Month Header */}
            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-6">
              <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
                <View className="w-14 h-14 rounded-full items-center justify-center mb-3" style={{ backgroundColor: THEME + "15" }}>
                  <Crown size={28} color={THEME} strokeWidth={2} />
                </View>
                <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                  {review.month}
                </Text>
                <Text className="text-[48px] font-bold tracking-tighter" style={{ color: improvedCount >= 5 ? "#34C759" : improvedCount >= 3 ? "#FFCC00" : "#FF3B30" }}>
                  {improvedCount}/7
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] mt-1">Domains Improved</Text>
              </GlassCard>
            </Animated.View>

            {/* Insight */}
            {insight ? (
              <Animated.View entering={FadeInDown.delay(150).duration(800).springify()} className="mb-8">
                <GlassCard
                  className="p-5 border border-black/5 bg-white/60"
                  style={{ borderLeftWidth: 4, borderLeftColor: THEME }}
                >
                  <Text className="text-[15px] text-[#1C1C1E] font-medium leading-relaxed">
                    {insight}
                  </Text>
                </GlassCard>
              </Animated.View>
            ) : null}

            {/* Domain Breakdown */}
            <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="mb-8">
              <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                Domain Breakdown
              </Text>
              <View className="gap-2">
                {DOMAIN_CONFIG.map((d) => {
                  const improved = review[d.key];
                  const Icon = d.icon;
                  return (
                    <GlassCard
                      key={d.key}
                      className="p-4 flex-row items-center gap-3 border border-black/5 bg-white/60"
                      style={{ borderLeftWidth: 3, borderLeftColor: improved ? "#34C759" : "#FF3B30" }}
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: d.color + "15" }}
                      >
                        <Icon size={20} color={d.color} strokeWidth={2} />
                      </View>
                      <Text className="text-[15px] font-bold text-[#1C1C1E] flex-1">{d.label}</Text>
                      {improved ? (
                        <View className="flex-row items-center gap-1.5">
                          <CheckCircle2 size={18} color="#34C759" strokeWidth={2.5} />
                          <Text className="text-[13px] font-bold text-[#34C759]">Improved</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center gap-1.5">
                          <XCircle size={18} color="#FF3B30" strokeWidth={2.5} />
                          <Text className="text-[13px] font-bold text-[#FF3B30]">Needs Work</Text>
                        </View>
                      )}
                    </GlassCard>
                  );
                })}
              </View>
            </Animated.View>

            {/* Past Reviews */}
            {pastReviews.length > 1 && (
              <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} className="mb-8">
                <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">Past Months</Text>
                <View className="gap-2">
                  {pastReviews.slice(1).map((r) => {
                    const count = DOMAIN_CONFIG.filter((d) => r[d.key]).length;
                    return (
                      <GlassCard key={r.id} className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60">
                        <CalendarDays size={16} color={THEME} strokeWidth={2} />
                        <Text className="text-[14px] font-bold text-[#1C1C1E] flex-1">{r.month}</Text>
                        <Text
                          className="text-[14px] font-bold"
                          style={{ color: count >= 5 ? "#34C759" : count >= 3 ? "#FFCC00" : "#FF3B30" }}
                        >
                          {count}/7 improved
                        </Text>
                      </GlassCard>
                    );
                  })}
                </View>
              </Animated.View>
            )}

            {/* Premium */}
            <Animated.View entering={FadeInDown.delay(350).duration(800).springify()}>
              <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">Premium</Text>
                <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">Monthly Deep Dive</Text>
                <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
                  AI-generated month-over-month comparison and personalised action plans
                </Text>
              </GlassCard>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
