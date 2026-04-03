import {
  Alert,
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
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  CalendarDays,
  BookOpen,
  Quote,
  Mail,
  ChevronRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

/* ──────────────────────────── Data ──────────────────────────── */

const EVENTS = [
  {
    id: 1,
    title: "Mindful Leadership in Tech",
    expert: "Dr. Sarah Chen",
    time: "Tomorrow, 2:00 PM",
    tags: ["Webinar"],
    color1: "#5E5CE6",
    color2: "#AF52DE",
  },
  {
    id: 2,
    title: "Bali Healing Retreat '26",
    expert: "Lumina Wellness",
    time: "Nov 12 - 16",
    tags: ["Retreat", "Paid"],
    color1: "#34C759",
    color2: "#30B0C7",
  },
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

/* ──────────────────────────── Screen ──────────────────────────── */

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const CARD_WIDTH = Math.max(Math.min(width * 0.75, 360), 260);

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
            Webinars, retreats, and daily insights
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

        {/* ── Events ── */}
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
              Upcoming Events
            </Text>
            <Pressable
              onPress={() => showComingSoon("Event directory")}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{
                  color: "#007AFF",
                  fontSize: 15,
                  fontWeight: "600",
                }}
              >
                See All
              </Text>
            </Pressable>
          </View>

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
            {EVENTS.map((event) => (
              <GlassCard
                key={event.id}
                className="overflow-hidden"
                style={{
                  width: CARD_WIDTH,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.04)",
                }}
              >
                <LinearGradient
                  colors={[event.color1, event.color2]}
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
                    {event.tags.map((tag) => (
                      <View
                        key={tag}
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
                          {tag}
                        </Text>
                      </View>
                    ))}
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
                    {event.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#8A8A8E",
                      fontWeight: "500",
                    }}
                    numberOfLines={1}
                  >
                    With {event.expert}
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
                      {event.time}
                    </Text>
                  </View>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
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
