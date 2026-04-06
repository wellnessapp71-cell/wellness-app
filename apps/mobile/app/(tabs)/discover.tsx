import {
  Alert,
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
import { GlassCard } from "@/components/ui/glass-card";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  CalendarDays,
  BookOpen,
  Quote,
  Mail,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";

/* ──────────────────────────── Types ──────────────────────────── */

interface Seminar {
  id: string;
  title: string;
  message: string;
  scheduledFor: string;
  audience: string;
}

/* ──────────────────────────── Mock fallback data ───────────────── */

const MOCK_SEMINARS: Seminar[] = [
  {
    id: "mock-1",
    title: "Mindful Leadership in Tech",
    message: "Join Dr. Sarah Chen for an interactive session on mindfulness practices for tech professionals.",
    scheduledFor: new Date(Date.now() + 86400000).toISOString(),
    audience: "all",
  },
  {
    id: "mock-2",
    title: "Nutrition for Peak Performance",
    message: "Learn evidence-based nutrition strategies to boost your energy and focus throughout the day.",
    scheduledFor: new Date(Date.now() + 86400000 * 5).toISOString(),
    audience: "all",
  },
  {
    id: "mock-3",
    title: "Stress Management Workshop",
    message: "Practical tools and techniques to manage workplace stress effectively.",
    scheduledFor: new Date(Date.now() + 86400000 * 12).toISOString(),
    audience: "all",
  },
];

const GRADIENT_PAIRS: [string, string][] = [
  ["#5E5CE6", "#AF52DE"],
  ["#34C759", "#30B0C7"],
  ["#FF9500", "#FF2D55"],
  ["#007AFF", "#5AC8FA"],
];

const ARTICLES = [
  {
    id: 1,
    title: "The Science of Deep Sleep & Recovery",
    readTime: "5 min",
    category: "Lifestyle",
  },
  {
    id: 2,
    title: "Gut-Brain Axis: Nutrition Basics",
    readTime: "8 min",
    category: "Physical",
  },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

function formatSeminarDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ──────────────────────────── Screen ──────────────────────────── */

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = Math.max(Math.min(width * 0.75, 360), 260);

  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    loadSeminars();
  }, []);

  async function loadSeminars() {
    try {
      setLoading(true);
      const res = await api.get<{ webinars: Seminar[] }>("/web/webinars?limit=10");
      const items = res?.webinars ?? [];
      if (items.length > 0) {
        setSeminars(items);
        setUsingMock(false);
      } else {
        setSeminars(MOCK_SEMINARS);
        setUsingMock(true);
      }
    } catch (err) {
      recordFailedSync("discover seminars fetch", err);
      setSeminars(MOCK_SEMINARS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }

  function showComingSoon(feature: string) {
    Alert.alert(
      "Coming soon",
      `${feature} will be available in a future update.`,
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
            Discover
          </Text>
          <Text
            style={{
              fontSize: 17,
              color: "#8A8A8E",
              fontWeight: "500",
              letterSpacing: -0.2,
            }}
          >
            Seminars, retreats, and daily insights
          </Text>
        </Animated.View>

        {/* ── Newsletter ── */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(600).springify()}
          style={{ marginBottom: 32 }}
        >
          <GlassCard
            className="overflow-hidden"
            style={{
              borderWidth: 1,
              borderColor: "#1C1C1E",
              backgroundColor: "#1C1C1E",
            }}
          >
            <LinearGradient
              colors={["#1C1C1E", "#2C2C2E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 24 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <Mail size={20} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontWeight: "700",
                    color: "#FFFFFF",
                    fontSize: 18,
                    letterSpacing: -0.3,
                  }}
                >
                  Weekly Digest
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: "rgba(255,255,255,0.8)",
                  marginTop: 4,
                  marginBottom: 20,
                  lineHeight: 20,
                }}
              >
                Curated wellness tips, science-backed protocols, and event
                invitations delivered to your inbox.
              </Text>
              <Pressable
                onPress={() => showComingSoon("Newsletter subscriptions")}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 24,
                  borderRadius: 14,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Text
                  style={{
                    color: "#1C1C1E",
                    fontSize: 15,
                    fontWeight: "700",
                  }}
                >
                  Subscribe Free
                </Text>
              </Pressable>
            </LinearGradient>
          </GlassCard>
        </Animated.View>

        {/* ── Seminars / Events ── */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(600).springify()}
          style={{ marginBottom: 32 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1C1C1E",
                letterSpacing: -0.3,
              }}
            >
              Upcoming Seminars
            </Text>
            {usingMock && !loading && (
              <View
                style={{
                  backgroundColor: "rgba(255,149,0,0.12)",
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: "#FF9500",
                    fontSize: 11,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  Sample
                </Text>
              </View>
            )}
          </View>

          {loading ? (
            <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingRight: 24,
                gap: 16,
              }}
              snapToInterval={CARD_WIDTH + 16}
              decelerationRate="fast"
            >
              {seminars.map((seminar, idx) => {
                const [color1, color2] = GRADIENT_PAIRS[idx % GRADIENT_PAIRS.length];
                return (
                  <GlassCard
                    key={seminar.id}
                    className="overflow-hidden"
                    style={{
                      width: CARD_WIDTH,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.04)",
                    }}
                  >
                    <LinearGradient
                      colors={[color1, color2]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        height: 140,
                        padding: 16,
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ alignItems: "flex-end" }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "rgba(255,255,255,0.2)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <CalendarDays size={20} color="#FFFFFF" />
                        </View>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <View
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            backgroundColor: "rgba(0,0,0,0.3)",
                            borderRadius: 20,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "700",
                              color: "#FFFFFF",
                              textTransform: "uppercase",
                              letterSpacing: 1.5,
                            }}
                          >
                            Seminar
                          </Text>
                        </View>
                        {seminar.audience !== "all" && (
                          <View
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: "rgba(0,0,0,0.3)",
                              borderRadius: 20,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: "#FFFFFF",
                                textTransform: "uppercase",
                                letterSpacing: 1.5,
                              }}
                            >
                              {seminar.audience}
                            </Text>
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                    <View style={{ padding: 20 }}>
                      <Text
                        style={{
                          fontWeight: "700",
                          color: "#1C1C1E",
                          fontSize: 18,
                          lineHeight: 22,
                          marginBottom: 6,
                        }}
                        numberOfLines={2}
                      >
                        {seminar.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: "#8A8A8E",
                          fontWeight: "500",
                          lineHeight: 20,
                        }}
                        numberOfLines={2}
                      >
                        {seminar.message}
                      </Text>
                      <View
                        style={{
                          marginTop: 16,
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: "rgba(0,0,0,0.04)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#FF2D55",
                          }}
                        >
                          {formatSeminarDate(seminar.scheduledFor)}
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── Articles ── */}
        <Animated.View
          entering={FadeInDown.delay(240).duration(600).springify()}
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
            Editor's Picks
          </Text>
          <GlassCard
            className="overflow-hidden"
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.04)",
            }}
          >
            {ARTICLES.map((article, idx) => (
              <Pressable
                key={article.id}
                onPress={() => showComingSoon("Article details")}
                style={{
                  padding: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 16,
                  borderBottomWidth:
                    idx !== ARTICLES.length - 1 ? 1 : 0,
                  borderBottomColor: "rgba(0,0,0,0.03)",
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "rgba(0,122,255,0.1)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <BookOpen size={24} color="#007AFF" strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: "#FF9500",
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      marginBottom: 4,
                    }}
                  >
                    {article.category}
                  </Text>
                  <Text
                    style={{
                      fontWeight: "700",
                      color: "#1C1C1E",
                      fontSize: 16,
                      lineHeight: 21,
                    }}
                    numberOfLines={2}
                  >
                    {article.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#8A8A8E",
                      marginTop: 6,
                      fontWeight: "500",
                    }}
                  >
                    {article.readTime} read
                  </Text>
                </View>
                <ChevronRight size={20} color="#D1D1D6" />
              </Pressable>
            ))}
          </GlassCard>
        </Animated.View>

        {/* ── Testimonial ── */}
        <Animated.View
          entering={FadeInDown.delay(320).duration(600).springify()}
        >
          <GlassCard
            className="p-8 items-center"
            style={{
              borderWidth: 1,
              borderColor: "rgba(0,0,0,0.04)",
              backgroundColor: "rgba(250,250,252,1)",
            }}
          >
            <Quote size={28} color="#D1D1D6" style={{ marginBottom: 16 }} />
            <Text
              style={{
                fontSize: 16,
                color: "#1C1C1E",
                fontWeight: "500",
                lineHeight: 24,
                textAlign: "center",
                fontStyle: "italic",
                marginBottom: 20,
              }}
            >
              "Aura completely transformed how our team manages stress. The
              daily wellness wheel checks are game-changing."
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontWeight: "700", color: "#1C1C1E", fontSize: 15 }}
                >
                  S
                </Text>
              </View>
              <View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#1C1C1E",
                  }}
                >
                  Sarah Jenkins
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#8A8A8E",
                    marginTop: 2,
                  }}
                >
                  HR Director
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
