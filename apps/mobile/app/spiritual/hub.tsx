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
import { SpiritualScoreRing } from "@/components/spiritual/SpiritualScoreRing";
import { CoachCard } from "@/components/spiritual/CoachCard";
import { getProfile } from "@/lib/user-store";
import {
  getSpiritualBaseline,
  getSpiritualCheckInHistory,
  getCurrentSpiritualPlan,
  getLatestSpiritualWeeklyReview,
} from "@/lib/spiritual-store";
import {
  generateCoachMessage,
  analyzeSpiritualCheckIns,
} from "@aura/spiritual-engine";
import { captureError } from "@/lib/error-reporting";
import type {
  SpiritualBaseline,
  SpiritualDailyCheckIn,
  SpiritualWellnessPlan,
  SpiritualCoachMessage,
} from "@aura/types";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import {
  ChevronLeft,
  Lock,
  Wind,
  Sparkles,
  HeartHandshake,
  Brain,
  BrainCircuit,
  Leaf,
  ClipboardCheck,
  BookOpen,
  Users,
  BarChart2,
  Lightbulb,
  BookMarked,
  MessageCircle,
  Headphones,
  Footprints,
} from "lucide-react-native";

const TEAL = "#30B0C7";

export default function SpiritualHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [score, setScore] = useState(50);
  const [previousScore, setPreviousScore] = useState<number | undefined>();
  const [baseline, setBaseline] = useState<SpiritualBaseline | null>(null);
  const [latestCheckIn, setLatestCheckIn] =
    useState<SpiritualDailyCheckIn | null>(null);
  const [plan, setPlan] = useState<SpiritualWellnessPlan | null>(null);
  const [coachMsg, setCoachMsg] = useState<SpiritualCoachMessage | null>(null);
  const [todayDone, setTodayDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const profile = await getProfile();
          if (profile) {
            setScore(profile.scoreSpiritual);
          }

          const bl = await getSpiritualBaseline();
          setBaseline(bl);

          const checkIns = await getSpiritualCheckInHistory(7);
          const currentPlan = await getCurrentSpiritualPlan();
          const weeklyReview = await getLatestSpiritualWeeklyReview();

          if (checkIns.length > 0) {
            setLatestCheckIn(checkIns[checkIns.length - 1]);
          }

          const today = new Date().toISOString().split("T")[0];
          setTodayDone(checkIns.some((c) => c.date === today));

          setPlan(currentPlan);

          if (weeklyReview) {
            const prevScore = profile
              ? profile.scoreSpiritual - (weeklyReview.calmScoreChange ?? 0)
              : undefined;
            if (
              prevScore !== undefined &&
              prevScore !== profile?.scoreSpiritual
            ) {
              setPreviousScore(Math.max(0, prevScore));
            }
          }

          if (bl) {
            try {
              const trendAnalysis = analyzeSpiritualCheckIns(
                checkIns.map((c) => ({
                  ...c,
                  id: c.id ?? "",
                  createdAt: c.createdAt ?? "",
                })),
                7,
              );
              const msg = generateCoachMessage(
                bl.band,
                bl.weakestDomain,
                trendAnalysis.overallDirection,
                latestCheckIn?.blockers?.[0] ?? null,
              );
              setCoachMsg(msg);
            } catch (err) {
              captureError(err, { context: "spiritual hub coach message generation" });
            }
          }
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

  const domainIcons: Record<string, any> = {
    Meaning: Sparkles,
    Peace: Wind,
    Mindfulness: Brain,
    Connection: HeartHandshake,
    Practice: Leaf,
  };

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
            <ActivityIndicator size="large" color="#30B0C7" />
            <Text className="text-[14px] text-[#8A8A8E] mt-4 font-medium">Loading your spiritual hub…</Text>
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
            style={{ backgroundColor: TEAL + "10", borderColor: TEAL + "20" }}
          >
            <Lock size={12} color={TEAL} strokeWidth={3} />
            <Text
              className="text-[12px] font-bold uppercase tracking-widest"
              style={{ color: TEAL }}
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
          <Text className="text-[15px] text-[#8A8A8E] font-bold uppercase tracking-widest mb-3">
            {dayName}
          </Text>
          <Text className="text-[17px] text-[#3C3C43] leading-relaxed font-medium">
            Find your inner calm.
          </Text>
        </Animated.View>

        {/* Primary CTA — 5-min Reset */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-6"
        >
          <Pressable onPress={() => router.push("/spiritual/breathwork")}>
            <GlassCard
              className="p-6 items-center border"
              style={{ backgroundColor: TEAL + "08", borderColor: TEAL + "20" }}
            >
              <View
                className="w-16 h-16 rounded-full items-center justify-center mb-3"
                style={{ backgroundColor: TEAL + "15" }}
              >
                <Wind size={32} color={TEAL} strokeWidth={1.5} />
              </View>
              <Text
                className="text-[20px] font-bold mt-1 tracking-tight"
                style={{ color: TEAL }}
              >
                Start 5-min Reset
              </Text>
              <Text className="text-[14px] text-[#8A8A8E] mt-1 text-center font-medium">
                Quick calm practice — breathe, pause, reset.
              </Text>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Inner Calm Score Ring */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <SpiritualScoreRing score={score} previousScore={previousScore} />
          </GlassCard>
        </Animated.View>

        {/* Domain Sub-Score Cards — 2x3 grid */}
        {baseline && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Pillars of Inner Calm
            </Text>
            <View className="flex-row gap-3 mb-3 justify-between">
              {[
                { label: "Meaning", score: baseline.meaningScore },
                { label: "Peace", score: baseline.peaceScore },
              ].map((d) => {
                const Icon = domainIcons[d.label] || Sparkles;
                return (
                  <View key={d.label} style={{ width: twoColCardWidth }}>
                    <GlassCard className="p-4 border border-black/5 bg-white/60">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="w-10 h-10 rounded-full bg-[#30B0C7]/10 items-center justify-center">
                          <Icon size={20} color="#30B0C7" strokeWidth={2.5} />
                        </View>
                        <Text className="text-[24px] font-bold text-[#1C1C1E]">
                          {d.score}
                        </Text>
                      </View>
                      <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider">
                        {d.label}
                      </Text>
                    </GlassCard>
                  </View>
                );
              })}
            </View>
            <View className="flex-row gap-3 mb-3 justify-between">
              {[
                { label: "Mindfulness", score: baseline.mindfulnessScore },
                { label: "Connection", score: baseline.connectionScore },
              ].map((d) => {
                const Icon = domainIcons[d.label] || Sparkles;
                return (
                  <View key={d.label} style={{ width: twoColCardWidth }}>
                    <GlassCard className="p-4 border border-black/5 bg-white/60">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="w-10 h-10 rounded-full bg-[#30B0C7]/10 items-center justify-center">
                          <Icon size={20} color="#30B0C7" strokeWidth={2.5} />
                        </View>
                        <Text className="text-[24px] font-bold text-[#1C1C1E]">
                          {d.score}
                        </Text>
                      </View>
                      <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider">
                        {d.label}
                      </Text>
                    </GlassCard>
                  </View>
                );
              })}
            </View>
            <View className="flex-row gap-3 justify-between">
              <View style={{ width: twoColCardWidth }}>
                <GlassCard className="p-4 border border-black/5 bg-white/60">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="w-10 h-10 rounded-full bg-[#30B0C7]/10 items-center justify-center">
                      <Leaf size={20} color="#30B0C7" strokeWidth={2.5} />
                    </View>
                    <Text className="text-[24px] font-bold text-[#1C1C1E]">
                      {baseline.practiceScore}
                    </Text>
                  </View>
                  <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider">
                    Practice
                  </Text>
                </GlassCard>
              </View>
              <View style={{ width: twoColCardWidth }} />
            </View>
          </Animated.View>
        )}

        {/* AI Coach Card */}
        {coachMsg && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="mb-8"
          >
            <CoachCard
              message={coachMsg.text}
              suggestedAction={coachMsg.suggestedAction}
              band={baseline?.band ?? "yellow"}
            />
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(350).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Quick Actions
          </Text>
          <View className="flex-row gap-3 justify-between">
            <Pressable
              onPress={() => router.push("/spiritual/checkin")}
              style={{ width: threeColCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <ClipboardCheck size={28} color={TEAL} strokeWidth={2} />
                <Text className="text-[14px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Check-in
                </Text>
                <Text
                  className="text-[12px] font-medium"
                  style={{ color: todayDone ? "#34C759" : "#8A8A8E" }}
                >
                  {todayDone ? "✓ Done" : "30 seconds"}
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/spiritual/journal")}
              style={{ width: threeColCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <BookOpen size={28} color="#FF9500" strokeWidth={2} />
                <Text className="text-[14px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Journal
                </Text>
                <Text className="text-[12px] text-[#8A8A8E] font-medium">
                  & Gratitude
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/mental/booking")}
              style={{ width: threeColCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[110px] border border-black/5 bg-white/60">
                <Users size={28} color="#5E5CE6" strokeWidth={2} />
                <Text className="text-[14px] font-bold text-[#1C1C1E] mt-3 mb-1">
                  Get Help
                </Text>
                <Text className="text-[12px] text-[#8A8A8E] font-medium">
                  Talk to pro
                </Text>
              </GlassCard>
            </Pressable>
          </View>
        </Animated.View>

        {/* Practice Quick Tiles */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Practices
          </Text>
          <View className="flex-row gap-3 mb-3 justify-between">
            {[
              {
                icon: BrainCircuit,
                label: "Meditate",
                route: "/spiritual/meditation",
                color: "#AF52DE",
              },
              {
                icon: Wind,
                label: "Breathe",
                route: "/spiritual/breathwork",
                color: "#34C759",
              },
              {
                icon: BookOpen,
                label: "Gratitude",
                route: "/spiritual/journal-entry",
                color: "#FF9500",
              },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.label}
                  onPress={() => router.push(tile.route)}
                  style={{ width: threeColCardWidth }}
                >
                  <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                    <Icon size={24} color={tile.color} strokeWidth={2} />
                    <Text className="text-[13px] font-bold text-[#1C1C1E] mt-2">
                      {tile.label}
                    </Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
          <View className="flex-row gap-3 justify-between">
            {[
              {
                icon: Sparkles,
                label: "Reflect",
                route: "/spiritual/journal-entry",
                color: "#5AC8FA",
              },
              {
                icon: Headphones,
                label: "Soundscape",
                route: "/spiritual/soundscape",
                color: "#FF2D55",
              },
              {
                icon: BrainCircuit,
                label: "Binaural",
                route: "/spiritual/binaural-beats",
                color: "#AF52DE",
              },
            ].map((tile) => {
              const Icon = tile.icon;
              return (
                <Pressable
                  key={tile.label}
                  onPress={() => router.push(tile.route)}
                  style={{ width: threeColCardWidth }}
                >
                  <GlassCard className="p-4 items-center border border-black/5 bg-white/60">
                    <Icon size={24} color={tile.color} strokeWidth={2} />
                    <Text className="text-[13px] font-bold text-[#1C1C1E] mt-2">
                      {tile.label}
                    </Text>
                  </GlassCard>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Wellness Plan Card */}
        {plan && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(800).springify()}
            className="mb-8"
          >
            <GlassCard className="p-5 border border-black/5 bg-white/60">
              <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-3">
                Your Wellness Plan
              </Text>
              <Text className="text-[18px] font-bold text-[#1C1C1E] mb-1">
                Focus:{" "}
                <Text className="capitalize">
                  {plan.focusDomain.replace(/_/g, " ")}
                </Text>
              </Text>
              <Text className="text-[14px] text-[#3C3C43] mb-4 font-medium leading-relaxed">
                {plan.dailyAnchorHabit}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {plan.contentBundle.slice(0, 3).map((item) => (
                  <View
                    key={item}
                    className="px-3 py-1.5 rounded-lg border"
                    style={{
                      backgroundColor: TEAL + "10",
                      borderColor: TEAL + "20",
                    }}
                  >
                    <Text
                      className="text-[11px] font-bold capitalize"
                      style={{ color: TEAL }}
                    >
                      {item.replace(/_/g, " ")}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
        )}

        {/* Footer Row */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(800).springify()}
          className="mb-10"
        >
          <View className="flex-row gap-3 mb-3 justify-between">
            <Pressable
              onPress={() => router.push("/spiritual/weekly-review")}
              style={{ width: twoColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60 flex-row justify-center gap-2">
                <BarChart2 size={20} color="#1C1C1E" strokeWidth={2.5} />
                <Text className="text-[14px] font-bold text-[#1C1C1E]">
                  Review
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/spiritual/insights")}
              style={{ width: twoColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60 flex-row justify-center gap-2">
                <Lightbulb size={20} color="#FF9500" strokeWidth={2.5} />
                <Text className="text-[14px] font-bold text-[#1C1C1E]">
                  Insights
                </Text>
              </GlassCard>
            </Pressable>
          </View>
          <View className="flex-row gap-3 justify-between">
            <Pressable
              onPress={() => router.push("/spiritual/library")}
              style={{ width: twoColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60 flex-row justify-center gap-2">
                <BookMarked size={20} color="#30B0C7" strokeWidth={2.5} />
                <Text className="text-[14px] font-bold text-[#1C1C1E]">
                  Learn
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/spiritual/live-sessions")}
              style={{ width: twoColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60 flex-row justify-center gap-2">
                <MessageCircle size={20} color="#5E5CE6" strokeWidth={2.5} />
                <Text className="text-[14px] font-bold text-[#1C1C1E]">
                  Community
                </Text>
              </GlassCard>
            </Pressable>
          </View>
        </Animated.View>

        {/* Redo assessment */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(800).springify()}
        >
          <Pressable
            onPress={() => router.push("/spiritual/onboarding")}
            className="mb-6 items-center"
          >
            <Text
              className="text-[15px] font-semibold opacity-60"
              style={{ color: "#1C1C1E" }}
            >
              Redo Inner Calm Assessment
            </Text>
          </Pressable>
        </Animated.View>
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
