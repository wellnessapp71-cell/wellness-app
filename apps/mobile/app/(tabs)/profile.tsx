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
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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

  const settingsRows = [
    { Icon: Shield, label: "Privacy & Consent", sub: "Manage data sharing", color: "#34C759" },
    { Icon: Bell, label: "Notifications", sub: "Nudges & reminders", color: "#FF9500" },
    { Icon: Settings, label: "Account Settings", sub: "Email, password", color: "#8A8A8E" },
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
                  borderColor: "rgba(0,122,255,0.2)",
                  backgroundColor: "rgba(0,122,255,0.04)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#007AFF",
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: "#007AFF",
                        marginTop: 2,
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {auth?.role ?? "employee"} Role
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    height: 1,
                    backgroundColor: "rgba(0,0,0,0.05)",
                    marginVertical: 12,
                  }}
                />
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#3C3C43",
                      fontWeight: "500",
                    }}
                  >
                    {workspace?.supportRequests.length ?? 0} Requests
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#3C3C43",
                      fontWeight: "500",
                    }}
                  >
                    {workspace?.webinars.length ?? 0} Updates Sync
                  </Text>
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
                borderColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "700",
                  color: "#1C1C1E",
                  letterSpacing: -2,
                  marginBottom: 4,
                }}
              >
                {overall}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#8A8A8E",
                  textTransform: "uppercase",
                  letterSpacing: 2,
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
                      backgroundColor: "rgba(255,255,255,0.6)",
                      padding: 12,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.04)",
                      flex: 1,
                      minWidth: isCompact ? "45%" : 0,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <IconComp
                      size={20}
                      color={p.color}
                      strokeWidth={2.5}
                      style={{ marginBottom: 8 }}
                    />
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: p.color,
                        marginBottom: 4,
                      }}
                    >
                      {p.score}
                    </Text>
                    <Text
                      style={{
                        fontSize: 9,
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
              gap: 12,
              marginBottom: 28,
            }}
          >
            <GlassCard
              className="p-5 items-center justify-center"
              style={{
                flex: 1,
                minHeight: 100,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: "#FF9500",
                  letterSpacing: -1,
                  marginBottom: 4,
                }}
              >
                {profile?.streakDays ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#8A8A8E",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                }}
              >
                Day Streak
              </Text>
            </GlassCard>

            <GlassCard
              className="p-5 items-center justify-center"
              style={{
                flex: 1,
                minHeight: 100,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: "#34C759",
                  letterSpacing: -1,
                  marginBottom: 4,
                }}
              >
                {profile?.totalWorkouts ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#8A8A8E",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  textAlign: "center",
                }}
              >
                Workouts
              </Text>
            </GlassCard>

            <GlassCard
              className="p-5 items-center justify-center"
              style={{
                flex: 1,
                minHeight: 100,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "700",
                  color: "#FF2D55",
                  letterSpacing: -1,
                  marginBottom: 4,
                }}
              >
                {profile?.totalCaloriesBurned ?? 0}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: "#8A8A8E",
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  textAlign: "center",
                }}
              >
                Calories
              </Text>
            </GlassCard>
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
            <Pressable onPress={handleSignOut}>
              <GlassCard
                className="p-4 flex-row items-center justify-center"
                style={{
                  gap: 8,
                  borderWidth: 1.5,
                  borderColor: "rgba(255,59,48,0.2)",
                  backgroundColor: "rgba(255,59,48,0.04)",
                }}
              >
                <LogOut size={18} color="#FF3B30" strokeWidth={2.5} />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#FF3B30",
                  }}
                >
                  Sign Out
                </Text>
              </GlassCard>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
