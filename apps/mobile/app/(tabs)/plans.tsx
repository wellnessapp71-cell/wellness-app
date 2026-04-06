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
import { GlassCard } from "@/components/ui/glass-card";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { getAuth } from "@/lib/user-store";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Dumbbell,
  Wind,
  Utensils,
  LayoutList,
} from "lucide-react-native";

/* ──────────────────────────── Helpers ──────────────────────────── */

const PLAN_META: Record<string, { Icon: typeof Dumbbell; color: string; label: string }> = {
  workout: { Icon: Dumbbell, color: "#FF2D55", label: "Workout Plan" },
  yoga: { Icon: Wind, color: "#5AC8FA", label: "Yoga Flow" },
  nutrition: { Icon: Utensils, color: "#34C759", label: "Meal Plan" },
};

function planSummary(plan: any): string {
  const c = plan.content;
  if (!c) return "Plan saved.";
  if (typeof c === "string") return c;
  // workout plans
  if (c.weeklySchedule) {
    const days = Array.isArray(c.weeklySchedule) ? c.weeklySchedule.length : 0;
    return `${days}-day programme · ${c.fitnessLevel ?? ""} level`.trim();
  }
  // yoga plans
  if (c.sessions || c.poses) {
    const count = c.sessions?.length ?? c.poses?.length ?? 0;
    return `${count} sessions · ${c.goal ?? "flexibility"}`;
  }
  // nutrition / meal plan
  if (c.prompt || c.meals || c.dailyCalories) {
    return c.dailyCalories
      ? `${c.dailyCalories} cal/day · ${c.diet ?? "balanced"}`
      : "Personalised meal plan";
  }
  return JSON.stringify(c).slice(0, 120);
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

export default function PlansScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadPlans() {
    try {
      setLoading(true);
      setError(null);
      const auth = await getAuth();
      if (!auth?.userId) {
        setError("Please log in to view your plans.");
        setPlans([]);
        return;
      }
      const result = await api.get<any>(`/plans?userId=${auth.userId}`);
      setPlans(result?.items || []);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError("Unable to load plans right now.");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, []),
  );

  function navigateToPlan(plan: any) {
    const route =
      plan.type === "nutrition"
        ? "/physical/nutrition-plan"
        : "/physical/workout-plan";
    router.push({ pathname: route, params: { planId: plan.id } });
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
            My Plans
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: "#8A8A8E",
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
          >
            Your generated meal & workout plans
          </Text>
        </Animated.View>

        {/* ── Error ── */}
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

        {/* ── Plans list ── */}
        {loading && plans.length === 0 ? (
          <View style={{ gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <SkeletonBlock
                key={i}
                width="100%"
                height={100}
                borderRadius={24}
              />
            ))}
          </View>
        ) : plans.length === 0 && !error ? (
          <Animated.View entering={FadeInDown.delay(80).duration(600).springify()}>
            <GlassCard
              className="p-10 justify-center items-center"
              style={{
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: "rgba(0,0,0,0.1)",
              }}
            >
              <LayoutList size={48} color="#D1D1D6" strokeWidth={1.5} />
              <Text
                style={{
                  color: "#1C1C1E",
                  fontWeight: "700",
                  marginTop: 20,
                  fontSize: 17,
                  textAlign: "center",
                }}
              >
                No plans generated yet
              </Text>
              <Text
                style={{
                  color: "#8A8A8E",
                  fontWeight: "500",
                  marginTop: 8,
                  fontSize: 15,
                  textAlign: "center",
                  lineHeight: 22,
                  paddingHorizontal: 8,
                }}
              >
                Generate a new plan from{" "}
                <Text style={{ color: "#FF2D55", fontWeight: "700" }}>
                  Physical Hub
                </Text>
              </Text>
            </GlassCard>
          </Animated.View>
        ) : (
          <View style={{ gap: 14 }}>
            {plans.map((plan, idx) => {
              const meta = PLAN_META[plan.type] ?? {
                Icon: LayoutList,
                color: "#8A8A8E",
                label: `${plan.type} Plan`,
              };
              const { Icon, color, label } = meta;

              return (
                <Animated.View
                  key={plan.id}
                  entering={FadeInDown.delay(80 + idx * 50)
                    .duration(500)
                    .springify()}
                >
                  <Pressable onPress={() => navigateToPlan(plan)}>
                    <GlassCard
                      className="p-5 flex-row"
                      style={{
                        gap: 16,
                        borderWidth: 1,
                        borderColor: `${color}20`,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: `${color}15`,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={24} color={color} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "700",
                              color: "#1C1C1E",
                              fontSize: 17,
                              letterSpacing: -0.3,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {label}
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
                            {new Date(plan.createdAt).toLocaleDateString(
                              undefined,
                              { month: "short", day: "numeric" },
                            )}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: "#3C3C43",
                            fontSize: 14,
                            lineHeight: 20,
                          }}
                          numberOfLines={2}
                        >
                          {planSummary(plan)}
                        </Text>
                      </View>
                    </GlassCard>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
