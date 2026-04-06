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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { EmotionTagPicker } from "@/components/mental/EmotionTagPicker";
import { TriggerTagPicker } from "@/components/mental/TriggerTagPicker";
import {
  saveJournalEntry,
  getJournalEntries,
  deleteJournalEntry,
  getLatestRppgScan,
} from "@/lib/mental-store";
import { api } from "@/lib/api";
import { recordFailedSync } from "@/lib/error-reporting";
import type { EmotionTag, TriggerTag, MentalJournalEntry, RppgScanResult } from "@aura/types";

const GUIDED_PROMPT =
  "What happened today? How did it make you feel? What helped, or what would help next time?";

export default function JournalEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!params.id;

  const [text, setText] = useState("");
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>([]);
  const [triggerTags, setTriggerTags] = useState<TriggerTag[]>([]);
  const [linkedScanId, setLinkedScanId] = useState<string | undefined>();
  const [latestScan, setLatestScan] = useState<RppgScanResult | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingEntry, setExistingEntry] = useState<MentalJournalEntry | null>(null);

  // Load existing entry if editing
  useEffect(() => {
    (async () => {
      const scan = await getLatestRppgScan();
      setLatestScan(scan);

      if (params.id) {
        const all = await getJournalEntries();
        const found = all.find((e) => e.entryId === params.id);
        if (found) {
          setExistingEntry(found);
          setText(found.text);
          setEmotionTags(found.emotionTags);
          setTriggerTags(found.triggerTags);
          setLinkedScanId(found.linkedScanId);
        }
      }
    })();
  }, [params.id]);

  const handleSave = useCallback(async () => {
    if (!text.trim()) {
      Alert.alert("Empty Entry", "Write something before saving.");
      return;
    }

    setSaving(true);

    const entry: MentalJournalEntry = {
      entryId: existingEntry?.entryId ?? `je_${Date.now().toString(36)}`,
      userId: "local",
      text: text.trim(),
      emotionTags,
      triggerTags,
      linkedScanId,
      createdAtIso: existingEntry?.createdAtIso ?? new Date().toISOString(),
    };

    await saveJournalEntry(entry);

    try {
      await api.post("/mental/journal", entry);
    } catch (err) {
      recordFailedSync("mental journal sync", err);
    }

    setSaving(false);
    router.back();
  }, [text, emotionTags, triggerTags, linkedScanId, existingEntry, router]);

  const handleDelete = useCallback(() => {
    if (!existingEntry) return;
    Alert.alert("Delete Entry", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteJournalEntry(existingEntry.entryId);
          router.back();
        },
      },
    ]);
  }, [existingEntry, router]);

  function linkScan() {
    if (latestScan) {
      setLinkedScanId(latestScan.scanId);
    }
  }

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
            <Text className="text-[#FF3B30] text-[15px] font-medium">Delete</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View className="pt-4 pb-10">
            {/* Guided prompt toggle */}
            <Pressable
              onPress={() => setShowGuide(!showGuide)}
              className="flex-row items-center gap-2 mb-4"
            >
              <View
                className="w-5 h-5 rounded items-center justify-center"
                style={{
                  backgroundColor: showGuide ? "#AF52DE" : "#E5E5EA",
                }}
              >
                {showGuide && <Text className="text-white text-[12px] font-bold">✓</Text>}
              </View>
              <Text className="text-[14px] text-[#8A8A8E] font-medium">
                Show guided prompt
              </Text>
            </Pressable>

            {showGuide && (
              <GlassCard className="p-3 mb-4" style={{ backgroundColor: "#AF52DE08" }}>
                <Text className="text-[13px] text-[#AF52DE] italic leading-relaxed">
                  {GUIDED_PROMPT}
                </Text>
              </GlassCard>
            )}

            {/* Text input */}
            <GlassCard className="p-4 mb-5">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Write what is on your mind..."
                placeholderTextColor="#C6C6C8"
                multiline
                textAlignVertical="top"
                className="text-[16px] text-black leading-relaxed"
                style={{ minHeight: 160 }}
              />
            </GlassCard>

            {/* Emotion tags */}
            <EmotionTagPicker
              selected={emotionTags}
              onChange={setEmotionTags}
              color="#AF52DE"
            />

            {/* Trigger tags */}
            <TriggerTagPicker
              label="Triggers (optional)"
              selected={triggerTags}
              onChange={setTriggerTags}
              color="#FF9500"
            />

            {/* Link scan */}
            {latestScan && !linkedScanId && (
              <Pressable onPress={linkScan} className="mb-5">
                <GlassCard className="p-3 flex-row items-center gap-3">
                  <Text style={{ fontSize: 20 }}>📸</Text>
                  <View className="flex-1">
                    <Text className="text-[14px] font-semibold text-black">Link recent scan</Text>
                    <Text className="text-[12px] text-[#8A8A8E]">
                      Stress: {latestScan.stressIndex} · {latestScan.heartRateBpm} BPM
                    </Text>
                  </View>
                  <Text className="text-[#AF52DE] font-bold">+</Text>
                </GlassCard>
              </Pressable>
            )}

            {linkedScanId && (
              <View className="flex-row items-center gap-2 mb-5">
                <View className="bg-[#AF52DE10] px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                  <Text style={{ fontSize: 12 }}>📸</Text>
                  <Text className="text-[12px] font-semibold text-[#AF52DE]">Scan linked</Text>
                </View>
                <Pressable onPress={() => setLinkedScanId(undefined)}>
                  <Text className="text-[12px] text-[#FF3B30] font-medium">Remove</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="px-6 pb-6 pt-2">
          <Pressable
            onPress={handleSave}
            disabled={saving}
            className="rounded-2xl py-4 items-center"
            style={{ backgroundColor: saving ? "#C6C6C8" : "#AF52DE" }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {saving ? "Saving..." : isEditing ? "Update Entry" : "Save Entry"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
