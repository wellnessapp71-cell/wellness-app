import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { MetricCard } from "@/components/mental/MetricCard";
import { ActionCard } from "@/components/mental/ActionCard";
import { getProfile } from "@/lib/user-store";
import {
  getLifestyleBaseline,
  getLifestyleCheckIns,
  getLifestylePlan,
  getTodayLifestyleCheckIn,
  getHydrationLogs,
  getMealLogs,
} from "@/lib/lifestyle-store";
import { generateCoachMessage } from "@aura/lifestyle-engine";
import { syncLifestyleData } from "@/lib/lifestyle-sync";
import type {
  LifestyleBaseline,
  LifestyleDailyCheckIn,
  LifestyleWellnessPlan,
  LifestyleCoachMessage,
} from "@aura/types";
import { LIFESTYLE_DOMAIN_LABELS, type LifestyleDomain } from "@aura/types";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { captureError } from "@/lib/error-reporting";
import {
  ChevronLeft,
  Lock,
  Moon,
  Apple,
  Droplets,
  Footprints,
  Smartphone,
  Leaf,
  Utensils,
  Lightbulb,
  ClipboardCheck,
  BarChart2,
  Target,
  Crown,
} from "lucide-react-native";

const THEME = "#FF9500";

const BAND_COLORS = {
  green: "#34C759",
  yellow: "#FFCC00",
  orange: "#FF9500",
  red: "#FF3B30",
};

const DOMAIN_ICONS: Record<LifestyleDomain, any> = {
  sleep: Moon,
  nutrition: Utensils,
  hydration: Droplets,
  movement: Footprints,
  digital: Smartphone,
  nature: Leaf,
  routine: ClipboardCheck,
};

export default function LifestyleHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [baseline, setBaseline] = useState<LifestyleBaseline | null>(null);
  const [todayCheckIn, setTodayCheckIn] =
    useState<LifestyleDailyCheckIn | null>(null);
  const [plan, setPlan] = useState<LifestyleWellnessPlan | null>(null);
  const [coachMsg, setCoachMsg] = useState<LifestyleCoachMessage | null>(null);
  const [todayWaterMl, setTodayWaterMl] = useState(0);
  const [todayMeals, setTodayMeals] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      // Trigger background sync on every focus
      syncLifestyleData();

      (async () => {
        setLoading(true);
        try {
          const profile = await getProfile();
          if (profile) setScore(profile.scoreLifestyle);

          const bl = await getLifestyleBaseline();
          setBaseline(bl);

          const today = await getTodayLifestyleCheckIn();
          setTodayCheckIn(today);

          const currentPlan = await getLifestylePlan();
          setPlan(currentPlan);

          if (bl) {
            try {
              const msg = generateCoachMessage(bl);
              setCoachMsg(msg);
            } catch (err) { captureError(err, { context: "lifestyle coach message" }); }
          }

          const todayDate = new Date().toISOString().split("T")[0];
          const hydLogs = await getHydrationLogs();
          const todayHyd = hydLogs.filter((l) => l.date === todayDate);
          setTodayWaterMl(todayHyd.reduce((s, l) => s + l.volumeMl, 0));

          const meals = await getMealLogs();
          setTodayMeals(meals.filter((m) => m.date === todayDate).length);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const domainScores: { domain: LifestyleDomain; score: number }[] = baseline
    ? [
        { domain: "sleep", score: baseline.sleepScore },
        { domain: "nutrition", score: baseline.nutritionScore },
        { domain: "hydration", score: baseline.hydrationScore },
        { domain: "movement", score: baseline.movementScore },
        { domain: "digital", score: baseline.digitalScore },
        { domain: "nature", score: baseline.natureScore },
        { domain: "routine", score: baseline.routineScore },
      ]
    : [];
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const domainCardWidth = Math.floor((safeContentWidth - 24) / 3);
  const quickLogCardWidth = Math.floor((safeContentWidth - 36) / 4);
  const activityCardWidth = Math.floor((safeContentWidth - 24) / 3);

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
        {loading ? (
          <View className="flex-1 items-center justify-center pt-40">
            <ActivityIndicator size="large" color="#FF9500" />
            <Text className="text-[14px] text-[#8A8A8E] mt-4 font-medium">Loading your lifestyle hub…</Text>
          </View>
        ) : (<>
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
          <View
            className="px-3 py-1.5 rounded-full border flex-row items-center gap-1.5"
            style={{ backgroundColor: THEME + "10", borderColor: THEME + "20" }}
          >
            <Lock size={12} color={THEME} strokeWidth={3} />
            <Text
              className="text-[12px] font-bold uppercase tracking-widest"
              style={{ color: THEME }}
            >
              Private
            </Text>
          </View>
        </Animated.View>

        {/* Greeting */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[34px] font-bold text-[#1C1C1E] tracking-tight leading-tight mb-1">
            {greeting}
          </Text>
          <Text className="text-[15px] text-[#8A8A8E] font-bold uppercase tracking-widest">
            {dayName}
          </Text>
        </Animated.View>

        {/* Score Ring */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-4">
              Lifestyle Score
            </Text>
            <View
              className="w-36 h-36 rounded-full items-center justify-center shadow-sm"
              style={{
                borderWidth: 8,
                borderColor: baseline ? BAND_COLORS[baseline.band] : "#E5E5EA",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text
                className="text-[42px] font-bold tracking-tighter"
                style={{
                  color: baseline ? BAND_COLORS[baseline.band] : "#8A8A8E",
                }}
              >
                {score}
              </Text>
            </View>
            {coachMsg && (
              <Text className="text-[15px] font-medium text-[#3C3C43] text-center mt-6 leading-relaxed px-2">
                "{coachMsg.text}"
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Domain Score Cards — 3 rows for 7 domains */}
        {domainScores.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(800).springify()}
            className="mb-8"
          >
            <View className="flex-row gap-3 mb-3 justify-between">
              {domainScores.slice(0, 3).map((d) => (
                <View key={d.domain} style={{ width: domainCardWidth }}>
                  <DomainCard domain={d.domain} score={d.score} />
                </View>
              ))}
            </View>
            <View className="flex-row gap-3 mb-3 justify-between">
              {domainScores.slice(3, 6).map((d) => (
                <View key={d.domain} style={{ width: domainCardWidth }}>
                  <DomainCard domain={d.domain} score={d.score} />
                </View>
              ))}
            </View>
            <View className="flex-row gap-3 justify-between">
              {domainScores.slice(6, 7).map((d) => (
                <View key={d.domain} style={{ width: domainCardWidth }}>
                  <DomainCard domain={d.domain} score={d.score} />
                </View>
              ))}
              <View style={{ width: domainCardWidth }} />
              <View style={{ width: domainCardWidth }} />
            </View>
          </Animated.View>
        )}

        {/* Quick Log */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Quick Log
          </Text>
          <View className="flex-row gap-3 justify-between">
            <Pressable
              onPress={() => router.push("/lifestyle/log-water")}
              style={{ width: quickLogCardWidth }}
            >
              <GlassCard className="p-3 items-center border border-black/5 bg-white/60">
                <Droplets
                  size={24}
                  color="#5AC8FA"
                  strokeWidth={2}
                  className="mb-2"
                />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mb-0.5">
                  Water
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  {todayWaterMl}ml
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/lifestyle/log-meal")}
              style={{ width: quickLogCardWidth }}
            >
              <GlassCard className="p-3 items-center border border-black/5 bg-white/60">
                <Apple
                  size={24}
                  color="#FF2D55"
                  strokeWidth={2}
                  className="mb-2"
                />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mb-0.5">
                  Meal
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  {todayMeals} logged
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/lifestyle/log-sleep")}
              style={{ width: quickLogCardWidth }}
            >
              <GlassCard className="p-3 items-center border border-black/5 bg-white/60">
                <Moon
                  size={24}
                  color="#5E5CE6"
                  strokeWidth={2}
                  className="mb-2"
                />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mb-0.5">
                  Sleep
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  {todayCheckIn ? `${todayCheckIn.sleepHours}h` : "—"}
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/lifestyle/log-movement")}
              style={{ width: quickLogCardWidth }}
            >
              <GlassCard className="p-3 items-center border border-black/5 bg-white/60">
                <Footprints
                  size={24}
                  color="#FF9500"
                  strokeWidth={2}
                  className="mb-2"
                />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mb-0.5">
                  Move
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  Log
                </Text>
              </GlassCard>
            </Pressable>
          </View>
        </Animated.View>

        {/* Best Next Action */}
        {plan && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Best Next Action
            </Text>
            <ActionCard
              icon="🎯"
              title="Daily Goal"
              description={plan.bestNextAction}
              actionLabel="Do it"
              color={THEME}
              onPress={() => router.push("/lifestyle/checkin")}
            />
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Activities
          </Text>
          <View className="flex-row gap-3 justify-between">
            <Pressable
              onPress={() => router.push("/lifestyle/checkin")}
              style={{ width: activityCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <ClipboardCheck size={28} color="#FF9500" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Check-in
                </Text>
                <Text
                  className="text-[11px] font-medium"
                  style={{ color: todayCheckIn ? "#34C759" : "#8A8A8E" }}
                >
                  {todayCheckIn ? "✓ Done" : "1 min"}
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/lifestyle/weekly-review")}
              style={{ width: activityCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <BarChart2 size={28} color="#007AFF" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Review
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  7-day recap
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/lifestyle/insights")}
              style={{ width: activityCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <Lightbulb size={28} color="#AF52DE" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Insights
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  View trends
                </Text>
              </GlassCard>
            </Pressable>
          </View>
          <View className="flex-row gap-3 mt-3 justify-between">
            <Pressable
              onPress={() => router.push("/lifestyle/monthly-review" as any)}
              style={{ width: activityCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <Crown size={28} color="#5856D6" strokeWidth={2} />
                <Text className="text-[13px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Monthly
                </Text>
                <Text className="text-[11px] text-[#8A8A8E] font-medium">
                  30-day recap
                </Text>
              </GlassCard>
            </Pressable>
            <View style={{ width: activityCardWidth }} />
            <View style={{ width: activityCardWidth }} />
          </View>
        </Animated.View>

        {/* Plan Summary */}
        {plan && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(800).springify()}
            className="mb-8"
          >
            <GlassCard className="p-5 border border-black/5 bg-white/60">
              <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-3">
                Your Wellness Plan
              </Text>
              <View className="flex-row items-center gap-2 mb-3">
                <View className="w-8 h-8 rounded-lg items-center justify-center bg-[#FF9500]/10 border border-[#FF9500]/20">
                  <Target size={16} color="#FF9500" strokeWidth={3} />
                </View>
                <Text className="text-[18px] font-bold text-[#1C1C1E]">
                  {LIFESTYLE_DOMAIN_LABELS[plan.focusDomain]}
                </Text>
              </View>
              <View className="mt-2 bg-white rounded-xl p-4 border border-black/[0.03]">
                <View className="flex-row items-start gap-3 mb-3">
                  <View className="w-1.5 h-1.5 mt-2 rounded-full bg-[#FF9500]" />
                  <Text className="text-[14px] text-[#1C1C1E] font-medium flex-1">
                    {plan.dailyAnchorHabit}
                  </Text>
                </View>
                <View className="flex-row items-start gap-3">
                  <View className="w-1.5 h-1.5 mt-2 rounded-full bg-[#FF9500]" />
                  <Text className="text-[14px] text-[#1C1C1E] font-medium flex-1">
                    {plan.weeklyGoal}
                  </Text>
                </View>
              </View>
              {plan.trendInsight && (
                <View className="mt-4 flex-row gap-2">
                  <Lightbulb size={16} color="#8A8A8E" />
                  <Text className="text-[13px] text-[#8A8A8E] leading-snug flex-1 font-medium italic">
                    {plan.trendInsight}
                  </Text>
                </View>
              )}
            </GlassCard>
          </Animated.View>
        )}

        {/* Coach Card */}
        {coachMsg?.suggestedAction && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(800).springify()}
            className="mb-8"
          >
            <GlassCard
              className="p-5 overflow-hidden border border-black/5 bg-white/60"
              style={{ borderLeftWidth: 4, borderLeftColor: THEME }}
            >
              <Text className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                Coach Suggestion
              </Text>
              <Text className="text-[15px] text-[#1C1C1E] font-medium leading-relaxed">
                {coachMsg.suggestedAction}
              </Text>
            </GlassCard>
          </Animated.View>
        )}

        {/* Redo assessment */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800).springify()}
        >
          <Pressable
            onPress={() => router.push("/lifestyle/onboarding")}
            className="mb-6 items-center"
          >
            <Text
              className="text-[15px] font-semibold opacity-60"
              style={{ color: "#1C1C1E" }}
            >
              Redo Lifestyle Assessment
            </Text>
          </Pressable>
        </Animated.View>
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Domain Card ──────────────────────────────────────────────

const DOMAIN_ROUTES: Record<LifestyleDomain, string> = {
  sleep: "/lifestyle/sleep",
  nutrition: "/lifestyle/food",
  hydration: "/lifestyle/hydration",
  movement: "/lifestyle/movement",
  digital: "/lifestyle/digital",
  nature: "/lifestyle/nature",
  routine: "/lifestyle/nature",
};

function DomainCard({
  domain,
  score,
}: {
  domain: LifestyleDomain;
  score: number;
}) {
  const router = useRouter();
  const color =
    score >= 80
      ? "#34C759"
      : score >= 60
        ? "#FFCC00"
        : score >= 40
          ? "#FF9500"
          : "#FF3B30";
  const Icon = DOMAIN_ICONS[domain] || Moon;

  return (
    <Pressable
      className="flex-1"
      onPress={() => router.push(DOMAIN_ROUTES[domain] as any)}
    >
      <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mb-2"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon size={20} color={color} strokeWidth={2.5} />
        </View>
        <Text
          className="text-[24px] font-bold mb-1 tracking-tight"
          style={{ color }}
        >
          {score}
        </Text>
        <Text
          className="text-[11px] font-bold text-[#8A8A8E] uppercase tracking-wider text-center"
          numberOfLines={1}
        >
          {LIFESTYLE_DOMAIN_LABELS[domain]}
        </Text>
      </GlassCard>
    </Pressable>
  );
}
