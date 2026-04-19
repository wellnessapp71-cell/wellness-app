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
import { api } from "@/lib/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, Mail, CheckCircle2 } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: trimmed });
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F8]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4">
            <Pressable
              onPress={() => router.back()}
              className="w-11 h-11 rounded-full bg-white items-center justify-center border border-black/[0.03]"
            >
              <ChevronLeft size={22} color="#1C1C1E" strokeWidth={2.5} />
            </Pressable>
          </View>

          <View className="px-6 pt-6">
            <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-8">
              <View className="w-14 h-14 rounded-2xl bg-[#167C80]/10 items-center justify-center mb-4">
                <Mail size={26} color="#167C80" strokeWidth={2.2} />
              </View>
              <Text className="text-[32px] font-bold text-[#1C1C1E] tracking-tight">
                Forgot password?
              </Text>
              <Text className="text-[15px] text-[#8A8A8E] font-medium mt-2 leading-[22px]">
                Enter your email and we&apos;ll send a secure link to choose a new password.
              </Text>
            </Animated.View>

            {sent ? (
              <Animated.View
                entering={FadeInDown.delay(200).duration(800).springify()}
                className="bg-white rounded-2xl p-5 border border-[#BFE3E3]"
              >
                <View className="flex-row items-center mb-2">
                  <CheckCircle2 size={22} color="#167C80" strokeWidth={2.2} />
                  <Text className="text-[16px] font-bold text-[#1C1C1E] ml-2">
                    Check your email
                  </Text>
                </View>
                <Text className="text-[14px] text-[#4A4A4A] font-medium leading-[20px]">
                  If an account exists for <Text className="font-bold">{email}</Text>, a reset link is on its way. The link expires in 30 minutes.
                </Text>

                <Pressable
                  onPress={() => router.replace("/onboarding/login")}
                  className="mt-5 bg-[#1C1C1E] rounded-2xl py-4 items-center"
                >
                  <Text className="text-white text-[15px] font-bold">Back to sign in</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <Animated.View
                  entering={FadeInDown.delay(200).duration(800).springify()}
                  className="mb-6"
                >
                  <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
                    Email
                  </Text>
                  <View className="bg-white rounded-2xl border border-black/[0.03] overflow-hidden">
                    <TextInput
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        setError("");
                      }}
                      placeholder="you@company.com"
                      placeholderTextColor="#C6C6C8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      className="px-5 py-4 text-[17px] text-[#1C1C1E] font-medium"
                      onSubmitEditing={handleSubmit}
                      returnKeyType="send"
                    />
                  </View>
                </Animated.View>

                {error ? (
                  <Animated.View
                    entering={FadeInDown.duration(300)}
                    className="bg-[#FFF5F7] border border-[#F4C6CD] rounded-2xl px-4 py-3 mb-5"
                  >
                    <Text className="text-[13px] text-[#B42318] font-medium">{error}</Text>
                  </Animated.View>
                ) : null}

                <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
                  <Pressable
                    onPress={handleSubmit}
                    disabled={loading}
                    className={`rounded-2xl py-4 items-center ${loading ? "bg-[#8A8A8E]" : "bg-[#1C1C1E]"}`}
                  >
                    <Text className="text-white text-[16px] font-bold">
                      {loading ? "Sending..." : "Send reset link"}
                    </Text>
                  </Pressable>
                </Animated.View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
