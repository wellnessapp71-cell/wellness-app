/**
 * Legacy stress scan entry point — redirects to the full mental scan flow.
 */
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, Text } from "react-native";

export default function StressScanRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/mental/scan");
  }, [router]);

  return (
    <View className="flex-1 bg-black items-center justify-center">
      <Text className="text-white/50 text-[15px]">Redirecting to scan...</Text>
    </View>
  );
}
