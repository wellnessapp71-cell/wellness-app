import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import {
  saveSpiritualJournal,
  getSpiritualJournals,
  deleteSpiritualJournal,
} from "@/lib/spiritual-store";
import { api } from "@/lib/api";
import {
  SPIRITUAL_FEELING_TAGS,
  type SpiritualFeelingTag,
  type SpiritualJournalEntry,
} from "@aura/types";

const TEAL = "#30B0C7";

const PROMPT_TYPES = [
  {
    value: "free",
    label: "Free Writing",
    emoji: "📝",
    desc: "Write whatever is on your mind",
  },
  {
    value: "gratitude",
    label: "Gratitude",
    emoji: "🙏",
    desc: "What are you grateful for?",
  },
  {
    value: "reflection",
    label: "Reflection",
    emoji: "💭",
    desc: "Reflect on your day",
  },
] as const;

const FEELING_EMOJIS: Record<SpiritualFeelingTag, string> = {
  peaceful: "😌",
  distracted: "😵‍💫",
  heavy: "😔",
  grateful: "🙏",
  restless: "😤",
  inspired: "✨",
};

export default function SpiritualJournalEntryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const threeColCardWidth = Math.floor((contentWidth - 16) / 3);
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  // State
  const [promptType, setPromptType] = useState<
    "free" | "gratitude" | "reflection"
  >("gratitude");
  const [moodTag, setMoodTag] = useState<SpiritualFeelingTag | null>(null);
  const [gratitudeText, setGratitudeText] = useState("");
  const [reflectionText, setReflectionText] = useState("");
  const [whatBroughtCalm, setWhatBroughtCalm] = useState("");
  const [whatTriggeredDiscomfort, setWhatTriggeredDiscomfort] = useState("");
  const [whatHelped, setWhatHelped] = useState("");
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] =
    useState<SpiritualJournalEntry | null>(null);

  // Load existing entry if editing
  useEffect(() => {
    if (params.id) {
      (async () => {
        const all = await getSpiritualJournals();
        const found = all.find((e) => e.id === params.id);
        if (found) {
          setExistingEntry(found);
          setPromptType(
            found.promptType as "free" | "gratitude" | "reflection",
          );
          setMoodTag(found.moodTag);
          setGratitudeText(found.gratitudeText ?? "");
          setReflectionText(found.reflectionText ?? "");
          setWhatBroughtCalm(found.whatBroughtCalm ?? "");
          setWhatTriggeredDiscomfort(found.whatTriggeredDiscomfort ?? "");
          setWhatHelped(found.whatHelped ?? "");
        }
      })();
    }
  }, [params.id]);

  const handleSave = useCallback(async () => {
    // Validate at least some content
    const hasContent =
      gratitudeText.trim() ||
      reflectionText.trim() ||
      whatBroughtCalm.trim() ||
      whatTriggeredDiscomfort.trim() ||
      whatHelped.trim();

    if (!hasContent) {
      Alert.alert("Empty Entry", "Write something before saving.");
      return;
    }

    setSaving(true);

    const entry: SpiritualJournalEntry = {
      id: existingEntry?.id ?? `sj_${Date.now().toString(36)}`,
      promptType,
      moodTag,
      gratitudeText: gratitudeText.trim() || null,
      reflectionText: reflectionText.trim() || null,
      whatBroughtCalm: whatBroughtCalm.trim() || null,
      whatTriggeredDiscomfort: whatTriggeredDiscomfort.trim() || null,
      whatHelped: whatHelped.trim() || null,
      createdAt: existingEntry?.createdAt ?? new Date().toISOString(),
    };

    await saveSpiritualJournal(entry);

    // Sync to API (fire & forget)
    try {
      await api.post("/spiritual/journal", entry);
    } catch {
      // offline-first
    }

    setSaving(false);
    router.back();
  }, [
    promptType,
    moodTag,
    gratitudeText,
    reflectionText,
    whatBroughtCalm,
    whatTriggeredDiscomfort,
    whatHelped,
    existingEntry,
    router,
  ]);

  const handleDelete = useCallback(() => {
    if (!existingEntry) return;
    Alert.alert("Delete Entry", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSpiritualJournal(existingEntry.id);
          router.back();
        },
      },
    ]);
  }, [existingEntry, router]);

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full bg-white items-center justify-center"
          >
            <Text className="text-[18px]">‹</Text>
          </Pressable>
          <Text className="text-[20px] font-bold text-black tracking-tight">
            {isEditing ? "Edit Entry" : "New Entry"}
          </Text>
        </View>
        {isEditing && (
          <Pressable onPress={handleDelete}>
            <Text className="text-[#FF3B30] text-[15px] font-medium">
              Delete
            </Text>
          </Pressable>
        )}
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
            {/* Prompt type selector */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              Entry Type
            </Text>
            <View
              className="flex-row justify-between mb-6"
              style={{
                maxWidth: contentWidth,
                width: "100%",
                alignSelf: "center",
              }}
            >
              {PROMPT_TYPES.map((pt) => {
                const active = promptType === pt.value;
                return (
                  <View key={pt.value} style={{ width: threeColCardWidth }}>
                    <Pressable
                      onPress={() => setPromptType(pt.value)}
                      className="py-3 rounded-2xl items-center"
                      style={{
                        backgroundColor: active ? TEAL : "#fff",
                        borderWidth: 1.5,
                        borderColor: active ? TEAL : "#E5E5EA",
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{pt.emoji}</Text>
                      <Text
                        className="text-[12px] font-semibold mt-1"
                        style={{ color: active ? "#fff" : "#3C3C43" }}
                      >
                        {pt.label}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Mood tag row */}
            <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
              How are you feeling?
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SPIRITUAL_FEELING_TAGS.map((tag) => {
                const active = moodTag === tag;
                return (
                  <Pressable
                    key={tag}
                    onPress={() => setMoodTag(active ? null : tag)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full"
                    style={{
                      backgroundColor: active ? TEAL : "#fff",
                      borderWidth: 1.5,
                      borderColor: active ? TEAL : "#E5E5EA",
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{FEELING_EMOJIS[tag]}</Text>
                    <Text
                      className="text-[13px] font-semibold capitalize"
                      style={{ color: active ? "#fff" : "#3C3C43" }}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ─── Conditional Fields ─── */}

            {/* Gratitude field (for gratitude and free) */}
            {(promptType === "gratitude" || promptType === "free") && (
              <>
                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  {promptType === "gratitude"
                    ? "What are you grateful for today?"
                    : "Write freely"}
                </Text>
                <GlassCard className="p-4 mb-5">
                  <TextInput
                    value={gratitudeText}
                    onChangeText={setGratitudeText}
                    placeholder={
                      promptType === "gratitude"
                        ? "I'm grateful for..."
                        : "Write whatever is on your mind..."
                    }
                    placeholderTextColor="#C6C6C8"
                    multiline
                    textAlignVertical="top"
                    className="text-[16px] text-black leading-relaxed"
                    style={{ minHeight: 120 }}
                  />
                </GlassCard>
              </>
            )}

            {/* Reflection fields */}
            {promptType === "reflection" && (
              <>
                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  What brought calm today?
                </Text>
                <GlassCard className="p-4 mb-4">
                  <TextInput
                    value={whatBroughtCalm}
                    onChangeText={setWhatBroughtCalm}
                    placeholder="A moment of stillness, a kind word..."
                    placeholderTextColor="#C6C6C8"
                    multiline
                    textAlignVertical="top"
                    className="text-[16px] text-black leading-relaxed"
                    style={{ minHeight: 80 }}
                  />
                </GlassCard>

                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  What triggered discomfort?
                </Text>
                <GlassCard className="p-4 mb-4">
                  <TextInput
                    value={whatTriggeredDiscomfort}
                    onChangeText={setWhatTriggeredDiscomfort}
                    placeholder="A stressful meeting, conflict..."
                    placeholderTextColor="#C6C6C8"
                    multiline
                    textAlignVertical="top"
                    className="text-[16px] text-black leading-relaxed"
                    style={{ minHeight: 80 }}
                  />
                </GlassCard>

                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  What helped?
                </Text>
                <GlassCard className="p-4 mb-4">
                  <TextInput
                    value={whatHelped}
                    onChangeText={setWhatHelped}
                    placeholder="Breathing, a walk, talking to someone..."
                    placeholderTextColor="#C6C6C8"
                    multiline
                    textAlignVertical="top"
                    className="text-[16px] text-black leading-relaxed"
                    style={{ minHeight: 80 }}
                  />
                </GlassCard>

                {/* Reflection text (optional extra notes) */}
                <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-2">
                  Anything else? (optional)
                </Text>
                <GlassCard className="p-4 mb-4">
                  <TextInput
                    value={reflectionText}
                    onChangeText={setReflectionText}
                    placeholder="Additional thoughts..."
                    placeholderTextColor="#C6C6C8"
                    multiline
                    textAlignVertical="top"
                    className="text-[16px] text-black leading-relaxed"
                    style={{ minHeight: 60 }}
                  />
                </GlassCard>
              </>
            )}
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="px-6 pb-6 pt-2">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : TEAL }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Entry"
                  : promptType === "gratitude"
                    ? "Save Gratitude"
                    : "Save Reflection"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
