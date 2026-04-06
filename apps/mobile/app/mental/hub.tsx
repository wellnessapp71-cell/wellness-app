import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
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
import { MentalScoreRing } from "@/components/mental/MentalScoreRing";
import { MetricCard } from "@/components/mental/MetricCard";
import { ActionCard } from "@/components/mental/ActionCard";
import {
  getEmployeeWorkspace,
  getProfile,
  syncFromApi,
  type EmployeeWorkspace,
} from "@/lib/user-store";
import {
  getMentalBaseline,
  getMentalCheckInHistory,
  getLatestRppgScan,
  getCurrentMentalPlan,
  getLatestWeeklyReview,
} from "@/lib/mental-store";
import { recommendForUser } from "@aura/mental-engine";
import type {
  MentalBaseline,
  MentalDailyCheckIn,
  RppgScanResult,
  MentalWellnessPlan,
  InterventionRecommendation,
} from "@aura/types";
import Animated, {
  FadeInDown,
  LinearTransition,
} from "react-native-reanimated";
import { captureError } from "@/lib/error-reporting";
import {
  ChevronLeft,
  Lock,
  Camera,
  ClipboardCheck,
  BookOpen,
  Users,
  MessageCircle,
  Smile,
  Frown,
  BrainCircuit,
  Moon,
  Target,
  BarChart2,
  Lightbulb,
  BookMarked,
} from "lucide-react-native";

export default function MentalHubScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [score, setScore] = useState(0);
  const [previousScore, setPreviousScore] = useState<number | undefined>();
  const [latestCheckIn, setLatestCheckIn] = useState<MentalDailyCheckIn | null>(
    null,
  );
  const [latestScan, setLatestScan] = useState<RppgScanResult | null>(null);
  const [plan, setPlan] = useState<MentalWellnessPlan | null>(null);
  const [recommendation, setRecommendation] =
    useState<InterventionRecommendation | null>(null);
  const [baseline, setBaseline] = useState<MentalBaseline | null>(null);
  const [workspace, setWorkspace] = useState<EmployeeWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const isCompact = width < 390;
  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const twoColCardWidth = Math.floor((safeContentWidth - 12) / 2);
  const threeColCardWidth = Math.floor((safeContentWidth - 24) / 3);
  const quickActionCardWidth = isCompact ? twoColCardWidth : threeColCardWidth;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const synced = await syncFromApi();
          const profile = await getProfile();
          const storedWorkspace = await getEmployeeWorkspace();
          if (profile) {
            setScore(profile.scoreMental);
          }

          const bl = await getMentalBaseline();
          setBaseline(bl);

          const checkIns = await getMentalCheckInHistory(7);
          const scan = await getLatestRppgScan();
          const currentPlan = await getCurrentMentalPlan();
          const weeklyReview = await getLatestWeeklyReview();

          setLatestCheckIn(checkIns[checkIns.length - 1] ?? null);
          setLatestScan(scan);
          setPlan(currentPlan);
          setWorkspace(synced?.employeeWorkspace ?? storedWorkspace);

          if (weeklyReview?.trend) {
            const prevMoodAvg =
              weeklyReview.trend.moodTrend.reduce((a, b) => a + b, 0) / 7;
            setPreviousScore(Math.round(prevMoodAvg * 10));
          }

          if (bl) {
            try {
              const recs = recommendForUser(
                bl,
                scan?.stressIndex ?? bl.stressBase * 10,
              );
              setRecommendation(recs[0] ?? null);
            } catch (err) { captureError(err, { context: "mental recommendation engine" }); }
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
  const latestSupportRequest = workspace?.supportRequests[0] ?? null;
  const latestWebinar = workspace?.webinars[0] ?? null;

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
            <ActivityIndicator size="large" color="#007AFF" />
            <Text className="text-[14px] text-[#8A8A8E] mt-4 font-medium">Loading your mental hub…</Text>
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
          <View className="px-3 py-1.5 rounded-full border border-[#007AFF]/20 bg-[#007AFF]/10 flex-row items-center gap-1.5">
            <Lock size={12} color="#007AFF" strokeWidth={3} />
            <Text className="text-[12px] font-bold text-[#007AFF] uppercase tracking-widest">
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
            How are you feeling right now?
          </Text>
        </Animated.View>

        {/* Start Stress Scan */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(800).springify()}
          className="mb-6"
        >
          <Pressable onPress={() => router.push("/mental/scan")}>
            <GlassCard
              className="p-6 items-center border border-[#007AFF]/20"
              style={{ backgroundColor: "#007AFF08" }}
            >
              <View className="w-16 h-16 rounded-full bg-[#007AFF]/10 items-center justify-center mb-3">
                <Camera size={32} color="#007AFF" strokeWidth={1.5} />
              </View>
              <Text className="text-[20px] font-bold text-[#007AFF] tracking-tight mb-1">
                Start Stress Scan
              </Text>
              <Text className="text-[14px] text-[#8A8A8E] font-medium text-center">
                Measure your heart rate to detect stress
              </Text>
            </GlassCard>
          </Pressable>
        </Animated.View>

        {/* Mental Wellness Ring */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(800).springify()}
          className="mb-8"
        >
          <GlassCard className="p-6 items-center border border-black/5 bg-white/60">
            <MentalScoreRing score={score} previousScore={previousScore} />
          </GlassCard>
        </Animated.View>

        {/* Secondary Metric Cards — 2x2 grid */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Recent Metrics
          </Text>
          <View className="flex-row gap-3 mb-3 justify-between">
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 border border-black/5 bg-white/60">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-10 h-10 rounded-full bg-[#5AC8FA]/10 items-center justify-center">
                    <Smile size={20} color="#5AC8FA" strokeWidth={2.5} />
                  </View>
                  <Text className="text-[24px] font-bold text-[#1C1C1E]">
                    {latestCheckIn ? `${latestCheckIn.moodScore}` : "—"}
                  </Text>
                </View>
                <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-0.5">
                  Mood
                </Text>
                <Text className="text-[12px] text-[#C6C6C8] font-medium leading-tight">
                  {latestCheckIn ? "Today" : "No check-in"}
                </Text>
              </GlassCard>
            </View>

            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 border border-black/5 bg-white/60">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-10 h-10 rounded-full bg-[#FF3B30]/10 items-center justify-center">
                    <BrainCircuit size={20} color="#FF3B30" strokeWidth={2.5} />
                  </View>
                  <Text className="text-[24px] font-bold text-[#1C1C1E]">
                    {latestScan
                      ? `${latestScan.stressIndex}`
                      : latestCheckIn
                        ? `${latestCheckIn.stressScoreManual}`
                        : "—"}
                  </Text>
                </View>
                <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-0.5">
                  Stress
                </Text>
                <Text className="text-[12px] text-[#C6C6C8] font-medium leading-tight">
                  {latestScan ? "rPPG" : "Self-rated"}
                </Text>
              </GlassCard>
            </View>
          </View>
          <View className="flex-row gap-3 justify-between">
            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 border border-black/5 bg-white/60">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-10 h-10 rounded-full bg-[#5E5CE6]/10 items-center justify-center">
                    <Moon size={20} color="#5E5CE6" strokeWidth={2.5} />
                  </View>
                  <Text className="text-[24px] font-bold text-[#1C1C1E]">
                    {latestCheckIn ? `${latestCheckIn.sleepHours}h` : "—"}
                  </Text>
                </View>
                <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-0.5">
                  Sleep
                </Text>
                <Text className="text-[12px] text-[#C6C6C8] font-medium leading-tight">
                  {latestCheckIn ? "Last night" : "No check-in"}
                </Text>
              </GlassCard>
            </View>

            <View style={{ width: twoColCardWidth }}>
              <GlassCard className="p-4 border border-black/5 bg-white/60">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-10 h-10 rounded-full bg-[#007AFF]/10 items-center justify-center">
                    <Target size={20} color="#007AFF" strokeWidth={2.5} />
                  </View>
                  <Text className="text-[24px] font-bold text-[#1C1C1E]">
                    {latestCheckIn ? `${latestCheckIn.focusScore}` : "—"}
                  </Text>
                </View>
                <Text className="text-[13px] font-bold text-[#8A8A8E] uppercase tracking-wider mb-0.5">
                  Focus
                </Text>
                <Text className="text-[12px] text-[#C6C6C8] font-medium leading-tight">
                  {latestCheckIn ? "Today" : "No check-in"}
                </Text>
              </GlassCard>
            </View>
          </View>
        </Animated.View>

        {(latestSupportRequest || latestWebinar) && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="mb-8"
          >
            <GlassCard className="p-5 border border-black/5 bg-white/60">
              <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-4">
                Shared Care Updates
              </Text>
              {latestSupportRequest ? (
                <View className="mb-4 rounded-2xl bg-[#007AFF]/5 border border-[#007AFF]/10 p-4">
                  <Text className="text-[16px] font-bold text-[#1C1C1E] capitalize mb-1 leading-6">
                    {latestSupportRequest.issueType.replace(/_/g, " ")} ·{" "}
                    <Text className="text-[#007AFF]">
                      {latestSupportRequest.status.replace(/_/g, " ")}
                    </Text>
                  </Text>
                  <Text className="text-[14px] text-[#3C3C43] mb-3 leading-5">
                    {latestSupportRequest.psychologistName
                      ? `Psychologist: ${latestSupportRequest.psychologistName}`
                      : "Awaiting psychologist assignment"}
                  </Text>
                  {latestSupportRequest.scheduledForIso ? (
                    <Text className="text-[13px] text-[#8A8A8E] mb-3 font-medium">
                      Scheduled:{" "}
                      {new Date(
                        latestSupportRequest.scheduledForIso,
                      ).toLocaleString()}
                    </Text>
                  ) : null}
                  {latestSupportRequest.meetingUrl ? (
                    <Pressable
                      onPress={() =>
                        void Linking.openURL(latestSupportRequest.meetingUrl!)
                      }
                      className="rounded-xl bg-[#007AFF] py-3 items-center mt-1"
                    >
                      <Text className="text-[15px] font-bold text-white">
                        Join Telehealth Session
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              {latestWebinar ? (
                <View className="rounded-2xl bg-[#34C759]/5 border border-[#34C759]/10 p-4">
                  <Text className="text-[11px] font-bold text-[#34C759] uppercase tracking-widest mb-1.5">
                    Internal Comms
                  </Text>
                  <Text className="text-[16px] font-bold text-[#1C1C1E] mb-2 leading-6">
                    {latestWebinar.title}
                  </Text>
                  <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
                    {latestWebinar.message}
                  </Text>
                </View>
              ) : null}
            </GlassCard>
          </Animated.View>
        )}

        {/* Next Best Action */}
        {recommendation && (
          <Animated.View
            entering={FadeInDown.delay(350).duration(800).springify()}
            className="mb-8"
          >
            <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
              Recommended for You
            </Text>
            <ActionCard
              icon="🌬️"
              title={recommendation.title}
              description={recommendation.description}
              actionLabel="Start Exercise"
              color="#007AFF"
              onPress={() => router.push("/mental/calm-toolkit")}
            />
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(800).springify()}
          className="mb-8"
        >
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-4">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <Pressable
              onPress={() => router.push("/mental/checkin")}
              style={{ width: quickActionCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[112px] justify-center border border-black/5 bg-white/60">
                <ClipboardCheck size={28} color="#FF9500" strokeWidth={2} />
                <Text className="text-[14px] font-bold text-[#1C1C1E] mt-3 mb-1 text-center">
                  Check-in
                </Text>
                <Text className="text-[12px] text-[#8A8A8E] font-medium text-center leading-4">
                  30 seconds
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/mental/journal")}
              style={{ width: quickActionCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[112px] justify-center border border-black/5 bg-white/60">
                <BookOpen size={28} color="#007AFF" strokeWidth={2} />
                <Text className="text-[14px] font-bold text-[#1C1C1E] mt-3 mb-1 text-center">
                  Journal
                </Text>
                <Text className="text-[12px] text-[#8A8A8E] font-medium text-center leading-4">
                  Write it out
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/mental/booking")}
              style={{ width: quickActionCardWidth }}
            >
              <GlassCard className="p-4 items-center min-h-[112px] justify-center border border-black/5 bg-white/60">
                <Users size={28} color="#5E5CE6" strokeWidth={2} />
                <Text className="text-[14px] font-bold text-[#1C1C1E] mt-3 mb-1 text-center">
                  Get Help
                </Text>
                <Text className="text-[12px] text-[#8A8A8E] font-medium text-center leading-4">
                  Talk to pro
                </Text>
              </GlassCard>
            </Pressable>
          </View>
        </Animated.View>

        {/* Plan Summary */}
        {plan && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(800).springify()}
            className="mb-8"
          >
            <GlassCard className="p-5 border border-black/5 bg-white/60">
              <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-3">
                Current Focus
              </Text>
              <Text className="text-[18px] font-bold text-[#1C1C1E] mb-3 leading-snug">
                {plan.focusAreas
                  .slice(0, 2)
                  .map((a) => a.replace(/_/g, " "))
                  .join(", ")}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {plan.weeklyGoals.slice(0, 3).map((goal) => (
                  <View
                    key={goal}
                    className="bg-[#007AFF]/10 border border-[#007AFF]/10 px-3 py-1.5 rounded-lg"
                  >
                    <Text className="text-[12px] font-bold text-[#007AFF]">
                      {goal}
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
              onPress={() => router.push("/mental/weekly-review")}
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
              onPress={() => router.push("/mental/insights")}
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
              onPress={() => router.push("/mental/learning")}
              style={{ width: twoColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60 flex-row justify-center gap-2">
                <BookMarked size={20} color="#34C759" strokeWidth={2.5} />
                <Text className="text-[14px] font-bold text-[#1C1C1E]">
                  Learn
                </Text>
              </GlassCard>
            </Pressable>
            <Pressable
              onPress={() => router.push("/mental/community")}
              style={{ width: twoColCardWidth }}
            >
              <GlassCard className="p-4 items-center border border-black/5 bg-white/60 flex-row justify-center gap-2">
                <MessageCircle size={20} color="#5AC8FA" strokeWidth={2.5} />
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
            onPress={() => router.push("/mental/onboarding")}
            className="mb-6 items-center"
          >
            <Text className="text-[15px] font-semibold text-[#1C1C1E] opacity-60">
              Redo Mental Assessment
            </Text>
          </Pressable>
        </Animated.View>
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
