import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Settings as SettingsIcon,
  Mail,
  User as UserIcon,
  Lock,
  Trash2,
} from "lucide-react-native";
import { api, ApiRequestError } from "@/lib/api";
import { getAuth, clearAuth, type AuthState } from "@/lib/user-store";

export default function AccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    getAuth().then(setAuth);
  }, []);

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      Alert.alert("Too short", "New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords don't match.");
      return;
    }
    setChanging(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Updated", "Your password has been changed.");
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : "Could not update password.";
      Alert.alert("Couldn't update", msg);
    } finally {
      setChanging(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      "Delete account?",
      "This submits a deletion request. Your data will be removed within 30 days, per our privacy policy.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Request deletion",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/account/delete", { scope: "full" });
              Alert.alert(
                "Request submitted",
                "We've received your deletion request. You'll be signed out now.",
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      await clearAuth();
                      router.replace("/onboarding/login");
                    },
                  },
                ],
              );
            } catch (err) {
              const msg = err instanceof ApiRequestError ? err.message : "Could not submit request.";
              Alert.alert("Failed", msg);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFC]" edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
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
          keyboardShouldPersistTaps="handled"
        >
          <View className="pt-6 mb-8">
            <View className="w-14 h-14 rounded-2xl bg-[#8A8A8E]/15 items-center justify-center mb-4">
              <SettingsIcon size={26} color="#1C1C1E" strokeWidth={2.2} />
            </View>
            <Text className="text-[32px] font-bold text-[#1C1C1E] tracking-tight">
              Account settings
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] font-medium mt-2 leading-[22px]">
              Manage your email, password, and account data.
            </Text>
          </View>

          {/* Account info */}
          <View className="bg-white rounded-2xl border border-black/[0.03] mb-6">
            <View className="p-5 border-b border-black/[0.04] flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-[#167C80]/10 items-center justify-center mr-3">
                <Mail size={18} color="#167C80" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] text-[#8A8A8E] font-bold uppercase tracking-widest">Email</Text>
                <Text className="text-[15px] text-[#1C1C1E] font-semibold mt-0.5">
                  {auth?.email ?? "—"}
                </Text>
              </View>
            </View>
            <View className="p-5 flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-[#5E5CE6]/10 items-center justify-center mr-3">
                <UserIcon size={18} color="#5E5CE6" strokeWidth={2.2} />
              </View>
              <View className="flex-1">
                <Text className="text-[12px] text-[#8A8A8E] font-bold uppercase tracking-widest">Username</Text>
                <Text className="text-[15px] text-[#1C1C1E] font-semibold mt-0.5">
                  {auth?.username ?? "—"}
                </Text>
              </View>
            </View>
          </View>

          {/* Change password */}
          <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-3">
            Change password
          </Text>
          <View className="bg-white rounded-2xl border border-black/[0.03] p-5 mb-6">
            <View className="flex-row items-center mb-4">
              <Lock size={18} color="#167C80" strokeWidth={2.2} />
              <Text className="text-[15px] text-[#1C1C1E] font-bold ml-2">Update your password</Text>
            </View>

            <FieldInput
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secure
            />
            <FieldInput
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secure
              hint="At least 8 characters"
            />
            <FieldInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
            />

            <Pressable
              onPress={handleChangePassword}
              disabled={changing || !currentPassword || !newPassword}
              className={`rounded-2xl py-4 items-center mt-2 ${
                changing || !currentPassword || !newPassword ? "bg-[#C6C6C8]" : "bg-[#1C1C1E]"
              }`}
            >
              <Text className="text-white text-[15px] font-bold">
                {changing ? "Updating..." : "Update password"}
              </Text>
            </Pressable>
          </View>

          {/* Danger zone */}
          <Text className="text-[12px] font-bold text-[#B42318] uppercase tracking-widest mb-3">
            Danger zone
          </Text>
          <Pressable
            onPress={handleDeleteAccount}
            className="bg-white rounded-2xl border border-[#F4C6CD] p-5 flex-row items-center"
          >
            <View className="w-10 h-10 rounded-xl bg-[#B42318]/10 items-center justify-center mr-3">
              <Trash2 size={18} color="#B42318" strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] text-[#B42318] font-bold">Delete my account</Text>
              <Text className="text-[13px] text-[#8A8A8E] font-medium mt-0.5 leading-[18px]">
                Submit a GDPR-style deletion request. Processed within 30 days.
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  secure,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  hint?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-[12px] font-bold text-[#8A8A8E] uppercase tracking-widest mb-2">
        {label}
      </Text>
      <View className="bg-[#F7F7F8] rounded-2xl border border-black/[0.03]">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secure}
          autoCapitalize="none"
          placeholder="••••••••"
          placeholderTextColor="#C6C6C8"
          className="px-4 py-3 text-[16px] text-[#1C1C1E] font-medium"
        />
      </View>
      {hint ? (
        <Text className="text-[12px] text-[#8A8A8E] mt-1 font-medium">{hint}</Text>
      ) : null}
    </View>
  );
}
