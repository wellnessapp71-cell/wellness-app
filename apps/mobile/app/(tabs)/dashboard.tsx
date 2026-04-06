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
import Svg, {
  Path,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getAuth,
  getEmployeeWorkspace,
  getProfile,
  syncFromApi,
  type EmployeeWorkspace,
} from "@/lib/user-store";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  Activity,
  BrainCircuit,
  Sparkles,
  Leaf,
  Camera,
  HeartHandshake,
  Wind,
  ChevronRight,
  Building,
} from "lucide-react-native";

/* ──────────────────────────── Constants ──────────────────────────── */

const PILLARS = [
  { key: "physical", label: "Physical", color: "#FF2D55", Icon: Activity },
  { key: "mental", label: "Mental", color: "#5AC8FA", Icon: BrainCircuit },
  { key: "spiritual", label: "Spiritual", color: "#5E5CE6", Icon: Sparkles },
  { key: "lifestyle", label: "Lifestyle", color: "#34C759", Icon: Leaf },
] as const;

/* ──────────────────────────── SVG Helpers ──────────────────────────── */

function describeDonutSegment(
  index: number,
  total: number,
  fillRatio: number,
  outerR: number,
  innerR: number,
  cx: number,
  cy: number,
  gapAngle = 0.08,
): string {
  const sliceAngle = (2 * Math.PI) / total;
  const startAngle = index * sliceAngle - Math.PI / 2 + gapAngle / 2;
  const endAngle = startAngle + sliceAngle - gapAngle;
  const fillR = innerR + (outerR - innerR) * Math.max(0.05, fillRatio);

  const x1 = cx + fillR * Math.cos(startAngle);
  const y1 = cy + fillR * Math.sin(startAngle);
  const x2 = cx + fillR * Math.cos(endAngle);
  const y2 = cy + fillR * Math.sin(endAngle);
  const xi1 = cx + innerR * Math.cos(startAngle);
  const yi1 = cy + innerR * Math.sin(startAngle);
  const xi2 = cx + innerR * Math.cos(endAngle);
  const yi2 = cy + innerR * Math.sin(endAngle);

  return `M ${xi1} ${yi1} L ${x1} ${y1} A ${fillR} ${fillR} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 0 0 ${xi1} ${yi1} Z`;
}

function describeTrackSegment(
  index: number,
  total: number,
  outerR: number,
  innerR: number,
  cx: number,
  cy: number,
  gapAngle = 0.08,
): string {
  const sliceAngle = (2 * Math.PI) / total;
  const startAngle = index * sliceAngle - Math.PI / 2 + gapAngle / 2;
  const endAngle = startAngle + sliceAngle - gapAngle;

  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);
  const xi1 = cx + innerR * Math.cos(startAngle);
  const yi1 = cy + innerR * Math.sin(startAngle);
  const xi2 = cx + innerR * Math.cos(endAngle);
  const yi2 = cy + innerR * Math.sin(endAngle);

  return `M ${xi1} ${yi1} L ${x1} ${y1} A ${outerR} ${outerR} 0 0 1 ${x2} ${y2} L ${xi2} ${yi2} A ${innerR} ${innerR} 0 0 0 ${xi1} ${yi1} Z`;
}

/* ──────────────────────────── Skeleton ──────────────────────────── */

function SkeletonBlock({
  width,
  height,
  borderRadius = 12,
  style,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: "#E5E5EA",
          opacity: 0.5,
        },
        style,
      ]}
    />
  );
}

function DashboardSkeleton() {
  return (
    <View style={{ gap: 24, paddingTop: 24 }}>
      {/* Header skeleton */}
      <View style={{ gap: 8 }}>
        <SkeletonBlock width={180} height={32} borderRadius={8} />
        <SkeletonBlock width={120} height={32} borderRadius={8} />
      </View>
      {/* Wellness wheel skeleton */}
      <View
        style={{
          alignItems: "center",
          gap: 16,
        }}
      >
        <SkeletonBlock width="100%" height={24} borderRadius={8} />
        <GlassCard className="p-6 items-center w-full">
          <SkeletonBlock width={220} height={220} borderRadius={110} />
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginTop: 24,
              justifyContent: "center",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBlock key={i} width={64} height={32} borderRadius={16} />
            ))}
          </View>
        </GlassCard>
      </View>
      {/* CTA skeletons */}
      <View style={{ gap: 12 }}>
        <SkeletonBlock width="100%" height={72} borderRadius={24} />
        <SkeletonBlock width="100%" height={72} borderRadius={24} />
      </View>
    </View>
  );
}

/* ──────────────────────────── Screen ──────────────────────────── */

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState({
    physical: 50,
    mental: 50,
    spiritual: 50,
    lifestyle: 50,
  });
  const [userName, setUserName] = useState("there");
  const [physicalDone, setPhysicalDone] = useState(false);
  const [mentalDone, setMentalDone] = useState(false);
  const [spiritualDone, setSpiritualDone] = useState(false);
  const [lifestyleDone, setLifestyleDone] = useState(false);
  const [workspace, setWorkspace] = useState<EmployeeWorkspace | null>(null);

  const contentWidth = width - 48;
  const safeContentWidth = Math.max(contentWidth, 280);
  const isCompact = width < 390;
  const quickActionCardWidth = isCompact
    ? Math.floor((safeContentWidth - 12) / 2)
    : Math.floor((safeContentWidth - 24) / 3);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          const synced = await syncFromApi();
          const [auth, profile, storedWorkspace] = await Promise.all([
            getAuth(),
            getProfile(),
            getEmployeeWorkspace(),
          ]);
          if (profile) {
            setScores({
              physical: profile.scorePhysical,
              mental: profile.scoreMental,
              spiritual: profile.scoreSpiritual,
              lifestyle: profile.scoreLifestyle,
            });
            setPhysicalDone(profile.physicalOnboardingDone);
            setMentalDone(profile.mentalOnboardingDone);
            setSpiritualDone(profile.spiritualOnboardingDone);
            setLifestyleDone(profile.lifestyleOnboardingDone ?? false);
          }
          if (auth?.name) setUserName(auth.name.split(" ")[0] ?? auth.name);
          setWorkspace(synced?.employeeWorkspace ?? storedWorkspace);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  /* ── Wheel geometry ── */
  const size = Math.min(Math.max(safeContentWidth - 24, 220), 320);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.4;
  const innerR = size * 0.22;
  const total = PILLARS.length;

  function handleSegmentPress(index: number) {
    const pillar = PILLARS[index];
    if (pillar.key === "physical") {
      router.push(physicalDone ? "/physical/hub" : "/physical/questionnaire");
    } else if (pillar.key === "mental") {
      router.push(mentalDone ? "/mental/hub" : "/mental/onboarding");
    } else if (pillar.key === "spiritual") {
      router.push(spiritualDone ? "/spiritual/hub" : "/spiritual/onboarding");
    } else if (pillar.key === "lifestyle") {
      router.push(lifestyleDone ? "/lifestyle/hub" : "/lifestyle/onboarding");
    }
  }

  const overall = Math.round(
    (scores.physical + scores.mental + scores.spiritual + scores.lifestyle) / 4,
  );
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const latestWebinar = workspace?.webinars[0] ?? null;
  const activeSupportRequest =
    workspace?.supportRequests.find(
      (r) => !["completed", "cancelled"].includes(r.status),
    ) ?? null;

  /* ── Pending onboarding items ── */
  const pendingCTAs = [
    ...(!physicalDone
      ? [
          {
            key: "physical",
            title: "Physical Assessment",
            sub: "Gym, yoga & nutrition plans",
            color: "#FF2D55",
            Icon: Activity,
            route: "/physical/questionnaire" as const,
          },
        ]
      : []),
    ...(!mentalDone
      ? [
          {
            key: "mental",
            title: "Mental Assessment",
            sub: "Mental wellness tools & therapy",
            color: "#5AC8FA",
            Icon: BrainCircuit,
            route: "/mental/onboarding" as const,
          },
        ]
      : []),
    ...(!spiritualDone
      ? [
          {
            key: "spiritual",
            title: "Inner Calm Profile",
            sub: "Meditation & breathwork",
            color: "#5E5CE6",
            Icon: Sparkles,
            route: "/spiritual/onboarding" as const,
          },
        ]
      : []),
  ];

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
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ── Header ── */}
            <Animated.View
              entering={FadeInDown.duration(600).springify()}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 24,
                marginBottom: 28,
              }}
            >
              <View>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "700",
                    color: "#1C1C1E",
                    letterSpacing: -0.5,
                    lineHeight: 38,
                  }}
                >
                  {greeting},
                </Text>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: "700",
                    color: "#000000",
                    letterSpacing: -0.5,
                    lineHeight: 38,
                  }}
                >
                  {userName}.
                </Text>
              </View>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.08)",
                }}
              >
                <Text
                  style={{
                    color: "rgba(0,0,0,0.8)",
                    fontWeight: "700",
                    fontSize: 18,
                  }}
                >
                  {userName[0]?.toUpperCase() ?? "A"}
                </Text>
              </View>
            </Animated.View>

            {/* ── Connected Workspace ── */}
            {(workspace?.organization ||
              latestWebinar ||
              activeSupportRequest) && (
              <Animated.View
                entering={FadeInDown.delay(80).duration(600).springify()}
                style={{ marginBottom: 28 }}
              >
                <GlassCard className="p-6">
                  {workspace?.organization ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: latestWebinar || activeSupportRequest ? 16 : 0,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#1C1C1E",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Building size={20} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#8A8A8E",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                            marginBottom: 2,
                          }}
                        >
                          Workspace
                        </Text>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: "#1C1C1E",
                            letterSpacing: -0.3,
                          }}
                          numberOfLines={2}
                        >
                          {workspace.organization.name}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {latestWebinar ? (
                    <View
                      style={{
                        borderRadius: 16,
                        backgroundColor: "rgba(90,200,250,0.1)",
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        borderWidth: 1,
                        borderColor: "rgba(90,200,250,0.2)",
                        marginBottom: activeSupportRequest ? 12 : 0,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: "#007AFF",
                          textTransform: "uppercase",
                          letterSpacing: 1,
                        }}
                      >
                        HR Webinar
                      </Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: "#1C1C1E",
                          marginTop: 4,
                          lineHeight: 20,
                        }}
                      >
                        {latestWebinar.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#3C3C43",
                          marginTop: 4,
                          lineHeight: 18,
                        }}
                        numberOfLines={3}
                      >
                        {latestWebinar.message}
                      </Text>
                    </View>
                  ) : null}

                  {activeSupportRequest ? (
                    <Pressable onPress={() => router.push("/mental/hub")}>
                      <View
                        style={{
                          borderRadius: 16,
                          backgroundColor: "rgba(175,82,222,0.1)",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderWidth: 1,
                          borderColor: "rgba(175,82,222,0.2)",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: "#AF52DE",
                            textTransform: "uppercase",
                            letterSpacing: 1,
                          }}
                        >
                          Care Team
                        </Text>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: "700",
                            color: "#1C1C1E",
                            marginTop: 4,
                            textTransform: "capitalize",
                            lineHeight: 20,
                          }}
                        >
                          {activeSupportRequest.issueType.replace(/_/g, " ")} ·{" "}
                          {activeSupportRequest.status.replace(/_/g, " ")}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#3C3C43",
                            marginTop: 4,
                            lineHeight: 18,
                          }}
                          numberOfLines={2}
                        >
                          {activeSupportRequest.psychologistName
                            ? `Assigned to ${activeSupportRequest.psychologistName}`
                            : "Awaiting psychologist assignment"}
                        </Text>
                      </View>
                    </Pressable>
                  ) : null}
                </GlassCard>
              </Animated.View>
            )}

            {/* ── Wellness Wheel ── */}
            <Animated.View
              entering={FadeInDown.delay(160).duration(600).springify()}
              style={{ marginBottom: 28, alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -0.3,
                  alignSelf: "flex-start",
                  marginBottom: 16,
                }}
              >
                Your Wellness
              </Text>
              <GlassCard className="p-6 items-center w-full">
                <View
                  style={{
                    width: size,
                    height: size,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Svg width={size} height={size}>
                    <Defs>
                      {PILLARS.map((pillar) => (
                        <LinearGradient
                          key={`grad-${pillar.key}`}
                          id={`grad-${pillar.key}`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <Stop
                            offset="0%"
                            stopColor={pillar.color}
                            stopOpacity="1"
                          />
                          <Stop
                            offset="100%"
                            stopColor={pillar.color}
                            stopOpacity="0.7"
                          />
                        </LinearGradient>
                      ))}
                    </Defs>

                    {/* Track rings */}
                    {PILLARS.map((pillar, i) => (
                      <Path
                        key={`track-${i}`}
                        d={describeTrackSegment(
                          i,
                          total,
                          outerR,
                          innerR,
                          cx,
                          cy,
                        )}
                        fill={pillar.color + "15"}
                      />
                    ))}

                    {/* Fill segments */}
                    {PILLARS.map((pillar, i) => (
                      <Path
                        key={`fill-${i}`}
                        d={describeDonutSegment(
                          i,
                          total,
                          scores[pillar.key as keyof typeof scores] / 100,
                          outerR,
                          innerR,
                          cx,
                          cy,
                        )}
                        fill={`url(#grad-${pillar.key})`}
                      />
                    ))}

                    {/* Labels */}
                    {PILLARS.map((pillar, i) => {
                      const sliceAngle = (2 * Math.PI) / total;
                      const midAngle =
                        i * sliceAngle - Math.PI / 2 + sliceAngle / 2;
                      const labelR = outerR + 24;
                      const lx = cx + labelR * Math.cos(midAngle);
                      const ly = cy + labelR * Math.sin(midAngle);
                      return (
                        <SvgText
                          key={`label-${i}`}
                          x={lx}
                          y={ly + 4}
                          textAnchor="middle"
                          fill={pillar.color}
                          fontSize={12}
                          fontWeight="700"
                        >
                          {pillar.label}
                        </SvgText>
                      );
                    })}
                  </Svg>

                  {/* Center score overlay */}
                  <View
                    style={{
                      position: "absolute",
                      width: size,
                      height: size,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    pointerEvents="box-none"
                  >
                    <Text
                      style={{
                        fontSize: 44,
                        fontWeight: "700",
                        color: "#1C1C1E",
                        letterSpacing: -1,
                      }}
                    >
                      {overall}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: "#8A8A8E",
                        textTransform: "uppercase",
                        letterSpacing: 2,
                        marginTop: 2,
                      }}
                    >
                      Overall
                    </Text>
                  </View>

                  {/* Invisible touch areas */}
                  {PILLARS.map((_, i) => {
                    const sliceAngle = (2 * Math.PI) / total;
                    const midAngle =
                      i * sliceAngle - Math.PI / 2 + sliceAngle / 2;
                    const touchR = (outerR + innerR) / 2;
                    const tx = cx + touchR * Math.cos(midAngle);
                    const ty = cy + touchR * Math.sin(midAngle);
                    return (
                      <Pressable
                        key={`tap-${i}`}
                        onPress={() => handleSegmentPress(i)}
                        style={{
                          position: "absolute",
                          left: tx - 40,
                          top: ty - 40,
                          width: 80,
                          height: 80,
                          borderRadius: 40,
                        }}
                      />
                    );
                  })}
                </View>

                {/* Pillar score chips */}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 8,
                    marginTop: 20,
                    justifyContent: "center",
                  }}
                >
                  {PILLARS.map((pillar) => {
                    const IconComp = pillar.Icon;
                    return (
                      <Pressable
                        key={pillar.key}
                        onPress={() =>
                          handleSegmentPress(PILLARS.indexOf(pillar))
                        }
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: "rgba(0,0,0,0.05)",
                          backgroundColor: pillar.color + "12",
                        }}
                      >
                        <IconComp
                          size={16}
                          color={pillar.color}
                          strokeWidth={2.5}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: pillar.color,
                          }}
                        >
                          {scores[pillar.key as keyof typeof scores]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </GlassCard>
            </Animated.View>

            {/* ── Onboarding CTAs ── */}
            {pendingCTAs.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(240).duration(600).springify()}
                style={{ marginBottom: 28, gap: 12 }}
              >
                {pendingCTAs.map((cta) => {
                  const IconComp = cta.Icon;
                  return (
                    <GlassCard
                      key={cta.key}
                      onPress={() => router.push(cta.route)}
                      className="p-5 flex-row items-center"
                      style={{
                        gap: 16,
                        borderWidth: 1,
                        borderColor: cta.color + "40",
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: cta.color + "15",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComp
                          size={24}
                          color={cta.color}
                          strokeWidth={2.5}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: "#1C1C1E",
                            letterSpacing: -0.2,
                          }}
                        >
                          {cta.title}
                        </Text>
                        <Text
                          style={{
                            fontSize: 13,
                            color: "#8A8A8E",
                            marginTop: 3,
                          }}
                        >
                          {cta.sub}
                        </Text>
                      </View>
                      <ChevronRight size={20} color={cta.color} />
                    </GlassCard>
                  );
                })}
              </Animated.View>
            )}

            {/* ── Quick Actions ── */}
            <Animated.View
              entering={FadeInDown.delay(320).duration(600).springify()}
              style={{ marginBottom: 24 }}
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
                Quick Actions
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                <View style={{ width: quickActionCardWidth }}>
                  <GlassCard
                    onPress={() => router.push("/stress-scan")}
                    className="p-4 items-center justify-center"
                    style={{ minHeight: 112 }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(255,59,48,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Camera size={20} color="#FF3B30" strokeWidth={2.5} />
                    </View>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#1C1C1E",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      Scan
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#8A8A8E",
                        marginTop: 3,
                        textAlign: "center",
                        lineHeight: 15,
                      }}
                    >
                      Camera stress
                    </Text>
                  </GlassCard>
                </View>

                <View style={{ width: quickActionCardWidth }}>
                  <GlassCard
                    onPress={() => router.push("/mental/booking")}
                    className="p-4 items-center justify-center"
                    style={{ minHeight: 112 }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(90,200,250,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <HeartHandshake
                        size={20}
                        color="#5AC8FA"
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#1C1C1E",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      Help
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#8A8A8E",
                        marginTop: 3,
                        textAlign: "center",
                        lineHeight: 15,
                      }}
                    >
                      HR & Care
                    </Text>
                  </GlassCard>
                </View>

                <View style={{ width: quickActionCardWidth }}>
                  <GlassCard
                    onPress={() => router.push("/spiritual/breathwork")}
                    className="p-4 items-center justify-center"
                    style={{ minHeight: 112 }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: "rgba(94,92,230,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Wind size={20} color="#5E5CE6" strokeWidth={2.5} />
                    </View>
                    <Text
                      style={{
                        fontWeight: "700",
                        color: "#1C1C1E",
                        fontSize: 14,
                        textAlign: "center",
                      }}
                    >
                      Breathe
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#8A8A8E",
                        marginTop: 3,
                        textAlign: "center",
                        lineHeight: 15,
                      }}
                    >
                      2 min session
                    </Text>
                  </GlassCard>
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
