import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Shield, Share2, FlaskConical, Download } from "lucide-react-native";
import { api, ApiRequestError } from "@/lib/api";
import { getConsentState, setConsentState } from "@/lib/user-store";

type Consent = { hrSharing: boolean; research: boolean; dataExport: boolean };

const DEFAULTS: Consent = { hrSharing: true, research: false, dataExport: true };

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [consent, setConsent] = useState<Consent>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getConsentState();
      if (stored) setConsent({ ...DEFAULTS, ...stored });
      setLoading(false);
    })();
  }, []);

  async function toggle(key: keyof Consent, value: boolean) {
    const next = { ...consent, [key]: value };
    setConsent(next);
    setSaving(true);
    try {
      await api.post("/profile", { consentState: next });
      await setConsentState(next);
    } catch (err) {
      setConsent(consent);
      const msg = err instanceof ApiRequestError ? err.message : "Unable to save preference.";
      Alert.alert("Save failed", msg);
    } finally {
      setSaving(false);
    }
  }

  const rows = [
    {
      key: "hrSharing" as const,
      Icon: Share2,
      color: "#167C80",
      label: "Share with my HR team",
      sub: "Anonymized wellness scores and participation. HR never sees individual responses.",
    },
    {
      key: "research" as const,
      Icon: FlaskConical,
      color: "#5E5CE6",
      label: "Anonymous research",
      sub: "Contribute de-identified data to improve wellness programs.",
    },
    {
      key: "dataExport" as const,
      Icon: Download,
      color: "#34C759",
      label: "Allow data export",
      sub: "Include my data when I request an export of my information.",
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
          <View className="w-14 h-14 rounded-2xl bg-[#34C759]/10 items-center justify-center mb-4">
            <Shield size={26} color="#34C759" strokeWidth={2.2} />
          </View>
          <Text className="text-[32px] font-bold text-[#1C1C1E] tracking-tight">
            Privacy & Consent
          </Text>
          <Text className="text-[15px] text-[#8A8A8E] font-medium mt-2 leading-[22px]">
            Choose what you share and with whom. You can change these any time.
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
                  value={consent[key]}
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
