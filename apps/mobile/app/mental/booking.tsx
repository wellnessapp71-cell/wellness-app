import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { CrisisButton } from "@/components/mental/CrisisButton";
import { saveSupportRequest } from "@/lib/mental-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import { syncFromApi } from "@/lib/user-store";
import type { SupportMode, SupportRequest } from "@aura/types";

// ─── Options ────────────────────────────────────────────────────────────────

const ISSUE_TYPES = [
  { id: "stress", label: "Stress", icon: "😰" },
  { id: "anxiety", label: "Anxiety", icon: "😟" },
  { id: "depression", label: "Depression", icon: "😔" },
  { id: "relationships", label: "Relationships", icon: "❤️" },
  { id: "work", label: "Work", icon: "💼" },
  { id: "grief", label: "Grief", icon: "🕊️" },
  { id: "sleep", label: "Sleep", icon: "😴" },
  { id: "other", label: "Other", icon: "💭" },
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Spanish",
  "Mandarin",
  "French",
  "Arabic",
  "Portuguese",
  "Other",
];

const STYLES = [
  { id: "directive", label: "Directive", desc: "Clear guidance and practical advice" },
  { id: "non_directive", label: "Non-Directive", desc: "Listen and help you find your own answers" },
  { id: "cbt_based", label: "CBT-Based", desc: "Thought patterns and behavioral change" },
  { id: "mindfulness_based", label: "Mindfulness-Based", desc: "Present-moment awareness techniques" },
];

const MODES: { id: SupportMode; label: string; icon: string; desc: string }[] = [
  { id: "chat", label: "Chat", icon: "💬", desc: "Text-based conversation" },
  { id: "audio", label: "Audio", icon: "🎧", desc: "Voice call" },
  { id: "video", label: "Video", icon: "📹", desc: "Face-to-face video" },
  { id: "in_person", label: "In-Person", icon: "🏥", desc: "Meet at a location" },
];

export default function BookingScreen() {
  const router = useRouter();
  const [issueType, setIssueType] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("English");
  const [style, setStyle] = useState<string | null>(null);
  const [mode, setMode] = useState<SupportMode | null>(null);
  const [reason, setReason] = useState("");
  const [outcome, setOutcome] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<SupportRequest | null>(null);

  const canSubmit = issueType && mode;

  const handleSubmit = useCallback(async () => {
    if (!issueType || !mode) return;
    setSubmitting(true);

    const localRequest: SupportRequest = {
      requestId: `sr_${Date.now().toString(36)}`,
      userId: "local",
      issueType,
      preferredMode: mode,
      status: "pending",
      language,
      preferredStyle: style ?? undefined,
      reason: reason.trim() || undefined,
      desiredOutcome: outcome.trim() || undefined,
      createdAtIso: new Date().toISOString(),
    };

    // Save locally first
    await saveSupportRequest(localRequest);

    let finalRequest = localRequest;
    try {
      const response = await api.post<{
        supportRequest: SupportRequest;
      }>("/mental/support", {
        issueType,
        preferredMode: mode,
        language,
        style: style ?? undefined,
        reason: reason.trim() || undefined,
        outcome: outcome.trim() || undefined,
      });
      finalRequest = response.supportRequest;
      await saveSupportRequest(finalRequest);
      await syncFromApi();
    } catch (err) {
      recordFailedSync("mental support booking sync", err);
    }

    setSubmittedRequest(finalRequest);
    setSubmitting(false);
    setSubmitted(true);
  }, [issueType, mode, language, style, reason, outcome]);

  // ── Success state ──
  if (submitted) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7] items-center justify-center px-8">
        <Text style={{ fontSize: 64 }}>🤝</Text>
        <Text className="text-[28px] font-bold text-black text-center mt-4 tracking-tight">
          Request Submitted
        </Text>
        <Text className="text-[15px] text-[#8A8A8E] text-center mt-2 leading-relaxed">
          We've received your support request. A counselor will be matched to you soon.
        </Text>

        <View className="w-full mt-8">
          <GlassCard className="p-4 mb-3">
            <View className="flex-row items-center gap-2 mb-1">
              <Text style={{ fontSize: 14 }}>📋</Text>
              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
                Your Request
              </Text>
            </View>
            <Text className="text-[15px] font-bold text-black capitalize">
              {submittedRequest?.issueType?.replace("_", " ") ?? issueType?.replace("_", " ")} · {submittedRequest?.preferredMode?.replace("_", " ") ?? mode?.replace("_", " ")}
            </Text>
            <Text className="text-[13px] text-[#8A8A8E] mt-0.5">
              Language: {submittedRequest?.language ?? language} · Status: {submittedRequest?.status ?? "pending"}
            </Text>
          </GlassCard>
        </View>

        <Pressable
          onPress={() => router.back()}
          className="w-full rounded-2xl py-4 items-center bg-[#AF52DE] mt-4"
        >
          <Text className="text-white text-[17px] font-semibold">Return to Hub</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <Text className="text-[20px] font-bold text-black tracking-tight">
          Book a Counselor
        </Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="pt-4 pb-10">
            {/* Headline */}
            <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
              Talk to someone
            </Text>
            <Text className="text-[15px] text-[#8A8A8E] mb-5">
              Choose what feels most comfortable: chat, audio, or video.
            </Text>

            {/* Crisis button */}
            <View className="mb-5">
              <CrisisButton />
            </View>

            {/* ── Issue Type ── */}
            <SectionLabel text="What would you like to discuss?" />
            <View className="flex-row flex-wrap gap-2 mb-5">
              {ISSUE_TYPES.map((issue) => {
                const active = issueType === issue.id;
                return (
                  <Pressable
                    key={issue.id}
                    onPress={() => setIssueType(active ? null : issue.id)}
                    className="flex-row items-center gap-1.5 px-3.5 py-2.5 rounded-xl"
                    style={{
                      backgroundColor: active ? "#AF52DE" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#AF52DE" : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{issue.icon}</Text>
                    <Text
                      className="text-[14px] font-semibold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {issue.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Mode ── */}
            <SectionLabel text="Preferred mode" />
            <View className="gap-2 mb-5">
              {MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <Pressable key={m.id} onPress={() => setMode(active ? null : m.id)}>
                    <GlassCard
                      className="p-4 flex-row items-center gap-3"
                      style={active ? { borderWidth: 2, borderColor: "#AF52DE" } : undefined}
                    >
                      <View
                        className="w-10 h-10 rounded-xl items-center justify-center"
                        style={{ backgroundColor: active ? "#AF52DE15" : "#F2F2F7" }}
                      >
                        <Text style={{ fontSize: 20 }}>{m.icon}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[15px] font-bold text-black">{m.label}</Text>
                        <Text className="text-[12px] text-[#8A8A8E]">{m.desc}</Text>
                      </View>
                      {active && <Text className="text-[#AF52DE] font-bold">✓</Text>}
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Language ── */}
            <SectionLabel text="Language preference" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-5"
              contentContainerStyle={{ gap: 8 }}
            >
              {LANGUAGES.map((lang) => {
                const active = language === lang;
                return (
                  <Pressable
                    key={lang}
                    onPress={() => setLanguage(lang)}
                    className="px-3.5 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? "#AF52DE" : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? "#AF52DE" : "#E5E5EA",
                    }}
                  >
                    <Text
                      className="text-[13px] font-semibold"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {lang}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* ── Style ── */}
            <SectionLabel text="Preferred approach (optional)" />
            <View className="gap-2 mb-5">
              {STYLES.map((s) => {
                const active = style === s.id;
                return (
                  <Pressable key={s.id} onPress={() => setStyle(active ? null : s.id)}>
                    <GlassCard
                      className="p-3.5 flex-row items-center gap-3"
                      style={active ? { borderWidth: 2, borderColor: "#AF52DE" } : undefined}
                    >
                      <View className="flex-1">
                        <Text className="text-[14px] font-bold text-black">{s.label}</Text>
                        <Text className="text-[12px] text-[#8A8A8E]">{s.desc}</Text>
                      </View>
                      {active && <Text className="text-[#AF52DE] font-bold">✓</Text>}
                    </GlassCard>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Reason (optional) ── */}
            <SectionLabel text="Reason for booking (optional)" />
            <GlassCard className="p-4 mb-5">
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Briefly describe what you're going through..."
                placeholderTextColor="#C6C6C8"
                multiline
                textAlignVertical="top"
                className="text-[15px] text-black leading-relaxed"
                style={{ minHeight: 80 }}
              />
            </GlassCard>

            {/* ── Desired outcome (optional) ── */}
            <SectionLabel text="What would you like to achieve? (optional)" />
            <GlassCard className="p-4 mb-6">
              <TextInput
                value={outcome}
                onChangeText={setOutcome}
                placeholder="E.g., better coping strategies, someone to listen..."
                placeholderTextColor="#C6C6C8"
                multiline
                textAlignVertical="top"
                className="text-[15px] text-black leading-relaxed"
                style={{ minHeight: 60 }}
              />
            </GlassCard>

            {/* ── Submit ── */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              className="rounded-2xl py-4 items-center mb-4"
              style={{
                backgroundColor: !canSubmit || submitting ? "#C6C6C8" : "#AF52DE",
              }}
            >
              <Text className="text-white text-[17px] font-semibold">
                {submitting ? "Submitting..." : "Book a Counselor"}
              </Text>
            </Pressable>

            {!canSubmit && (
              <Text className="text-[12px] text-[#8A8A8E] text-center">
                Select an issue type and preferred mode to continue.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Shared label ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
      {text}
    </Text>
  );
}
