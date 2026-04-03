import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Sparkles, ArrowRight, Info } from "lucide-react-native";

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setError("Please enter your referral code.");
      return;
    }
    let orgName = "";
    try {
      const response = await api.get<{
        organization: {
          id: string;
          name: string;
          referralCode: string;
        };
      }>(`/public/organizations/lookup?referralCode=${encodeURIComponent(trimmed)}`);
      orgName = response.organization.name;
    } catch {
      setError("Invalid referral code. Please check with your HR team.");
      setLoading(false);
      return;
    }
    setError("");
    setLoading(true);
    // Store temporarily for signup screen
    await AsyncStorage.setItem(
      "@aura/pending_referral",
      JSON.stringify({ code: trimmed, orgName }),
    );
    setLoading(false);
    router.push("/onboarding/signup");
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          {/* Logo / Hero */}
          <Animated.View entering={FadeInDown.duration(800).springify()} className="items-center mb-10">
            <View
              className="w-20 h-20 rounded-[28px] items-center justify-center mb-6 shadow-xl shadow-[#007AFF]/30"
              style={{ backgroundColor: "#007AFF" }}
            >
              <Sparkles size={40} color="#FFFFFF" strokeWidth={1.5} />
            </View>
            <Text
              className="text-[34px] font-bold text-[#1C1C1E] tracking-tight"
              style={{ textAlign: "center" }}
            >
              Welcome to Aura
            </Text>
            <Text
              className="text-[17px] text-[#8A8A8E] mt-2 font-medium"
              style={{ textAlign: "center", maxWidth: "80%" }}
            >
              Your personalized wellness companion
            </Text>
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-8">
            <View
              className="bg-white/80 rounded-[24px] p-6 border border-black/5"
            >
              <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-2">
                Organisation Code
              </Text>
              <Text className="text-[15px] text-[#8A8A8E] leading-relaxed mb-6">
                Enter the referral code provided by your employer or HR team to join your workspace.
              </Text>

              <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                Referral Code
              </Text>
              <View className="flex-row items-center bg-[#FAFAFC] rounded-2xl border border-black/[0.03] overflow-hidden">
                <TextInput
                  value={code}
                  onChangeText={(v) => {
                    setCode(v);
                    setError("");
                  }}
                  placeholder="e.g. AURA2026"
                  placeholderTextColor="#C6C6C8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  className="px-5 py-4 flex-1 text-[18px] text-[#1C1C1E] font-bold tracking-[3px]"
                  style={{ letterSpacing: 3 }}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                />
              </View>
              {error ? (
                <Animated.View entering={FadeInDown.duration(300)} className="bg-[#FF3B30]/10 rounded-xl p-3 mt-3 flex-row items-center gap-2">
                  <Info size={16} color="#FF3B30" />
                  <Text className="text-[14px] text-[#FF3B30] font-semibold flex-1">
                    {error}
                  </Text>
                </Animated.View>
              ) : null}
            </View>
          </Animated.View>

          {/* Login link */}
          <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="items-center gap-4">
            <Pressable onPress={() => router.push("/onboarding/login")} className="flex-row items-center gap-1">
              <Text className="text-[15px] text-[#8A8A8E] font-medium">
                Already have an account?
              </Text>
              <Text className="text-[15px] text-[#007AFF] font-bold">
                Log in
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Need help?",
                  "Contact your HR team or wellness coordinator to obtain your organisation's referral code.",
                )
              }
            >
              <Text className="text-[14px] text-[#C6C6C8] font-medium underline">
                Don't have a code?
              </Text>
            </Pressable>
          </Animated.View>

          <View className="flex-1 min-h-[40px]" />

          {/* CTA */}
          <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading || code.trim().length === 0}
              className="rounded-[20px] py-4 items-center flex-row justify-center gap-3"
              style={{ backgroundColor: loading || code.trim().length === 0 ? "#E5E5EA" : "#007AFF" }}
            >
              <Text className={`text-[17px] font-bold ${loading || code.trim().length === 0 ? "text-[#8A8A8E]" : "text-white"}`}>
                {loading ? "Verifying..." : "Continue"}
              </Text>
              {!loading && code.trim().length > 0 && <ArrowRight size={20} color="#FFFFFF" />}
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
