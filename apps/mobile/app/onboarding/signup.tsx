import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveAuth } from "@/lib/user-store";
import { ApiRequestError, api } from "@/lib/api";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ChevronLeft, LogIn, Sparkles, Info, Building2 } from "lucide-react-native";

type Gender = "male" | "female" | "other";

const GENDERS: { label: string; value: Gender }[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [referralCode, setReferralCode] = useState("");
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem("@aura/pending_referral");
      if (raw) {
        const { code, orgName: org } = JSON.parse(raw);
        setReferralCode(code);
        setOrgName(org);
      }
    })();
  }, []);

  function clearFieldError(field: string) {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!username.trim()) e.username = "Username is required.";
    else if (username.trim().length < 3) e.username = "Min 3 characters.";
    else if (!/^[a-zA-Z0-9_]+$/.test(username.trim()))
      e.username = "Letters, numbers, underscores only.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email.trim())) e.email = "Invalid email.";
    if (!password) e.password = "Password is required.";
    else if (password.length < 8) e.password = "Min 8 characters.";
    else if (!/[A-Z]/.test(password)) e.password = "Need an uppercase letter.";
    else if (!/[0-9]/.test(password)) e.password = "Need a number.";
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 18 || ageNum > 100)
      e.age = "Enter a valid age (18-100).";
    const hNum = parseFloat(height);
    if (!height || isNaN(hNum) || hNum < 100 || hNum > 250)
      e.height = "Height in cm (100-250).";
    const wNum = parseFloat(weight);
    if (!weight || isNaN(wNum) || wNum < 30 || wNum > 300)
      e.weight = "Weight in kg (30-300).";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setApiError("");
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
      }>("/auth/register", {
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password,
        referralCode,
        name: name.trim(),
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

      // Store basic demographics temporarily for questionnaire
      await AsyncStorage.setItem(
        "@aura/pending_profile",
        JSON.stringify({
          age: parseInt(age, 10),
          gender,
          heightCm: parseFloat(height),
          currentWeightKg: parseFloat(weight),
        }),
      );

      await AsyncStorage.removeItem("@aura/pending_referral");
      router.replace("/onboarding/questionnaire");
    } catch (error: any) {
      if (error instanceof ApiRequestError) {
        if (error.code === "EMAIL_EXISTS") {
          setErrors((current) => ({
            ...current,
            email: "An account with this email already exists.",
          }));
          setApiError("");
          return;
        }

        if (error.code === "USERNAME_EXISTS") {
          setErrors((current) => ({
            ...current,
            username: "This username is already taken.",
          }));
          setApiError("");
          return;
        }
      }

      setApiError(error?.message ?? "Registration failed. Please try again.");
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Animated.View entering={FadeInDown.duration(600).springify()} className="mb-8">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white border border-black/5 items-center justify-center shadow-sm shadow-black/5"
            >
              <ChevronLeft size={24} color="#1C1C1E" />
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(800).springify()} className="mb-8">
            <Text className="text-[34px] font-bold text-[#1C1C1E] tracking-tight leading-tight mb-2">
              Create Account
            </Text>
            {orgName ? (
              <View className="flex-row items-center gap-2">
                <Building2 size={16} color="#007AFF" />
                <Text className="text-[15px] text-[#8A8A8E] font-medium">
                  Joining via <Text className="font-bold text-[#1C1C1E]">{orgName}</Text>
                </Text>
              </View>
            ) : null}
          </Animated.View>

          {apiError ? (
            <Animated.View entering={FadeInDown.duration(300)} className="bg-[#FF3B30]/10 rounded-xl p-4 mb-6 flex-row items-center gap-2">
              <Info size={16} color="#FF3B30" />
              <Text className="text-[14px] text-[#FF3B30] font-semibold flex-1">
                {apiError}
              </Text>
            </Animated.View>
          ) : null}

          <View className="gap-5 mb-8">
            <Animated.View entering={FadeInDown.delay(150).duration(800).springify()}>
              <Field label="Full Name" error={errors.name}>
                <TextInput
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    clearFieldError("name");
                    setApiError("");
                  }}
                  placeholder="Alex Rivera"
                  placeholderTextColor="#C6C6C8"
                  className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                  autoCapitalize="words"
                />
              </Field>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).duration(800).springify()}>
              <Field label="Username" error={errors.username}>
                <TextInput
                  value={username}
                  onChangeText={(v) => {
                    setUsername(v.toLowerCase());
                    clearFieldError("username");
                    setApiError("");
                  }}
                  placeholder="alex_rivera"
                  placeholderTextColor="#C6C6C8"
                  className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Field>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(250).duration(800).springify()}>
              <Field label="Email" error={errors.email}>
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearFieldError("email");
                    setApiError("");
                  }}
                  placeholder="alex@company.com"
                  placeholderTextColor="#C6C6C8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                />
              </Field>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300).duration(800).springify()}>
              <Field label="Password" error={errors.password}>
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearFieldError("password");
                    setApiError("");
                  }}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  placeholderTextColor="#C6C6C8"
                  secureTextEntry
                  className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                />
              </Field>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).duration(800).springify()} className="mt-2 text-[18px] font-bold text-[#1C1C1E] tracking-tight mb-2">
              <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight mb-2">
                Basic Info
              </Text>
              <Text className="text-[14px] text-[#8A8A8E] leading-relaxed">
                Used to personalize your initial experience
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(400).duration(800).springify()}>
              <Field label="Gender">
                <View className="flex-row gap-3">
                  {GENDERS.map((g) => (
                    <Pressable
                      key={g.value}
                      onPress={() => setGender(g.value)}
                      className="flex-1 py-3.5 rounded-xl border items-center shadow-sm"
                      style={{
                        backgroundColor: gender === g.value ? "#1C1C1E" : "#FFFFFF",
                        borderColor: gender === g.value ? "#1C1C1E" : "rgba(0,0,0,0.05)",
                        shadowColor: gender === g.value ? "#1C1C1E" : "#000",
                        shadowOpacity: gender === g.value ? 0.2 : 0.05,
                        shadowRadius: gender === g.value ? 8 : 2,
                      }}
                    >
                      <Text
                        className="font-bold text-[14px]"
                        style={{ color: gender === g.value ? "#fff" : "#1C1C1E" }}
                      >
                        {g.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Field>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(450).duration(800).springify()}>
              <Field label="Age" error={errors.age}>
                <TextInput
                  value={age}
                  onChangeText={(value) => {
                    setAge(value);
                    clearFieldError("age");
                    setApiError("");
                  }}
                  placeholder="e.g. 28"
                  placeholderTextColor="#C6C6C8"
                  keyboardType="number-pad"
                  className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                />
              </Field>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).duration(800).springify()}>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Field label="Height (cm)" error={errors.height}>
                    <TextInput
                      value={height}
                      onChangeText={(value) => {
                        setHeight(value);
                        clearFieldError("height");
                        setApiError("");
                      }}
                      placeholder="175"
                      placeholderTextColor="#C6C6C8"
                      keyboardType="numeric"
                      className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                    />
                  </Field>
                </View>
                <View className="flex-1">
                  <Field label="Weight (kg)" error={errors.weight}>
                    <TextInput
                      value={weight}
                      onChangeText={(value) => {
                        setWeight(value);
                        clearFieldError("weight");
                        setApiError("");
                      }}
                      placeholder="70"
                      placeholderTextColor="#C6C6C8"
                      keyboardType="numeric"
                      className="bg-white rounded-2xl px-5 py-4 text-[17px] text-[#1C1C1E] font-medium border border-black/[0.03]"
                    />
                  </Field>
                </View>
              </View>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(600).duration(800).springify()}>
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="rounded-2xl py-4 items-center mb-6"
              style={{
                backgroundColor: loading ? "#D1D1D6" : "#1C1C1E",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: loading ? 0 : 0.2,
                shadowRadius: 12,
                elevation: loading ? 0 : 4,
              }}
            >
              <Text
                className="text-[17px] font-bold"
                style={{ color: loading ? "#8A8A8E" : "#FFFFFF", letterSpacing: -0.2 }}
              >
                {loading ? "Creating account..." : "Create Account"}
              </Text>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(800).springify()} className="items-center">
            <Pressable
              onPress={() => router.push("/onboarding/login")}
              className="flex-row items-center gap-1"
            >
              <Text className="text-[15px] text-[#8A8A8E] font-medium">
                Already have an account?
              </Text>
              <Text className="text-[15px] text-[#007AFF] font-bold">
                Log in
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
        {label}
      </Text>
      {children}
      {error ? (
        <Animated.View entering={FadeInDown.duration(300)} className="bg-[#FF3B30]/10 rounded-xl p-3 mt-2 flex-row items-center gap-2">
          <Info size={14} color="#FF3B30" />
          <Text className="text-[13px] text-[#FF3B30] font-semibold flex-1">
            {error}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  );
}
