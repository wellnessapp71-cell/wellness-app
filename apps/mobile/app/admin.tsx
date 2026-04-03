import { Alert, View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors } from "@aura/lib";
import { GlassCard } from "@/components/ui/glass-card";

const STATS = [
  { label: "Avg Wheel Score", value: "74%", icon: "📈", accent: colors.green },
  {
    label: "Risk Alerts (Anon)",
    value: "42",
    icon: "⚠",
    accent: colors.orange,
  },
  { label: "Login Rate (7d)", value: "85%", accent: colors.blue },
  { label: "Help Requests", value: "12", accent: colors.purple },
];

const LOGINS = ["Alex R.", "Sarah M.", "David K.", "Anonymous"];

export default function AdminScreen() {
  const router = useRouter();

  function handleSendPush() {
    Alert.alert(
      "Campaign queued",
      "Push campaign has been queued for delivery.",
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ios-bg">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center gap-4 pt-4 mb-2">
          <Pressable
            onPress={() => router.back()}
            className="w-8 h-8 items-center justify-center"
          >
            <Text className="text-ios-blue text-2xl">‹</Text>
          </Pressable>
          <Text className="text-[22px] font-bold text-black tracking-tight">
            HR Admin Portal
          </Text>
        </View>
        <View className="flex-row gap-2 mb-8">
          <View className="px-3 py-1 bg-ios-separator rounded">
            <Text className="text-[11px] font-bold uppercase tracking-wider">
              ACME Corp
            </Text>
          </View>
          <View className="px-3 py-1 bg-ios-green/10 rounded">
            <Text className="text-[11px] font-bold text-ios-green uppercase tracking-wider">
              102 Active
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <Text className="text-[13px] font-semibold text-ios-secondary uppercase tracking-wider mb-2 ml-1">
          Platform Health
        </Text>
        <View className="flex-row flex-wrap gap-4 mb-8">
          {STATS.map((stat) => (
            <GlassCard key={stat.label} className="w-[47%] p-4">
              <Text
                className="text-[28px] font-bold text-black tracking-tight"
                style={stat.accent ? { color: stat.accent } : undefined}
              >
                {stat.value}
              </Text>
              <Text className="text-[13px] text-ios-secondary font-medium mt-1">
                {stat.label}
              </Text>
            </GlassCard>
          ))}
        </View>

        {/* Recent Logins */}
        <Text className="text-[13px] font-semibold text-ios-secondary uppercase tracking-wider mb-2 ml-1">
          Recent Logins
        </Text>
        <GlassCard className="mb-8">
          {LOGINS.map((name, i) => (
            <View
              key={i}
              className={`p-4 flex-row items-center justify-between bg-white ${i !== LOGINS.length - 1 ? "border-b border-black/5" : ""}`}
            >
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-ios-separator items-center justify-center">
                  <Text className="text-ios-secondary text-xs">👤</Text>
                </View>
                <Text className="text-[17px] font-semibold text-black tracking-tight">
                  {name}
                </Text>
              </View>
              <Text className="text-[13px] text-ios-secondary font-medium">
                Just now
              </Text>
            </View>
          ))}
        </GlassCard>

        {/* Push Campaign */}
        <Text className="text-[13px] font-semibold text-ios-secondary uppercase tracking-wider mb-2 ml-1">
          Push Campaigns
        </Text>
        <GlassCard
          className="p-5 mb-12"
          style={{ backgroundColor: colors.blue }}
        >
          <Text className="font-bold text-[18px] text-white tracking-tight mb-2">
            📣 Announce Webinar
          </Text>
          <Text className="text-[15px] text-white/90 font-medium leading-snug mb-5">
            Push notification to all 102 active users to join the "Mindful
            Leadership" session tomorrow.
          </Text>
          <Pressable
            onPress={handleSendPush}
            className="w-full py-3 bg-white rounded-[14px] items-center shadow-sm"
          >
            <Text className="text-ios-blue font-bold text-[17px]">
              Send Push
            </Text>
          </Pressable>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
