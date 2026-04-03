import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { getSpiritualContentProgress } from "@/lib/spiritual-store";
import { api } from "@/lib/api";
import { SPIRITUAL_CONTENT_CATEGORIES, type SpiritualContentCategory } from "@aura/types";

const TEAL = "#30B0C7";

// ─── Content Definition ─────────────────────────────────────────────────────

interface SpiritualContent {
  contentId: string;
  title: string;
  description: string;
  category: string;
  type: string;
  duration: string;
  difficulty: string;
  free: boolean;
  order: number;
}

// ─── Fallback content (used when API is unreachable) ─────────────────────────

const FALLBACK_CONTENT: SpiritualContent[] = [
  {
    contentId: "quick_calm_reset",
    title: "1-Minute Calm Reset",
    description: "When everything feels overwhelming, this 60-second practice brings you back.",
    category: "stress_release",
    type: "breathwork",
    duration: "1 min",
    difficulty: "beginner",
    free: true,
    order: 0,
  },
  {
    contentId: "meditation_101",
    title: "Introduction to Meditation",
    description: "A gentle guide to starting a meditation practice. Learn to sit, breathe, and be present.",
    category: "silent_sitting",
    type: "meditation",
    duration: "5 min",
    difficulty: "beginner",
    free: true,
    order: 1,
  },
  {
    contentId: "breathwork_basics",
    title: "Breathwork Fundamentals",
    description: "Master box breathing, 4-7-8, and calm breath techniques for instant stress relief.",
    category: "stress_release",
    type: "breathwork",
    duration: "8 min",
    difficulty: "beginner",
    free: true,
    order: 2,
  },
  {
    contentId: "gratitude_practice",
    title: "Daily Gratitude Practice",
    description: "Transform your mindset with a simple daily gratitude ritual. Includes guided prompts.",
    category: "gratitude",
    type: "journaling",
    duration: "5 min",
    difficulty: "beginner",
    free: true,
    order: 3,
  },
  {
    contentId: "guided_meditation",
    title: "Guided Relaxation Meditation",
    description: "A soothing guided meditation to release tension and find inner peace.",
    category: "stress_release",
    type: "meditation",
    duration: "10 min",
    difficulty: "beginner",
    free: true,
    order: 4,
  },
  {
    contentId: "bedtime_calm",
    title: "Bedtime Calm Routine",
    description: "Wind down with a gentle body scan and breathing exercise designed for better sleep.",
    category: "sleep",
    type: "meditation",
    duration: "12 min",
    difficulty: "beginner",
    free: true,
    order: 5,
  },
  {
    contentId: "body_awareness",
    title: "Body Awareness Check-In",
    description: "Learn to tune into physical sensations and develop mindful body awareness.",
    category: "self_compassion",
    type: "meditation",
    duration: "7 min",
    difficulty: "beginner",
    free: true,
    order: 6,
  },
  {
    contentId: "purpose_journaling",
    title: "Finding Your Purpose",
    description: "Guided journaling prompts to explore your values, passions, and sense of meaning.",
    category: "gratitude",
    type: "journaling",
    duration: "10 min",
    difficulty: "intermediate",
    free: true,
    order: 7,
  },
  {
    contentId: "nature_walk",
    title: "Mindful Nature Walk",
    description: "Transform your daily walk into a mindfulness practice. Notice, breathe, connect.",
    category: "focus",
    type: "nature",
    duration: "15 min",
    difficulty: "beginner",
    free: true,
    order: 8,
  },
  {
    contentId: "anxiety_breathing",
    title: "Breathing for Anxiety Relief",
    description: "Specific breathing patterns designed to calm the nervous system during anxiety.",
    category: "anxiety_relief",
    type: "breathwork",
    duration: "6 min",
    difficulty: "beginner",
    free: true,
    order: 9,
  },
  {
    contentId: "values_alignment",
    title: "Values Alignment Journal",
    description: "Reflect on whether your daily actions align with your core values.",
    category: "self_compassion",
    type: "journaling",
    duration: "8 min",
    difficulty: "intermediate",
    free: false,
    order: 10,
  },
  {
    contentId: "advanced_meditation",
    title: "Advanced Meditation Techniques",
    description: "Explore loving-kindness, visualization, and open awareness meditation.",
    category: "silent_sitting",
    type: "meditation",
    duration: "20 min",
    difficulty: "advanced",
    free: false,
    order: 11,
  },
  {
    contentId: "chakra_exploration",
    title: "Chakra Energy Awareness",
    description: "A guided tour through the seven chakras with meditation and breathwork.",
    category: "chakra",
    type: "meditation",
    duration: "15 min",
    difficulty: "advanced",
    free: false,
    order: 12,
  },
  {
    contentId: "kindness_challenge",
    title: "7-Day Kindness Challenge",
    description: "Small daily acts of kindness that boost your sense of connection and meaning.",
    category: "self_compassion",
    type: "kindness_act",
    duration: "5 min/day",
    difficulty: "beginner",
    free: true,
    order: 13,
  },
];

const CATEGORY_LABELS: Record<string, { label: string; emoji: string }> = {
  all: { label: "All", emoji: "✨" },
  sleep: { label: "Sleep", emoji: "😴" },
  stress_release: { label: "Stress Relief", emoji: "🌬️" },
  focus: { label: "Focus", emoji: "🎯" },
  gratitude: { label: "Gratitude", emoji: "🙏" },
  anxiety_relief: { label: "Anxiety", emoji: "😮‍💨" },
  self_compassion: { label: "Self-Care", emoji: "💗" },
  chakra: { label: "Chakra", emoji: "🔮" },
  silent_sitting: { label: "Sitting", emoji: "🧘" },
};

const TYPE_LABELS: Record<string, { emoji: string; color: string }> = {
  meditation: { emoji: "🧘", color: "#5856D6" },
  breathwork: { emoji: "🌬️", color: TEAL },
  journaling: { emoji: "📝", color: "#FF9500" },
  nature: { emoji: "🌳", color: "#34C759" },
  kindness_act: { emoji: "💗", color: "#FF2D55" },
};

export default function SpiritualLibraryScreen() {
  const router = useRouter();
  const [content, setContent] = useState<SpiritualContent[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [category, setCategory] = useState<SpiritualContentCategory | "all">("all");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);

        const prog = await getSpiritualContentProgress();
        setProgress(prog);

        try {
          const data = await api.get<{ content: SpiritualContent[] }>("/spiritual/content");
          if (data.content && data.content.length > 0) {
            setContent(data.content);
          } else {
            setContent(FALLBACK_CONTENT);
          }
        } catch {
          setContent(FALLBACK_CONTENT);
        }

        setLoading(false);
      })();
    }, []),
  );

  const categories: (SpiritualContentCategory | "all")[] = ["all", ...SPIRITUAL_CONTENT_CATEGORIES];

  const filtered = category === "all"
    ? content
    : content.filter((c) => c.category === category);

  const completedCount = content.filter((c) => (progress[c.contentId] ?? 0) >= 100).length;

  function handleContentPress(item: SpiritualContent) {
    if (item.type === "breathwork") {
      router.push("/spiritual/breathwork");
    } else if (item.type === "meditation") {
      router.push("/spiritual/meditation");
    } else if (item.type === "journaling") {
      router.push("/spiritual/journal-entry");
    } else if (item.type === "nature") {
      router.push("/spiritual/meditation"); // nature walks use meditation timer
    } else {
      router.push("/spiritual/meditation"); // fallback
    }
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
          Practice Library
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4">
          {/* Hero */}
          <Text className="text-[28px] font-bold text-black tracking-tight mb-1">
            Find your calm
          </Text>
          <Text className="text-[15px] text-[#8A8A8E] mb-2">
            Meditation, breathwork, gratitude & more · {completedCount}/{content.length} explored
          </Text>

          {/* Progress bar */}
          <View className="h-2 bg-[#E5E5EA] rounded-full mb-5 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: content.length > 0 ? `${(completedCount / content.length) * 100}%` : "0%",
                backgroundColor: TEAL,
              }}
            />
          </View>
        </View>

        {/* Category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        >
          {categories.map((cat) => {
            const active = category === cat;
            const info = CATEGORY_LABELS[cat] ?? { label: cat, emoji: "📖" };
            return (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                className="flex-row items-center gap-1 px-3.5 py-2 rounded-full"
                style={{
                  backgroundColor: active ? TEAL : "#fff",
                  borderWidth: 1.5,
                  borderColor: active ? TEAL : "#E5E5EA",
                }}
              >
                <Text style={{ fontSize: 14 }}>{info.emoji}</Text>
                <Text
                  className="text-[13px] font-semibold"
                  style={{ color: active ? "#fff" : "#3C3C43" }}
                >
                  {info.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Content list */}
        <View className="px-6 pb-10">
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={TEAL} size="large" />
              <Text className="text-[14px] text-[#8A8A8E] mt-3">Loading practices...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16">
              <Text style={{ fontSize: 40 }}>🧘</Text>
              <Text className="text-[17px] font-bold text-black mt-3">No practices found</Text>
              <Text className="text-[14px] text-[#8A8A8E] mt-1 text-center">
                No content matches the selected category.
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <ContentCard
                key={item.contentId}
                item={item}
                progress={progress[item.contentId] ?? 0}
                onPress={() => handleContentPress(item)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Content Card ────────────────────────────────────────────────────────────

function ContentCard({
  item,
  progress,
  onPress,
}: {
  item: SpiritualContent;
  progress: number;
  onPress: () => void;
}) {
  const typeInfo = TYPE_LABELS[item.type] ?? { emoji: "📖", color: TEAL };
  const completed = progress >= 100;

  return (
    <Pressable onPress={onPress} className="mb-3">
      <GlassCard className="p-4 flex-row items-center gap-4">
        <View
          className="w-12 h-12 rounded-2xl items-center justify-center"
          style={{ backgroundColor: typeInfo.color + "15" }}
        >
          <Text style={{ fontSize: 24 }}>{typeInfo.emoji}</Text>
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-0.5">
            <Text className="text-[15px] font-bold text-black tracking-tight flex-1" numberOfLines={1}>
              {item.title}
            </Text>
            {completed && <Text className="text-[12px]">✅</Text>}
            {!item.free && (
              <View className="px-1.5 py-0.5 rounded bg-[#FFD60A]">
                <Text className="text-[9px] font-bold text-black">PRO</Text>
              </View>
            )}
          </View>
          <Text className="text-[13px] text-[#8A8A8E] mb-1.5" numberOfLines={2}>
            {item.description}
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-[11px] font-semibold" style={{ color: typeInfo.color }}>
              {item.type.replace(/_/g, " ")}
            </Text>
            <Text className="text-[11px] text-[#C6C6C8]">·</Text>
            <Text className="text-[11px] text-[#8A8A8E]">{item.duration}</Text>
            <Text className="text-[11px] text-[#C6C6C8]">·</Text>
            <Text className="text-[11px] text-[#8A8A8E] capitalize">{item.difficulty}</Text>
          </View>
          {/* Progress bar */}
          {progress > 0 && progress < 100 && (
            <View className="h-1 bg-[#E5E5EA] rounded-full mt-2">
              <View
                className="h-1 rounded-full"
                style={{ width: `${progress}%`, backgroundColor: typeInfo.color }}
              />
            </View>
          )}
        </View>
        <Text className="text-[18px]" style={{ color: TEAL }}>›</Text>
      </GlassCard>
    </Pressable>
  );
}
