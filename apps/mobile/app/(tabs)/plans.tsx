import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GlassCard } from "@/components/ui/glass-card";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getAuth, getProfile } from "@/lib/user-store";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import {
  Dumbbell,
  Wind,
  Utensils,
  LayoutList,
  ChevronRight,
} from "lucide-react-native";

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
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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

  useEffect(() => {
    loadPlans();
  }, []);

  async function generateWorkout() {
    setGenerating(true);
    try {
      setError(null);
      const [auth, profile] = await Promise.all([getAuth(), getProfile()]);
      if (!auth?.userId) {
        setError("Please log in to generate plans.");
        return;
      }
      await api.post("/workout", {
        profile: {
          userId: auth.userId,
          age: profile?.age ?? 28,
          gender: profile?.gender ?? "other",
          currentWeightKg: profile?.currentWeightKg ?? 70,
          hasHomeEquipment: profile?.hasHomeEquipment ?? false,
          hasGymAccess: profile?.hasGymAccess ?? false,
          goals: ["muscle_gain", "strength"],
          fitnessLevel: profile?.fitnessLevel ?? "intermediate",
          fitnessSublevel: 2,
        },
      });
      await loadPlans();
    } catch (err) {
      console.error(err);
      setError("Unable to generate workout plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateYoga() {
    setGenerating(true);
    try {
      setError(null);
      const [auth, profile] = await Promise.all([getAuth(), getProfile()]);
      if (!auth?.userId) {
        setError("Please log in to generate plans.");
        return;
      }
      await api.post("/yoga", {
        profile: {
          userId: auth.userId,
          fitnessLevel: profile?.fitnessLevel ?? "intermediate",
          goals: ["flexibility", "stress_reduction"],
        },
      });
      await loadPlans();
    } catch (err) {
      console.error(err);
      setError("Unable to generate yoga plan.");
    } finally {
      setGenerating(false);
    }
  }

  async function generateNutrition() {
    setGenerating(true);
    try {
      setError(null);
      const [auth, profile] = await Promise.all([getAuth(), getProfile()]);
      if (!auth?.userId) {
        setError("Please log in to generate plans.");
        return;
      }
      await api.post("/nutrition", {
        action: "build-meal-plan-prompt",
        input: {
          userId: auth.userId,
          age: profile?.age ?? 28,
          gender: profile?.gender ?? "other",
          heightCm: profile?.heightCm ?? 170,
          weightKg: profile?.currentWeightKg ?? 70,
          activityLevel: profile?.activityLevel ?? "moderate",
          diet: profile?.dietType ?? "omnivore",
          cuisine: "any",
          allergies: profile?.allergies ?? [],
          medicalConditions: profile?.medicalConditions ?? [],
          goal: "maintain",
          dislikes: [],
        },
      });
      await loadPlans();
    } catch (err) {
      console.error(err);
      setError("Unable to generate nutrition plan.");
    } finally {
      setGenerating(false);
    }
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
            Wellness Plans
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: "#8A8A8E",
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
          >
            Manage your personalized routines
          </Text>
        </Animated.View>

        {/* ── Generators ── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(600).springify()}
          style={{ marginBottom: 32 }}
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
            Generate New
          </Text>

          {generating ? (
            <Animated.View entering={FadeIn.duration(400)}>
              <GlassCard
                className="p-8 items-center"
                style={{
                  borderWidth: 1.5,
                  borderColor: "rgba(0,122,255,0.2)",
                  backgroundColor: "rgba(0,122,255,0.05)",
                }}
              >
                <ActivityIndicator size="large" color="#007AFF" />
                <Text
                  style={{
                    color: "#007AFF",
                    marginTop: 16,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Building your custom plan...
                </Text>
              </GlassCard>
            </Animated.View>
          ) : (
            <View style={{ gap: 12 }}>
              <GlassCard
                onPress={generateWorkout}
                className="p-4 flex-row items-center"
                style={{
                  gap: 16,
                  borderWidth: 1,
                  borderColor: "rgba(255,45,85,0.2)",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(255,45,85,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Dumbbell size={24} color="#FF2D55" strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#1C1C1E",
                      fontSize: 17,
                      letterSpacing: -0.3,
                      marginBottom: 2,
                    }}
                  >
                    Workout Plan
                  </Text>
                  <Text style={{ color: "#8A8A8E", fontSize: 13 }}>
                    Gym & home routines
                  </Text>
                </View>
                <ChevronRight size={20} color="#FF2D55" />
              </GlassCard>

              <GlassCard
                onPress={generateYoga}
                className="p-4 flex-row items-center"
                style={{
                  gap: 16,
                  borderWidth: 1,
                  borderColor: "rgba(90,200,250,0.2)",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(90,200,250,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Wind size={24} color="#5AC8FA" strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#1C1C1E",
                      fontSize: 17,
                      letterSpacing: -0.3,
                      marginBottom: 2,
                    }}
                  >
                    Yoga Flow
                  </Text>
                  <Text style={{ color: "#8A8A8E", fontSize: 13 }}>
                    Flexibility & balance
                  </Text>
                </View>
                <ChevronRight size={20} color="#5AC8FA" />
              </GlassCard>

              <GlassCard
                onPress={generateNutrition}
                className="p-4 flex-row items-center"
                style={{
                  gap: 16,
                  borderWidth: 1,
                  borderColor: "rgba(52,199,89,0.2)",
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    backgroundColor: "rgba(52,199,89,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Utensils size={24} color="#34C759" strokeWidth={2} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#1C1C1E",
                      fontSize: 17,
                      letterSpacing: -0.3,
                      marginBottom: 2,
                    }}
                  >
                    Meal Plan
                  </Text>
                  <Text style={{ color: "#8A8A8E", fontSize: 13 }}>
                    Tailored daily nutrition
                  </Text>
                </View>
                <ChevronRight size={20} color="#34C759" />
              </GlassCard>
            </View>
          )}
        </Animated.View>

        {/* ── Saved Plans ── */}
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
            Saved Plans
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

          {loading && plans.length === 0 ? (
            <View style={{ gap: 12 }}>
              {[1, 2].map((i) => (
                <SkeletonBlock
                  key={i}
                  width="100%"
                  height={100}
                  borderRadius={24}
                />
              ))}
            </View>
          ) : plans.length === 0 && !error ? (
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
                No plans generated yet
              </Text>
            </GlassCard>
          ) : (
            <View style={{ gap: 12 }}>
              {plans.map((plan, idx) => (
                <Animated.View
                  key={plan.id}
                  entering={FadeInDown.delay(200 + idx * 40)
                    .duration(500)
                    .springify()}
                >
                  <GlassCard
                    className="p-5"
                    style={{ borderWidth: 1, borderColor: "rgba(0,0,0,0.04)" }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 10,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#1C1C1E",
                          }}
                        />
                        <Text
                          style={{
                            fontWeight: "700",
                            color: "#1C1C1E",
                            fontSize: 17,
                            letterSpacing: -0.3,
                            textTransform: "capitalize",
                            flex: 1,
                          }}
                          numberOfLines={2}
                        >
                          {plan.type} Plan
                        </Text>
                      </View>
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
                      numberOfLines={3}
                    >
                      {typeof plan.content === "string"
                        ? plan.content
                        : JSON.stringify(plan.content)}
                    </Text>
                  </GlassCard>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
