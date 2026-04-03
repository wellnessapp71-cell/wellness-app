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
import { getAuth } from "@/lib/user-store";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Activity,
  Dumbbell,
  Utensils,
  TrendingUp,
  Flame,
  LayoutList,
} from "lucide-react-native";

/* ──────────────────────────── Helpers ──────────────────────────── */

function toDayKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function calculateStreak(logs: any[]): number {
  const uniqueDays = Array.from(
    new Set(
      logs
        .map((log) => log?.recordedAt)
        .filter(Boolean)
        .map((value) => toDayKey(value as string)),
    ),
  ).sort((a, b) => (a < b ? 1 : -1));

  if (uniqueDays.length === 0) return 0;

  let streak = 1;
  let current = new Date(uniqueDays[0]);
  for (let i = 1; i < uniqueDays.length; i += 1) {
    const next = new Date(uniqueDays[i]);
    const diff = Math.round(
      (current.getTime() - next.getTime()) / 86400000,
    );
    if (diff === 1) {
      streak += 1;
      current = next;
    } else {
      break;
    }
  }
  return streak;
}

/* ──────────────────────────── Skeleton ──────────────────────────── */

function SkeletonBlock({
  width,
  height,
  borderRadius = 12,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
}) {
  return (
    <View
      style={{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: "#E5E5EA",
        opacity: 0.5,
      }}
    />
  );
}

/* ──────────────────────────── Screen ──────────────────────────── */

export default function TrackScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streak = useMemo(() => calculateStreak(logs), [logs]);

  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const statCardWidth =
    width < 390
      ? Math.floor((safeContentWidth - 12) / 2)
      : Math.floor((safeContentWidth - 16) / 2);

  async function loadProgress() {
    try {
      setLoading(true);
      setError(null);
      const auth = await getAuth();
      if (!auth?.userId) {
        setError("Please log in to track your progress.");
        setLogs([]);
        return;
      }
      const result = await api.get<any>(`/progress?userId=${auth.userId}`);
      setLogs(result?.items || []);
    } catch (err) {
      console.error("Failed to fetch progress logs:", err);
      setError("Unable to load progress right now.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgress();
  }, []);

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
            Your journey's milestones
          </Text>
        </Animated.View>

        {/* ── Stats Summary ── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(600).springify()}
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 32,
          }}
        >
          <View style={{ width: statCardWidth }}>
            <GlassCard
              className="p-5 items-start"
              style={{
                borderWidth: 1,
                borderColor: "rgba(0,122,255,0.2)",
                backgroundColor: "rgba(0,122,255,0.04)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Activity size={18} color="#007AFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontWeight: "700",
                    color: "#007AFF",
                    fontSize: 12,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Total Logs
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -1,
                }}
              >
                {logs.length}
              </Text>
            </GlassCard>
          </View>

          <View style={{ width: statCardWidth }}>
            <GlassCard
              className="p-5 items-start"
              style={{
                borderWidth: 1,
                borderColor: "rgba(255,149,0,0.2)",
                backgroundColor: "rgba(255,149,0,0.04)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <Flame size={18} color="#FF9500" strokeWidth={2.5} />
                <Text
                  style={{
                    fontWeight: "700",
                    color: "#FF9500",
                    fontSize: 12,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  Streak
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -1,
                }}
              >
                {streak}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#FF9500",
                    fontWeight: "600",
                    letterSpacing: 0,
                  }}
                >
                  Days
                </Text>
              </Text>
            </GlassCard>
          </View>
        </Animated.View>

        {/* ── Log History ── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(600).springify()}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#1C1C1E",
              letterSpacing: -0.3,
              marginBottom: 16,
            }}
          >
            History
          </Text>

          {error ? (
            <GlassCard
              className="p-4 items-center"
              style={{
                marginBottom: 12,
                backgroundColor: "rgba(255,59,48,0.08)",
                borderWidth: 1,
                borderColor: "rgba(255,59,48,0.2)",
              }}
            >
              <Text style={{ color: "#FF3B30", fontWeight: "600" }}>
                {error}
              </Text>
            </GlassCard>
          ) : null}

          {loading && logs.length === 0 ? (
            <View style={{ gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <SkeletonBlock
                  key={i}
                  width="100%"
                  height={80}
                  borderRadius={24}
                />
              ))}
            </View>
          ) : logs.length === 0 && !error ? (
            <GlassCard
              className="p-8 justify-center items-center"
              style={{
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "rgba(0,0,0,0.1)",
              }}
            >
              <LayoutList size={40} color="#D1D1D6" strokeWidth={1.5} />
              <Text
                style={{
                  color: "#8A8A8E",
                  fontWeight: "500",
                  marginTop: 16,
                  fontSize: 15,
                }}
              >
                No progress logged yet
              </Text>
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {logs.map((log, idx) => {
                const isWorkout = log.type === "workout";
                const isNutrition = log.type === "nutrition";
                const Icon = isWorkout
                  ? Dumbbell
                  : isNutrition
                    ? Utensils
                    : TrendingUp;
                const iconColor = isWorkout
                  ? "#FF2D55"
                  : isNutrition
                    ? "#34C759"
                    : "#5AC8FA";

                return (
                  <Animated.View
                    key={log.id}
                    entering={FadeInDown.delay(200 + idx * 40)
                      .duration(500)
                      .springify()}
                  >
                    <GlassCard
                      className="p-4 flex-row items-center"
                      style={{
                        gap: 16,
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.04)",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: iconColor + "15",
                        }}
                      >
                        <Icon size={22} color={iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "700",
                              color: "#1C1C1E",
                              fontSize: 16,
                              letterSpacing: -0.2,
                              textTransform: "capitalize",
                              flex: 1,
                            }}
                            numberOfLines={2}
                          >
                            {log.type} Log
                          </Text>
                          <Text
                            style={{
                              color: "#8A8A8E",
                              fontSize: 12,
                              fontWeight: "600",
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              flexShrink: 0,
                            }}
                          >
                            {new Date(log.recordedAt).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: "#3C3C43",
                            fontSize: 14,
                            lineHeight: 19,
                          }}
                          numberOfLines={2}
                        >
                          {log.data?.summary
                            ? "Weekly analysis completed"
                            : log.data?.entry
                              ? `Logged ${log.data.entry.calories} cal`
                              : "Progress snapshot saved."}
                        </Text>
                      </View>
                    </GlassCard>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
