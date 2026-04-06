import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GlassCard } from "@/components/ui/glass-card";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { getAuth, getProfile } from "@/lib/user-store";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Flame,
  Dumbbell,
  Droplets,
  Star,
} from "lucide-react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";

/* ──────────────────────────── Types ──────────────────────────── */

interface ScoreRun {
  createdAt: string;
  sleepScore: number;
  nutritionScore: number;
  hydrationScore: number;
  movementScore: number;
  digitalScore: number;
  natureScore: number;
  routineScore: number;
  totalScore: number;
}

interface LifestyleCheckin {
  date: string;
  waterMl: number;
  activeMinutes?: number;
  sleepHours?: number;
}

/* ──────────────────────────── Helpers ──────────────────────────── */

function toDayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function calculateStreak(dates: string[]): number {
  const uniqueDays = Array.from(new Set(dates.map(toDayKey))).sort(
    (a, b) => (a < b ? 1 : -1),
  );
  if (uniqueDays.length === 0) return 0;
  let streak = 1;
  let current = new Date(uniqueDays[0]);
  for (let i = 1; i < uniqueDays.length; i++) {
    const next = new Date(uniqueDays[i]);
    const diff = Math.round(
      (current.getTime() - next.getTime()) / 86400000,
    );
    if (diff === 1) {
      streak++;
      current = next;
    } else break;
  }
  return streak;
}

/* ──────────────────────────── Mini Line Chart ─────────────────── */

function MiniLineChart({
  data,
  color,
  label,
  width: chartWidth,
}: {
  data: number[];
  color: string;
  label: string;
  width: number;
}) {
  const H = 120;
  const PAD_LEFT = 30;
  const PAD_RIGHT = 12;
  const PAD_TOP = 24;
  const PAD_BOTTOM = 28;
  const drawW = chartWidth - PAD_LEFT - PAD_RIGHT;
  const drawH = H - PAD_TOP - PAD_BOTTOM;

  if (data.length === 0) {
    return (
      <View style={{ height: H, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#C7C7CC", fontSize: 13 }}>No data yet</Text>
      </View>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = PAD_LEFT + (data.length === 1 ? drawW / 2 : (i / (data.length - 1)) * drawW);
    const y = PAD_TOP + drawH - ((v - min) / range) * drawH;
    return { x, y, v };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  // Y-axis labels
  const yLabels = [max, Math.round((max + min) / 2), min];

  return (
    <View>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "700",
          color: "#1C1C1E",
          marginBottom: 8,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </Text>
      <Svg width={chartWidth} height={H}>
        {/* Grid lines */}
        {yLabels.map((val, i) => {
          const y = PAD_TOP + drawH - ((val - min) / range) * drawH;
          return (
            <View key={i}>
              <Line
                x1={PAD_LEFT}
                y1={y}
                x2={chartWidth - PAD_RIGHT}
                y2={y}
                stroke="#E5E5EA"
                strokeWidth={1}
              />
              <SvgText
                x={PAD_LEFT - 6}
                y={y + 4}
                fill="#8A8A8E"
                fontSize={10}
                textAnchor="end"
              >
                {val}
              </SvgText>
            </View>
          );
        })}
        {/* Line */}
        <Polyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Last point dot */}
        {last && (
          <Circle cx={last.x} cy={last.y} r={4} fill={color} />
        )}
      </Svg>
    </View>
  );
}

/* ──────────────────────────── Screen ──────────────────────────── */

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [checkinDates, setCheckinDates] = useState<string[]>([]);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [scoreHistory, setScoreHistory] = useState<ScoreRun[]>([]);

  const checkinStreak = useMemo(() => calculateStreak(checkinDates), [checkinDates]);
  const workoutStreak = useMemo(() => calculateStreak(workoutDates), [workoutDates]);

  const contentWidth = width - 48;
  const cardW = Math.floor((contentWidth - 12) / 2);
  const chartWidth = contentWidth;

  async function loadTrackingData() {
    try {
      setLoading(true);
      const auth = await getAuth();
      if (!auth?.userId) return;

      const [profile, checkinRes, progressRes, scoreRes] = await Promise.all([
        getProfile(),
        api
          .get<{ checkins: LifestyleCheckin[] }>(
            `/lifestyle/checkin/history?userId=${auth.userId}&days=30`,
          )
          .catch(() => ({ checkins: [] })),
        api
          .get<{ items: any[] }>(`/progress?userId=${auth.userId}&limit=50`)
          .catch(() => ({ items: [] })),
        api
          .get<{ scores: ScoreRun[] }>(
            `/lifestyle/score/history?userId=${auth.userId}&limit=30`,
          )
          .catch(() => ({ scores: [] })),
      ]);

      // Checkin streak from lifestyle checkins
      const cDates = (checkinRes.checkins ?? []).map((c) => c.date);
      setCheckinDates(cDates);

      // Workout streak from progress logs
      const wDates = (progressRes.items ?? [])
        .filter((p: any) => p.type === "workout")
        .map((p: any) => p.recordedAt)
        .filter(Boolean);
      setWorkoutDates(wDates);

      // Water: today's check-in or profile default
      const today = new Date().toISOString().slice(0, 10);
      const todayCheckin = (checkinRes.checkins ?? []).find(
        (c) => c.date === today,
      );
      if (todayCheckin) {
        setWaterGlasses(Math.round(todayCheckin.waterMl / 250));
      } else {
        setWaterGlasses(profile?.waterGlassesPerDay ?? 0);
      }

      // Overall score from profile
      const scores = profile
        ? [
            profile.scorePhysical ?? 0,
            profile.scoreMental ?? 0,
            profile.scoreSpiritual ?? 0,
            profile.scoreLifestyle ?? 0,
          ]
        : [0, 0, 0, 0];
      setOverallScore(Math.round(scores.reduce((a, b) => a + b, 0) / 4));

      // Score history for charts
      setScoreHistory(scoreRes.scores ?? []);
    } catch (err) {
      console.error("Track load error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrackingData();
  }, []);

  // Derive chart data from score history
  const physicalTrend = scoreHistory.map(
    (s) => Math.round((s.movementScore + s.hydrationScore) / 2),
  );
  const mentalTrend = scoreHistory.map(
    (s) => s.digitalScore,
  );
  const spiritualTrend = scoreHistory.map(
    (s) => s.natureScore,
  );
  const lifestyleTrend = scoreHistory.map(
    (s) => s.totalScore,
  );

  const STAT_CARDS = [
    {
      label: "Check-in Streak",
      value: checkinStreak,
      unit: "Days",
      Icon: Flame,
      color: "#FF9500",
    },
    {
      label: "Workout Streak",
      value: workoutStreak,
      unit: "Days",
      Icon: Dumbbell,
      color: "#FF2D55",
    },
    {
      label: "Water Today",
      value: waterGlasses,
      unit: "Glasses",
      Icon: Droplets,
      color: "#5AC8FA",
    },
    {
      label: "Overall Score",
      value: overallScore,
      unit: "/ 100",
      Icon: Star,
      color: "#AF52DE",
    },
  ];

  if (loading) {
    return (
      <SafeAreaView
        className="flex-1 bg-[#FAFAFC]"
        edges={["top", "left", "right"]}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFAFC]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View
          entering={FadeInDown.duration(600).springify()}
          style={{ paddingTop: 24, marginBottom: 28 }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: "700",
              color: "#1C1C1E",
              letterSpacing: -0.5,
              lineHeight: 38,
              marginBottom: 6,
            }}
          >
            Progress Tracking
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: "#8A8A8E",
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
          >
            Your journey at a glance
          </Text>
        </Animated.View>

        {/* ── Stat Cards Grid (2×2) ── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(600).springify()}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {STAT_CARDS.map((card, i) => (
            <View key={card.label} style={{ width: cardW }}>
              <GlassCard
                className="p-5 items-start"
                style={{
                  borderWidth: 1,
                  borderColor: `${card.color}33`,
                  backgroundColor: `${card.color}08`,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                  }}
                >
                  <card.Icon size={18} color={card.color} strokeWidth={2.5} />
                  <Text
                    style={{
                      fontWeight: "700",
                      color: card.color,
                      fontSize: 11,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                    }}
                    numberOfLines={1}
                  >
                    {card.label}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 34,
                    fontWeight: "700",
                    color: "#1C1C1E",
                    letterSpacing: -1,
                  }}
                >
                  {card.value}
                  {"  "}
                  <Text
                    style={{
                      fontSize: 15,
                      color: card.color,
                      fontWeight: "600",
                      letterSpacing: 0,
                    }}
                  >
                    {card.unit}
                  </Text>
                </Text>
              </GlassCard>
            </View>
          ))}
        </Animated.View>

        {/* ── Trend Charts ── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(600).springify()}
          style={{ marginBottom: 16 }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1C1C1E",
              letterSpacing: -0.3,
              marginBottom: 20,
            }}
          >
            Trends
          </Text>

          <View style={{ gap: 24 }}>
            <GlassCard
              className="p-4"
              style={{ borderWidth: 1, borderColor: "rgba(255,45,85,0.15)" }}
            >
              <MiniLineChart
                data={physicalTrend}
                color="#FF2D55"
                label="Physical"
                width={chartWidth - 32}
              />
            </GlassCard>

            <GlassCard
              className="p-4"
              style={{ borderWidth: 1, borderColor: "rgba(90,200,250,0.15)" }}
            >
              <MiniLineChart
                data={mentalTrend}
                color="#5AC8FA"
                label="Mental"
                width={chartWidth - 32}
              />
            </GlassCard>

            <GlassCard
              className="p-4"
              style={{ borderWidth: 1, borderColor: "rgba(175,82,222,0.15)" }}
            >
              <MiniLineChart
                data={spiritualTrend}
                color="#AF52DE"
                label="Spiritual"
                width={chartWidth - 32}
              />
            </GlassCard>

            <GlassCard
              className="p-4"
              style={{ borderWidth: 1, borderColor: "rgba(52,199,89,0.15)" }}
            >
              <MiniLineChart
                data={lifestyleTrend}
                color="#34C759"
                label="Lifestyle"
                width={chartWidth - 32}
              />
            </GlassCard>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
