import {
  View,
  Text,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState, useRef, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  getAuth,
  getEmployeeWorkspace,
  getProfile,
  clearAuth,
  syncFromApi,
} from "@/lib/user-store";
import type {
  AuthState,
  EmployeeWorkspace,
  UserProfile,
} from "@/lib/user-store";
import {
  Building,
  Activity,
  BrainCircuit,
  Sparkles,
  Leaf,
  Ruler,
  Scale,
  Target,
  CalendarDays,
  User,
  Dumbbell,
  Footprints,
  Utensils,
  AlertTriangle,
  Droplets,
  Shield,
  Bell,
  LifeBuoy,
  Settings,
  ChevronRight,
  LogOut,
} from "lucide-react-native";

/* ──────────────────────────── Screen ──────────────────────────── */

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<EmployeeWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const isCompact = width < 390;

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          setLoading(true);
          fadeAnim.setValue(0);
          const synced = await syncFromApi();
          const [a, p, w] = await Promise.all([
            getAuth(),
            getProfile(),
            getEmployeeWorkspace(),
          ]);
          setAuth(a);
          setProfile(p);
          setWorkspace(synced?.employeeWorkspace ?? w);
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  async function handleSignOut(): Promise<void> {
    await clearAuth();
    router.replace("/");
  }

  const displayName = auth?.name ?? auth?.username ?? "User";
  const initials = displayName
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const overall = profile
    ? Math.round(
        (profile.scorePhysical +
          profile.scoreMental +
          profile.scoreSpiritual +
          profile.scoreLifestyle) /
          4,
      )
    : 0;

  /* ── Health detail rows ── */
  const healthRows = profile
    ? [
        { Icon: Ruler, label: "Height", value: `${profile.heightCm} cm`, color: "#8A8A8E" },
        { Icon: Scale, label: "Weight", value: `${profile.currentWeightKg} kg`, color: "#8A8A8E" },
        ...(profile.targetWeightKg
          ? [{ Icon: Target, label: "Target", value: `${profile.targetWeightKg} kg`, color: "#007AFF" }]
          : []),
        { Icon: CalendarDays, label: "Age", value: `${profile.age}`, color: "#8A8A8E" },
        {
          Icon: User,
          label: "Gender",
          value: profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1),
          color: "#8A8A8E",
        },
        ...(profile.fitnessLevel
          ? [{
              Icon: Dumbbell,
              label: "Fitness",
              value: profile.fitnessLevel.charAt(0).toUpperCase() + profile.fitnessLevel.slice(1),
              color: "#FF2D55",
            }]
          : []),
        ...(profile.activityLevel
          ? [{
              Icon: Footprints,
              label: "Activity",
              value: profile.activityLevel.replace(/_/g, " "),
              color: "#FF9500",
            }]
          : []),
        ...(profile.dietType
          ? [{
              Icon: Utensils,
              label: "Diet",
              value: profile.dietType.charAt(0).toUpperCase() + profile.dietType.slice(1),
              color: "#34C759",
            }]
          : []),
        ...(profile.allergies.length > 0
          ? [{
              Icon: AlertTriangle,
              label: "Allergies",
              value: profile.allergies.join(", "),
              color: "#FF3B30",
            }]
          : []),
        ...(profile.waterGlassesPerDay
          ? [{
              Icon: Droplets,
              label: "Water",
              value: `${profile.waterGlassesPerDay} glasses`,
              color: "#5AC8FA",
            }]
          : []),
      ]
    : [];

  const settingsRows: {
    Icon: typeof Shield;
    label: string;
    sub: string;
    color: string;
    route?: string;
  }[] = [
    {
      Icon: LifeBuoy,
      label: "Request Support",
      sub: "Reach your HR or wellbeing team",
      color: "#167C80",
      route: "/support/request",
    },
    {
      Icon: Shield,
      label: "Privacy & Consent",
      sub: "Manage data sharing",
      color: "#34C759",
      route: "/settings/privacy",
    },
    {
      Icon: Bell,
      label: "Notifications",
      sub: "Nudges & reminders",
      color: "#FF9500",
      route: "/settings/notifications",
    },
    {
      Icon: Settings,
      label: "Account Settings",
      sub: "Email, password",
      color: "#8A8A8E",
      route: "/settings/account",
    },
  ];

  const pillarScores = [
    { label: "Physical", score: profile?.scorePhysical ?? 0, color: "#FF2D55", Icon: Activity },
    { label: "Mental", score: profile?.scoreMental ?? 0, color: "#5AC8FA", Icon: BrainCircuit },
    { label: "Spiritual", score: profile?.scoreSpiritual ?? 0, color: "#5E5CE6", Icon: Sparkles },
    { label: "Lifestyle", score: profile?.scoreLifestyle ?? 0, color: "#34C759", Icon: Leaf },
  ];

  return (
    <SafeAreaView
      className="flex-1 bg-[#FAFAFC]"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── Header ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 20,
              paddingTop: 24,
              marginBottom: 32,
            }}
          >
            <View
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: "#1C1C1E",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: 32,
                  letterSpacing: -0.5,
                }}
              >
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -0.5,
                  lineHeight: 34,
                  marginBottom: 2,
                }}
                numberOfLines={2}
              >
                {displayName}
              </Text>
              {auth?.email && (
                <Text
                  style={{
                    fontSize: 15,
                    color: "#8A8A8E",
                    fontWeight: "500",
                  }}
                  numberOfLines={1}
                >
                  {auth.email}
                </Text>
              )}
              {auth?.username && (
                <Text
                  style={{
                    fontSize: 14,
                    color: "#8A8A8E",
                    marginTop: 2,
                    opacity: 0.8,
                  }}
                >
                  @{auth.username}
                </Text>
              )}
            </View>
          </View>

          {/* ── Company Access ── */}
          {(auth?.organization || workspace?.organization) && (
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -0.3,
                  marginBottom: 16,
                }}
              >
                Company Access
              </Text>
              <GlassCard
                className="p-5"
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: "#1C1C1E",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Building size={20} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#1C1C1E",
                        letterSpacing: -0.3,
                      }}
                      numberOfLines={2}
                    >
                      {workspace?.organization?.name ?? auth?.organization?.name}
                    </Text>
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#F2F2F7",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        marginTop: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: "#636366",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}
                      >
                        {auth?.role ?? "employee"}
                      </Text>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    marginBottom: 14,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 24,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#1C1C1E",
                        marginBottom: 2,
                      }}
                    >
                      {workspace?.supportRequests.length ?? 0}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#8A8A8E",
                        fontWeight: "500",
                      }}
                    >
                      Requests
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 1,
                      height: 28,
                      backgroundColor: "rgba(0,0,0,0.06)",
                    }}
                  />
                  <View style={{ alignItems: "center" }}>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#1C1C1E",
                        marginBottom: 2,
                      }}
                    >
                      {workspace?.webinars.length ?? 0}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#8A8A8E",
                        fontWeight: "500",
                      }}
                    >
                      Updates Sync
                    </Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          )}

          {/* ── Wellness Scores ── */}
          <View style={{ marginBottom: 28 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1C1C1E",
                letterSpacing: -0.3,
                marginBottom: 16,
              }}
            >
              Wellness Scores
            </Text>
            <GlassCard
              className="p-6 items-center"
              style={{
                marginBottom: 12,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 52,
                  fontWeight: "800",
                  color: "#1C1C1E",
                  letterSpacing: -2,
                  marginBottom: 4,
                }}
              >
                {overall}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: "#8A8A8E",
                  textTransform: "uppercase",
                  letterSpacing: 2.5,
                }}
              >
                Aura Score
              </Text>
            </GlassCard>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {pillarScores.map((p) => {
                const IconComp = p.Icon;
                return (
                  <View
                    key={p.label}
                    style={{
                      alignItems: "center",
                      backgroundColor: "#FFFFFF",
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.06)",
                      flex: 1,
                      minWidth: isCompact ? "45%" : 0,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: p.color + "12",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <IconComp
                        size={18}
                        color={p.color}
                        strokeWidth={2.5}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 22,
                        fontWeight: "800",
                        color: "#1C1C1E",
                        marginBottom: 4,
                      }}
                    >
                      {p.score}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "700",
                        color: "#8A8A8E",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        textAlign: "center",
                      }}
                      numberOfLines={2}
                    >
                      {p.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Stats ── */}
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              marginBottom: 28,
            }}
          >
            {[
              { value: profile?.streakDays ?? 0, label: "Day\nStreak", color: "#FF9500" },
              { value: profile?.totalWorkouts ?? 0, label: "Workouts", color: "#34C759" },
              { value: profile?.totalCaloriesBurned ?? 0, label: "Calories", color: "#FF2D55" },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#FFFFFF",
                  paddingVertical: 20,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  minHeight: 100,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: "#1C1C1E",
                    letterSpacing: -1,
                    marginBottom: 6,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "#8A8A8E",
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                    textAlign: "center",
                    lineHeight: 14,
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* ── Health Details ── */}
          {healthRows.length > 0 && (
            <View style={{ marginBottom: 28 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -0.3,
                  marginBottom: 16,
                }}
              >
                Health Details
              </Text>
              <GlassCard
                className="overflow-hidden"
                style={{
                  padding: 0,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.04)",
                }}
              >
                {healthRows.map((item, idx) => {
                  const IconComp = item.Icon;
                  return (
                    <View
                      key={item.label}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 14,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 16,
                        backgroundColor: "rgba(255,255,255,0.6)",
                        borderBottomWidth:
                          idx !== healthRows.length - 1 ? 1 : 0,
                        borderBottomColor: "rgba(0,0,0,0.03)",
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: item.color + "15",
                        }}
                      >
                        <IconComp
                          size={16}
                          color={item.color}
                          strokeWidth={2.5}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#3C3C43",
                          fontWeight: "500",
                          flexShrink: 0,
                          width: isCompact ? 76 : 92,
                        }}
                      >
                        {item.label}
                      </Text>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "600",
                            color: "#1C1C1E",
                            textTransform: "capitalize",
                            textAlign: "right",
                            lineHeight: 22,
                          }}
                          numberOfLines={2}
                        >
                          {item.value}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </GlassCard>
            </View>
          )}

          {/* ── Preferences ── */}
          <View style={{ marginBottom: 28 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: "#1C1C1E",
                letterSpacing: -0.3,
                marginBottom: 16,
              }}
            >
              Preferences
            </Text>
            <GlassCard
              className="overflow-hidden"
              style={{
                padding: 0,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.04)",
              }}
            >
              {settingsRows.map((item, idx) => {
                const IconComp = item.Icon;
                return (
                  <Pressable
                    key={item.label}
                    onPress={item.route ? () => router.push(item.route as never) : undefined}
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 16,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                      backgroundColor: "rgba(255,255,255,0.6)",
                      borderBottomWidth:
                        idx !== settingsRows.length - 1 ? 1 : 0,
                      borderBottomColor: "rgba(0,0,0,0.03)",
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: item.color + "15",
                      }}
                    >
                      <IconComp
                        size={18}
                        color={item.color}
                        strokeWidth={2.5}
                      />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{
                          fontWeight: "600",
                          fontSize: 17,
                          color: "#1C1C1E",
                          letterSpacing: -0.2,
                          marginBottom: 2,
                        }}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#8A8A8E",
                          fontWeight: "500",
                        }}
                      >
                        {item.sub}
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#D1D1D6" />
                  </Pressable>
                );
              })}
            </GlassCard>
          </View>

          {/* ── Sign Out ── */}
          <View style={{ marginBottom: 16 }}>
            <Pressable
              onPress={handleSignOut}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: "#1C1C1E",
                paddingVertical: 16,
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <LogOut size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  letterSpacing: -0.2,
                }}
              >
                Sign Out
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
