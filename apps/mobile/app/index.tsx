import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { isOnboardingComplete, getAuth } from "@/lib/user-store";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const [complete, auth] = await Promise.all([
        isOnboardingComplete(),
        getAuth(),
      ]);

      if (complete && auth) {
        router.replace("/(tabs)/dashboard");
      } else if (auth) {
        // Logged in but profile not complete
        router.replace("/onboarding/questionnaire");
      } else {
        router.replace("/onboarding/referral");
      }
    })();
  }, []);

  return (
    <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}
