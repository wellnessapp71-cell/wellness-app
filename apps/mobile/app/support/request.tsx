import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { api, ApiRequestError } from "@/lib/api";

const THEME = "#167C80";

const CATEGORIES = [
  { value: "mental_health", label: "Mental health", icon: "🧠" },
  { value: "physical_health", label: "Physical health", icon: "💪" },
  { value: "workplace", label: "Workplace", icon: "🏢" },
  { value: "personal", label: "Personal", icon: "💬" },
  { value: "technical", label: "Technical", icon: "🛠️" },
  { value: "other", label: "Other", icon: "❓" },
] as const;

const PRIORITIES = [
  { value: "low", label: "Low", color: "#56707B" },
  { value: "normal", label: "Normal", color: "#167C80" },
  { value: "high", label: "High", color: "#D97706" },
  { value: "urgent", label: "Urgent", color: "#B42318" },
] as const;

type Category = (typeof CATEGORIES)[number]["value"];
type Priority = (typeof PRIORITIES)[number]["value"];

export default function SupportRequestScreen() {
  const router = useRouter();
  const [category, setCategory] = useState<Category>("mental_health");
  const [priority, setPriority] = useState<Priority>("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (message.trim().length < 5) {
      Alert.alert("Add details", "Please describe what you need help with (at least a sentence).");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/help-requests", {
        category,
        priority,
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      Alert.alert(
        "Sent",
        "Your HR team has been notified. They'll reach out based on the priority you selected.",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Could not send your request. Check your connection and try again.";
      Alert.alert("Couldn't send", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0B1E24" }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: THEME, fontSize: 16, marginBottom: 8 }}>← Back</Text>
          </Pressable>
          <Text style={{ color: "white", fontSize: 26, fontWeight: "700", marginBottom: 6 }}>
            Request Support
          </Text>
          <Text style={{ color: "#8FA3AC", fontSize: 14, marginBottom: 20 }}>
            Reach your HR team directly. Urgent issues are escalated to an SLA of 4 hours.
          </Text>

          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "white", fontWeight: "600", marginBottom: 10 }}>Category</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CATEGORIES.map((c) => (
                <Pressable
                  key={c.value}
                  onPress={() => setCategory(c.value)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 14,
                    backgroundColor: category === c.value ? THEME : "#1a3a44",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 13 }}>
                    {c.icon} {c.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>

          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "white", fontWeight: "600", marginBottom: 10 }}>Priority</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {PRIORITIES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setPriority(p.value)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 14,
                    alignItems: "center",
                    backgroundColor: priority === p.value ? p.color : "#1a3a44",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "600" }}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>

          <GlassCard style={{ padding: 16, marginBottom: 16 }}>
            <Text style={{ color: "white", fontWeight: "600", marginBottom: 10 }}>
              Subject (optional)
            </Text>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Short headline"
              placeholderTextColor="#56707B"
              maxLength={200}
              style={{
                backgroundColor: "#1a3a44",
                color: "white",
                padding: 12,
                borderRadius: 12,
                fontSize: 15,
              }}
            />
          </GlassCard>

          <GlassCard style={{ padding: 16, marginBottom: 20 }}>
            <Text style={{ color: "white", fontWeight: "600", marginBottom: 10 }}>
              What&apos;s going on?
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Share as much or as little as you like."
              placeholderTextColor="#56707B"
              multiline
              numberOfLines={8}
              maxLength={5000}
              textAlignVertical="top"
              style={{
                backgroundColor: "#1a3a44",
                color: "white",
                padding: 12,
                borderRadius: 12,
                fontSize: 15,
                minHeight: 160,
              }}
            />
          </GlassCard>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: THEME,
              padding: 16,
              borderRadius: 16,
              alignItems: "center",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                Send to HR
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
