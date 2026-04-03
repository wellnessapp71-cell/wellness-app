import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { api } from "@/lib/api";

const CONSENT_ITEMS = [
  {
    key: "hrSharing",
    icon: "🏢",
    title: "Share with HR Team",
    description:
      "Allow anonymised wellness summary scores to be shared with your HR/wellbeing team for aggregate reporting.",
  },
  {
    key: "research",
    icon: "🔬",
    title: "Research Participation",
    description:
      "Contribute anonymised data to wellbeing research to improve workplace wellness programmes.",
  },
  {
    key: "dataExport",
    icon: "📦",
    title: "Data Export & Deletion",
    description:
      "You can request a full export of your data or permanent account deletion at any time.",
  },
] as const;

type ConsentKey = "hrSharing" | "research" | "dataExport";

export default function ConsentScreen() {
  const router = useRouter();
  const [flags, setFlags] = useState<Record<ConsentKey, boolean>>({
    hrSharing: false,
    research: false,
    dataExport: true,
  });
  const [loading, setLoading] = useState(false);

  function toggle(key: ConsentKey) {
    setFlags((f) => ({ ...f, [key]: !f[key] }));
  }

  async function handleContinue() {
    setLoading(true);
    try {
      await api.post("/profile", { consentState: flags });
    } catch {
      // Offline — fine
    }
    setLoading(false);
    router.push("/onboarding/scoring");
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-6 mb-8">
          <View className="w-14 h-14 rounded-2xl items-center justify-center mb-5" style={{ backgroundColor: "#34C75920" }}>
            <Text style={{ fontSize: 28 }}>🔒</Text>
          </View>
          <Text className="text-[34px] font-bold text-black tracking-tight leading-tight">
            Your Privacy
          </Text>
          <Text className="text-[17px] text-[#8A8A8E] mt-2 font-medium leading-relaxed">
            We're committed to protecting your data. Review and choose your preferences below.
          </Text>
        </View>

        <View className="gap-3 mb-8">
          {CONSENT_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => toggle(item.key)}
              className="bg-white rounded-2xl p-4 flex-row items-start gap-4"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.04,
                shadowRadius: 8,
                borderWidth: 1.5,
                borderColor: flags[item.key] ? "#007AFF40" : "transparent",
              }}
            >
              <View className="w-10 h-10 rounded-xl items-center justify-center mt-0.5" style={{ backgroundColor: "#007AFF10" }}>
                <Text style={{ fontSize: 20 }}>{item.icon}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-semibold text-black tracking-tight mb-1">
                  {item.title}
                </Text>
                <Text className="text-[13px] text-[#8A8A8E] leading-relaxed">
                  {item.description}
                </Text>
              </View>
              <View
                className="w-12 h-7 rounded-full justify-center px-0.5 mt-1"
                style={{ backgroundColor: flags[item.key] ? "#34C759" : "#E5E5EA" }}
              >
                <View
                  className="w-6 h-6 rounded-full bg-white shadow-sm"
                  style={{
                    transform: [{ translateX: flags[item.key] ? 20 : 0 }],
                    shadowColor: "#000",
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                  }}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <Text className="text-[13px] text-[#8A8A8E] leading-relaxed text-center mb-10">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>

      <View className="px-6 pb-6 pt-2">
        <Pressable
          onPress={handleContinue}
          disabled={loading}
          className="rounded-2xl py-4 items-center"
          style={{ backgroundColor: loading ? "#C6C6C8" : "#007AFF" }}
        >
          <Text className="text-white text-[17px] font-semibold">
            {loading ? "Saving..." : "Continue"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
