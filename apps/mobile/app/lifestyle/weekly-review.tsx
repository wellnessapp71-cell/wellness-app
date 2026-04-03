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
  getLifestyleBaseline,
  getLifestyleCheckIns,
  getWeeklyReviews,
  saveWeeklyReview,
} from "@/lib/lifestyle-store";
import {
  generateWeeklyReview,
  generateWeeklyInsight,
} from "@aura/lifestyle-engine";
import { pushWeeklyReview } from "@/lib/lifestyle-sync";
import type { LifestyleWeeklyReview, LifestyleBaseline } from "@aura/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  ChevronLeft,
  Moon,
  Droplets,
  Utensils,
  Footprints,
  Smartphone,
  Leaf,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  CalendarDays,
} from "lucide-react-native";

const THEME = "#007AFF";

export default function WeeklyReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [review, setReview] = useState<LifestyleWeeklyReview | null>(null);
  const [insight, setInsight] = useState("");
  const [pastReviews, setPastReviews] = useState<LifestyleWeeklyReview[]>([]);
  const [generated, setGenerated] = useState(false);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const statCardWidth = Math.floor((safeContentWidth - 24) / 3);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const baseline = await getLifestyleBaseline();
        if (!baseline) return;

        const checkIns = await getLifestyleCheckIns();
        const reviews = await getWeeklyReviews();
        setPastReviews(reviews.slice(-8).reverse());

        // Check if there's a review for this week already
        const todayDate = new Date().toISOString().split("T")[0];
        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - 6);
        const weekStartStr = thisWeekStart.toISOString().split("T")[0];

        const existingReview = reviews.find(
          (r) => r.weekStart >= weekStartStr && r.weekEnd <= todayDate,
        );

        if (existingReview) {
          setReview(existingReview);
          setInsight(generateWeeklyInsight(existingReview));
          setGenerated(true);
          return;
        }

        // Generate new review
        const previousScore =
          reviews.length > 0
            ? reviews[reviews.length - 1].scoreChange
            : undefined;

        const newReview = generateWeeklyReview({
          baseline,
          checkIns,
          previousScore,
        });

        setReview(newReview);
        setInsight(generateWeeklyInsight(newReview));

        // Auto-save locally & sync
        await saveWeeklyReview(newReview);
        pushWeeklyReview(newReview);
        setGenerated(true);
      })();
    }, []),
  );

  const statItems = review
    ? [
        {
          icon: Moon,
          label: "Good Sleep",
          value: `${review.goodSleepDays}/7`,
          color:
            review.goodSleepDays >= 5
              ? "#34C759"
              : review.goodSleepDays >= 3
                ? "#FFCC00"
                : "#FF3B30",
        },
        {
          icon: Droplets,
          label: "Hydration",
          value: `${review.hydrationTargetDays}/7`,
          color:
            review.hydrationTargetDays >= 5
              ? "#34C759"
              : review.hydrationTargetDays >= 3
                ? "#FFCC00"
                : "#FF3B30",
        },
        {
          icon: Utensils,
          label: "Balanced Meals",
          value: `${review.balancedMealDays ?? review.mealLogDays}/7`,
          color:
            (review.balancedMealDays ?? review.mealLogDays) >= 5
              ? "#34C759"
              : (review.balancedMealDays ?? review.mealLogDays) >= 3
                ? "#FFCC00"
                : "#FF3B30",
        },
        {
          icon: Footprints,
          label: "Movement",
          value: `${review.movementDays}/7`,
          color:
            review.movementDays >= 4
              ? "#34C759"
              : review.movementDays >= 2
                ? "#FFCC00"
                : "#FF3B30",
        },
        {
          icon: Smartphone,
          label: "Screen OK",
          value: `${review.screenUnderLimitDays ?? (7 - review.screenInterferenceDays)}/7`,
          color:
            (review.screenUnderLimitDays ?? (7 - review.screenInterferenceDays)) >= 5
              ? "#34C759"
              : (review.screenUnderLimitDays ?? (7 - review.screenInterferenceDays)) >= 3
                ? "#FFCC00"
                : "#FF3B30",
        },
        {
          icon: Leaf,
          label: "Outdoors",
          value: `${review.outdoorDays}/7`,
          color:
            review.outdoorDays >= 4
              ? "#34C759"
              : review.outdoorDays >= 2
                ? "#FFCC00"
                : "#FF3B30",
        },
      ]
    : [];

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
            Weekly Review
          </Text>
          <View className="w-10" />
        </Animated.View>

        {!review ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(800).springify()}
          >
            <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
              <CalendarDays size={32} color="#8A8A8E" strokeWidth={1.5} />
              <Text className="text-[16px] font-bold text-[#1C1C1E] mt-4 mb-2">
                No Data Yet
              </Text>
              <Text className="text-[14px] text-[#8A8A8E] text-center leading-relaxed">
                Complete daily check-ins for at least a few days to generate
                your weekly review.
              </Text>
            </GlassCard>
          </Animated.View>
        ) : (
          <>
            {/* Week range */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(800).springify()}
              className="mb-6"
            >
              <GlassCard className="p-5 items-center border border-black/5 bg-white/60">
                <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                  {review.weekStart} → {review.weekEnd}
                </Text>
                {/* Score Change */}
                <View className="flex-row items-center gap-2 mt-2">
                  {review.scoreChange > 0 ? (
                    <TrendingUp size={24} color="#34C759" strokeWidth={2.5} />
                  ) : review.scoreChange < 0 ? (
                    <TrendingDown size={24} color="#FF3B30" strokeWidth={2.5} />
                  ) : (
                    <Minus size={24} color="#8A8A8E" strokeWidth={2.5} />
                  )}
                  <Text
                    className="text-[36px] font-bold tracking-tighter"
                    style={{
                      color:
                        review.scoreChange > 0
                          ? "#34C759"
                          : review.scoreChange < 0
                            ? "#FF3B30"
                            : "#8A8A8E",
                    }}
                  >
                    {review.scoreChange > 0 ? "+" : ""}
                    {review.scoreChange}
                  </Text>
                </View>
                <Text className="text-[13px] text-[#8A8A8E] mt-1">
                  Score Change
                </Text>
              </GlassCard>
            </Animated.View>

            {/* Insight */}
            {insight ? (
              <Animated.View
                entering={FadeInDown.delay(150).duration(800).springify()}
                className="mb-8"
              >
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

            {/* Stats Grid */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(800).springify()}
              className="mb-8"
            >
              <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                This Week
              </Text>
              <View className="flex-row gap-3 mb-3 justify-between">
                {statItems.slice(0, 3).map((item) => (
                  <View key={item.label} style={{ width: statCardWidth }}>
                    <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                      <item.icon size={20} color={item.color} strokeWidth={2} />
                      <Text className="text-[22px] font-bold text-[#1C1C1E] mt-2">
                        {item.value}
                      </Text>
                      <Text className="text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1 text-center">
                        {item.label}
                      </Text>
                    </GlassCard>
                  </View>
                ))}
              </View>
              <View className="flex-row gap-3 justify-between">
                {statItems.slice(3, 6).map((item) => (
                  <View key={item.label} style={{ width: statCardWidth }}>
                    <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                      <item.icon size={20} color={item.color} strokeWidth={2} />
                      <Text className="text-[22px] font-bold text-[#1C1C1E] mt-2">
                        {item.value}
                      </Text>
                      <Text className="text-[10px] font-bold text-[#8A8A8E] uppercase tracking-wider mt-1 text-center">
                        {item.label}
                      </Text>
                    </GlassCard>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Best & Worst */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(800).springify()}
              className="mb-8"
            >
              <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                Highlights
              </Text>
              <View className="gap-3">
                {review.helpedMostHabit && (
                  <GlassCard
                    className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
                    style={{ borderLeftWidth: 3, borderLeftColor: "#34C759" }}
                  >
                    <View className="w-11 h-11 rounded-2xl items-center justify-center bg-[#34C759]/10">
                      <Shield size={22} color="#34C759" strokeWidth={2.5} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-[#1C1C1E]">
                        Helped Most
                      </Text>
                      <Text className="text-[13px] text-[#8A8A8E]">
                        {review.helpedMostHabit}
                      </Text>
                    </View>
                  </GlassCard>
                )}
                {review.blockedMostHabit && (
                  <GlassCard
                    className="p-4 flex-row items-center gap-4 border border-black/5 bg-white/60"
                    style={{ borderLeftWidth: 3, borderLeftColor: "#FF9500" }}
                  >
                    <View className="w-11 h-11 rounded-2xl items-center justify-center bg-[#FF9500]/10">
                      <AlertTriangle
                        size={22}
                        color="#FF9500"
                        strokeWidth={2.5}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[15px] font-bold text-[#1C1C1E]">
                        Top Blocker
                      </Text>
                      <Text className="text-[13px] text-[#8A8A8E] capitalize">
                        {review.blockedMostHabit.replace(/_/g, " ")}
                      </Text>
                    </View>
                  </GlassCard>
                )}
              </View>
            </Animated.View>

            {/* Past Reviews */}
            {pastReviews.length > 1 && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(800).springify()}
                className="mb-8"
              >
                <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
                  Past Reviews
                </Text>
                <View className="gap-2">
                  {pastReviews.slice(1).map((r) => (
                    <GlassCard
                      key={r.id}
                      className="p-3 flex-row items-center gap-3 border border-black/5 bg-white/60"
                    >
                      <CalendarDays size={16} color={THEME} strokeWidth={2} />
                      <View className="flex-1">
                        <Text className="text-[13px] font-bold text-[#1C1C1E]">
                          {r.weekStart} → {r.weekEnd}
                        </Text>
                        <Text className="text-[11px] text-[#8A8A8E]">
                          Sleep {r.goodSleepDays}/7 · Water{" "}
                          {r.hydrationTargetDays}/7 · Move {r.movementDays}/7
                        </Text>
                      </View>
                      <Text
                        className="text-[14px] font-bold"
                        style={{
                          color: r.scoreChange >= 0 ? "#34C759" : "#FF3B30",
                        }}
                      >
                        {r.scoreChange >= 0 ? "+" : ""}
                        {r.scoreChange}
                      </Text>
                    </GlassCard>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Premium */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(800).springify()}
            >
              <GlassCard className="p-5 items-center border border-black/5 bg-white/60 mb-6">
                <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                  Premium
                </Text>
                <Text className="text-[15px] font-bold text-[#1C1C1E] text-center">
                  Predictive Insights
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] text-center mt-1">
                  AI-generated weekly action plan based on your patterns
                </Text>
              </GlassCard>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
