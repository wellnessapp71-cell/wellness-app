import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { saveAuth, syncFromApi } from "@/lib/user-store";
import { api } from "@/lib/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, LogIn, Sparkles, Info } from "lucide-react-native";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [login, setLogin] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!login.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await api.post<{
        userId: string;
        email: string;
        username: string;
        name: string | null;
        referralCode: string;
        role: string;
        organization: {
          id: string;
          name: string;
          referralCode: string;
        } | null;
        token: string;
      }>("/auth/login", {
        login: login.trim().toLowerCase(),
        password,
      });

      await saveAuth({
        token: response.token,
        userId: response.userId,
        email: response.email,
        username: response.username,
        name: response.name,
        referralCode: response.referralCode,
        role: response.role,
        organization: response.organization,
      });

      // Sync full profile from server
      const state = await syncFromApi();

      if (state?.profile) {
        router.replace("/(tabs)/dashboard");
      } else {
        // Profile not set up yet — go to questionnaire
        router.replace("/onboarding/questionnaire");
      }
    } catch (err: any) {
      setError(err?.message ?? "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-10">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
            >
              <ChevronLeft size={24} color="#1C1C1E" />
            </Pressable>
          </Animated.View>

          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-10 items-center">
            <View
              className="w-16 h-16 rounded-[22px] items-center justify-center mb-5 shadow-lg shadow-[#007AFF]/20"
              style={{ backgroundColor: "#007AFF" }}
            >
              <Sparkles size={32} color="#FFFFFF" strokeWidth={1.5} />
            </View>
            <Text className="text-[32px] font-bold text-[#1C1C1E] tracking-tight mb-2">
              Welcome Back
            </Text>
            <Text className="text-[16px] text-[#8A8A8E] font-medium text-center">
              Log in with your email or username to continue your journey
            </Text>
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeInDown.duration(300)} className="bg-[#FF3B30]/10 rounded-xl p-4 mb-6 flex-row items-center gap-2">
              <Info size={16} color="#FF3B30" />
              <Text className="text-[14px] text-[#FF3B30] font-semibold flex-1">
                {error}
              </Text>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} className="mb-5">
            <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
              Email / Username
            </Text>
            <View className="bg-white rounded-2xl border border-black/[0.03] overflow-hidden">
              <TextInput
                value={login}
                onChangeText={(v) => {
                  setLogin(v);
                  setError("");
                }}
                placeholder="alex@company.com"
                placeholderTextColor="#C6C6C8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="px-5 py-4 text-[17px] text-[#1C1C1E] font-medium"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} className="mb-8">
            <View className="flex-row justify-between items-end mb-2">
              <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest">
                Password
              </Text>
              <Pressable onPress={() => router.push("/onboarding/forgot-password")}>
                <Text className="text-[13px] text-[#007AFF] font-bold">Forgot?</Text>
              </Pressable>
            </View>
            <View className="bg-white rounded-2xl border border-black/[0.03] overflow-hidden">
              <TextInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  setError("");
                }}
                placeholder="••••••••"
                placeholderTextColor="#C6C6C8"
                secureTextEntry
                className="px-5 py-4 text-[17px] text-[#1C1C1E] font-medium"
                onSubmitEditing={handleLogin}
                returnKeyType="go"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
            {(() => {
              const enabled = !loading && !!login.trim() && !!password;
              return (
                <Pressable
                  onPress={handleLogin}
                  disabled={!enabled}
                  className="rounded-2xl py-4 items-center flex-row justify-center gap-2"
                  style={{
                    backgroundColor: enabled ? "#1C1C1E" : "#D1D1D6",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: enabled ? 0.2 : 0,
                    shadowRadius: 12,
                    elevation: enabled ? 4 : 0,
                  }}
                >
                  {enabled && <LogIn size={20} color="#FFFFFF" />}
                  <Text
                    className="text-[17px] font-bold"
                    style={{ color: enabled ? "#FFFFFF" : "#8A8A8E", letterSpacing: -0.2 }}
                  >
                    {loading ? "Logging in..." : "Log In"}
                  </Text>
                </Pressable>
              );
            })()}
          </Animated.View>

          <View className="flex-1 min-h-[40px]" />

          <Animated.View entering={FadeInDown.delay(500).duration(800).springify()} className="items-center">
            <Pressable
              onPress={() => router.push("/onboarding/referral")}
              className="mb-4 flex-row items-center gap-1"
            >
              <Text className="text-[15px] text-[#8A8A8E] font-medium">
                Don't have an account?
              </Text>
              <Text className="text-[15px] text-[#007AFF] font-bold">
                Sign up
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
