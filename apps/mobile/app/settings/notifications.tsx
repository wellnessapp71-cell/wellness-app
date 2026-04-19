import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Bell,
  Sparkles,
  CalendarHeart,
  AlertTriangle,
  LifeBuoy,
  Megaphone,
} from "lucide-react-native";
import {
  getNotificationPrefs,
  setNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
} from "@/lib/user-store";
import { registerPushToken, unregisterPushToken } from "@/lib/push-registration";

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setPrefs(await getNotificationPrefs());
      setLoading(false);
    })();
  }, []);

  async function toggle(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await setNotificationPrefs(next);
      // If all toggles are off, unregister the push token; else ensure registration.
      const anyOn = Object.values(next).some(Boolean);
      if (anyOn) {
        await registerPushToken().catch(() => undefined);
      } else {
        await unregisterPushToken().catch(() => undefined);
      }
    } finally {
      setSaving(false);
    }
  }

  const rows: {
    key: keyof NotificationPrefs;
    Icon: typeof Bell;
    color: string;
    label: string;
    sub: string;
    locked?: boolean;
  }[] = [
    {
      key: "dailyNudges",
      Icon: Sparkles,
      color: "#FF9500",
      label: "Daily nudges",
      sub: "Gentle check-ins and micro-practices tailored to your plan.",
    },
    {
      key: "weeklyReview",
      Icon: CalendarHeart,
      color: "#5E5CE6",
      label: "Weekly review",
      sub: "A summary of your progress across the four wellness pillars.",
    },
    {
      key: "emergencyBroadcasts",
      Icon: AlertTriangle,
      color: "#B42318",
      label: "Emergency broadcasts",
      sub: "Critical alerts from your organization. We recommend keeping this on.",
    },
    {
      key: "supportUpdates",
      Icon: LifeBuoy,
      color: "#167C80",
      label: "Support updates",
      sub: "Responses from HR or your assigned psychologist.",
    },
    {
      key: "marketing",
      Icon: Megaphone,
      color: "#8A8A8E",
      label: "Product news",
      sub: "New features, tips, and occasional announcements.",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top", "left", "right"]}>
      <View className="px-6 pt-4 flex-row items-center">
        <Pressable
          onPress={() => router.back()}
          className="w-11 h-11 rounded-full bg-white items-center justify-center border border-black/[0.03]"
        >
          <ChevronLeft size={22} color="#1C1C1E" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6 mb-8">
          <View className="w-14 h-14 rounded-2xl bg-[#FF9500]/10 items-center justify-center mb-4">
            <Bell size={26} color="#FF9500" strokeWidth={2.2} />
          </View>
          <Text className="text-[32px] font-bold text-[#1C1C1E] tracking-tight">
            Notifications
          </Text>
          <Text className="text-[15px] text-[#8A8A8E] font-medium mt-2 leading-[22px]">
            Choose which nudges and updates you want to receive.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#167C80" />
        ) : (
          <View className="gap-3">
            {rows.map(({ key, Icon, color, label, sub }) => (
              <View
                key={key}
                className="bg-white rounded-2xl p-5 border border-black/[0.03] flex-row items-start"
              >
                <View
                  style={{ backgroundColor: `${color}15` }}
                  className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                >
                  <Icon size={20} color={color} strokeWidth={2.2} />
                </View>
                <View className="flex-1 pr-3">
                  <Text className="text-[16px] font-bold text-[#1C1C1E]">{label}</Text>
                  <Text className="text-[13px] text-[#8A8A8E] font-medium mt-1 leading-[18px]">
                    {sub}
                  </Text>
                </View>
                <Switch
                  value={prefs[key]}
                  onValueChange={(v) => toggle(key, v)}
                  trackColor={{ false: "#E5E5EA", true: "#167C80" }}
                  thumbColor="#FFFFFF"
                  disabled={saving}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
