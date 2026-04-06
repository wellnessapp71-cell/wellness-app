import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Easing,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as Speech from "expo-speech";
import {
  Leaf,
  Waves,
  Heart,
  Brain,
  Sun,
  Cloud,
  Feather,
  Sparkles,
  Star,
  Moon,
  ArrowLeft,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Check,
  Lightbulb,
  BookOpen,
} from "lucide-react-native";
import { getContentProgress, saveContentProgress } from "@/lib/mental-store";
import {
  MENTAL_LESSONS_BY_ID,
  type MentalLessonModule,
} from "@/lib/mental-lessons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = 60;

const THEMES = [
  {
    bg: "#F0F7F3",
    card: "#FFFFFF",
    cardBorder: "#D4EDDA",
    accent: "#2D8A56",
    accentLight: "#E8F5EE",
    accentGlow: "rgba(45,138,86,0.10)",
    Icon: Leaf,
    tipBg: "#F0F9F4",
  },
  {
    bg: "#EEF3FD",
    card: "#FFFFFF",
    cardBorder: "#D0DFFA",
    accent: "#3B6FD4",
    accentLight: "#E6EEFD",
    accentGlow: "rgba(59,111,212,0.10)",
    Icon: Waves,
    tipBg: "#EDF4FF",
  },
  {
    bg: "#FDF0F2",
    card: "#FFFFFF",
    cardBorder: "#F8D4DA",
    accent: "#CA4B63",
    accentLight: "#FDE9EC",
    accentGlow: "rgba(202,75,99,0.10)",
    Icon: Heart,
    tipBg: "#FFF0F3",
  },
  {
    bg: "#F5F0FA",
    card: "#FFFFFF",
    cardBorder: "#DDD0F0",
    accent: "#8B52C8",
    accentLight: "#F3EBF7",
    accentGlow: "rgba(139,82,200,0.10)",
    Icon: Brain,
    tipBg: "#F8F2FD",
  },
  {
    bg: "#FFF8EB",
    card: "#FFFFFF",
    cardBorder: "#F5E2B0",
    accent: "#C98520",
    accentLight: "#FEF4D6",
    accentGlow: "rgba(201,133,32,0.10)",
    Icon: Sun,
    tipBg: "#FFFAEE",
  },
  {
    bg: "#EFF8FC",
    card: "#FFFFFF",
    cardBorder: "#C4E4F0",
    accent: "#2A90B0",
    accentLight: "#EAF7FD",
    accentGlow: "rgba(42,144,176,0.10)",
    Icon: Cloud,
    tipBg: "#F0F9FD",
  },
  {
    bg: "#F7F2EF",
    card: "#FFFFFF",
    cardBorder: "#E4D5CC",
    accent: "#9A6E5C",
    accentLight: "#F5ECE8",
    accentGlow: "rgba(154,110,92,0.10)",
    Icon: Feather,
    tipBg: "#FAF5F2",
  },
  {
    bg: "#EEF7FC",
    card: "#FFFFFF",
    cardBorder: "#BFE0EF",
    accent: "#3590AB",
    accentLight: "#E6F4FF",
    accentGlow: "rgba(53,144,171,0.10)",
    Icon: Sparkles,
    tipBg: "#F1F9FE",
  },
  {
    bg: "#FAF2FA",
    card: "#FFFFFF",
    cardBorder: "#E8CEE8",
    accent: "#A05CA0",
    accentLight: "#FAE6FA",
    accentGlow: "rgba(160,92,160,0.10)",
    Icon: Star,
    tipBg: "#FCF4FC",
  },
  {
    bg: "#F0F2F6",
    card: "#FFFFFF",
    cardBorder: "#CDD3DE",
    accent: "#506882",
    accentLight: "#E5E8F0",
    accentGlow: "rgba(80,104,130,0.10)",
    Icon: Moon,
    tipBg: "#F3F5F9",
  },
];

// Micro-tips shown beneath certain slides
const SLIDE_TIPS: Record<number, string> = {
  0: "Take a deep breath before reading each slide",
  2: "Try to relate this to your own experience",
  4: "Pause here if you need a moment to reflect",
};

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId: string }>();
  const [module, setModule] = useState<MentalLessonModule | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Refs to avoid stale closures in PanResponder ──
  const currentSlideRef = useRef(0);
  const moduleRef = useRef<MentalLessonModule | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dotScale = useRef(new Animated.Value(1)).current;

  // Keep refs in sync
  useEffect(() => {
    currentSlideRef.current = currentSlide;
  }, [currentSlide]);

  useEffect(() => {
    moduleRef.current = module;
  }, [module]);

  useEffect(() => {
    (async () => {
      if (!params.moduleId) return;

      setLoading(true);
      setCurrentSlide(0);
      currentSlideRef.current = 0;
      const loadedModule = MENTAL_LESSONS_BY_ID[params.moduleId] ?? null;
      setModule(loadedModule);
      moduleRef.current = loadedModule;

      const storedProgress = await getContentProgress();
      setProgress(storedProgress[params.moduleId] ?? 0);
      setLoading(false);
    })();
  }, [params.moduleId]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const updateProgress = useCallback(
    async (slideIndex: number, slideCount: number) => {
      if (!params.moduleId) return;
      const nextProgress = Math.round(((slideIndex + 1) / slideCount) * 100);
      if (nextProgress <= progress) return;
      await saveContentProgress(params.moduleId, nextProgress);
      setProgress(nextProgress);
    },
    [params.moduleId, progress],
  );

  const animateToSlide = useCallback(
    (nextIndex: number, direction: "next" | "prev") => {
      const mod = moduleRef.current;
      if (!mod) return;

      Speech.stop();
      setIsPlaying(false);

      // Animate out
      fadeAnim.setValue(0);
      slideAnim.setValue(direction === "next" ? 40 : -40);
      scaleAnim.setValue(0.95);

      setCurrentSlide(nextIndex);
      currentSlideRef.current = nextIndex;

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 14,
          bounciness: 4,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          speed: 14,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();

      // Dot pulse
      Animated.sequence([
        Animated.timing(dotScale, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(dotScale, {
          toValue: 1,
          speed: 20,
          bounciness: 10,
          useNativeDriver: true,
        }),
      ]).start();

      void updateProgress(nextIndex, mod.slides.length);
    },
    [fadeAnim, slideAnim, scaleAnim, dotScale, updateProgress],
  );

  const goToSlide = useCallback(
    (nextIndex: number) => {
      const mod = moduleRef.current;
      const cur = currentSlideRef.current;
      if (!mod) return;
      const bounded = Math.max(0, Math.min(mod.slides.length - 1, nextIndex));
      if (bounded === cur) return;
      animateToSlide(bounded, bounded > cur ? "next" : "prev");
    },
    [animateToSlide],
  );

  // ── Stable PanResponder using refs ──
  const goToSlideRef = useRef(goToSlide);
  useEffect(() => {
    goToSlideRef.current = goToSlide;
  }, [goToSlide]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dx) > 20 && Math.abs(gs.dx) > Math.abs(gs.dy * 1.5),
        onPanResponderRelease: (_, gs) => {
          if (gs.dx <= -SWIPE_THRESHOLD) {
            goToSlideRef.current(currentSlideRef.current + 1);
          } else if (gs.dx >= SWIPE_THRESHOLD) {
            goToSlideRef.current(currentSlideRef.current - 1);
          }
        },
      }),
    [], // Stable — uses refs internally
  );

  const handleToggleAudio = useCallback(() => {
    if (!module) return;
    if (isPlaying) {
      Speech.stop();
      setIsPlaying(false);
      return;
    }
    const text = module.slides[currentSlide].text;
    setIsPlaying(true);
    Speech.speak(text, {
      language: "en",
      rate: 0.85,
      pitch: 1.0,
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  }, [currentSlide, isPlaying, module]);

  // ── Loading State ──
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F7FA] items-center justify-center">
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View className="items-center gap-4">
            <View className="w-20 h-20 rounded-[28px] bg-white items-center justify-center"
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 8 },
                elevation: 5,
              }}
            >
              <BookOpen color="#3B6FD4" size={32} strokeWidth={2} />
            </View>
            <Text className="text-[17px] font-semibold text-[#3B6FD4] tracking-tight">
              Preparing your lesson…
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // ── Not Found State ──
  if (!module) {
    return (
      <SafeAreaView className="flex-1 bg-[#F5F7FA] items-center justify-center px-8">
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-[28px] bg-[#FEF0F0] items-center justify-center">
            <Text style={{ fontSize: 36 }}>📭</Text>
          </View>
          <Text className="text-[20px] font-bold text-[#1C1C1E] tracking-tight">
            Lesson not found
          </Text>
          <Text className="text-[15px] text-[#8E8E93] text-center leading-6">
            This lesson might have been removed or is temporarily unavailable.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-full bg-[#3B6FD4] px-8 py-4 flex-row items-center gap-2"
            style={{
              shadowColor: "#3B6FD4",
              shadowOpacity: 0.3,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
              elevation: 5,
            }}
          >
            <ArrowLeft color="#fff" size={20} />
            <Text className="text-white font-bold text-[16px]">Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const slide = module.slides[currentSlide];
  const totalSlides = module.slides.length;
  const atStart = currentSlide === 0;
  const atEnd = currentSlide === totalSlides - 1;
  const theme = THEMES[currentSlide % THEMES.length];
  const ThemeIcon = theme.Icon;
  const progressPercent = ((currentSlide + 1) / totalSlides) * 100;
  const tip = SLIDE_TIPS[currentSlide];

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
      <View className="flex-1">
        {/* ── Top Navigation Bar ── */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Speech.stop();
                router.back();
              }}
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.accentLight }}
            >
              <ArrowLeft color={theme.accent} size={22} />
            </Pressable>

            <View className="flex-1 mx-4 items-center">
              <Text
                className="text-[15px] font-bold tracking-tight"
                style={{ color: theme.accent }}
                numberOfLines={1}
              >
                {module.title}
              </Text>
            </View>

            <Pressable
              onPress={handleToggleAudio}
              className="w-11 h-11 rounded-full items-center justify-center"
              style={{
                backgroundColor: isPlaying ? theme.accent : theme.accentLight,
              }}
            >
              {isPlaying ? (
                <VolumeX color="#FFFFFF" size={20} />
              ) : (
                <Volume2 color={theme.accent} size={20} />
              )}
            </Pressable>
          </View>

          {/* ── Segmented Progress Bar ── */}
          <View className="flex-row mt-4 gap-1">
            {module.slides.map((_, i) => (
              <View
                key={i}
                className="flex-1 h-[3px] rounded-full overflow-hidden"
                style={{ backgroundColor: theme.accentLight }}
              >
                <View
                  className="h-full rounded-full"
                  style={{
                    width: i < currentSlide ? "100%" : i === currentSlide ? "100%" : "0%",
                    backgroundColor: theme.accent,
                    opacity: i <= currentSlide ? 1 : 0.25,
                  }}
                />
              </View>
            ))}
          </View>

          {/* ── Slide Counter ── */}
          <View className="flex-row items-center justify-center mt-3 gap-2">
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: theme.accentLight }}
            >
              <Text
                className="text-[12px] font-bold"
                style={{ color: theme.accent }}
              >
                {currentSlide + 1} / {totalSlides}
              </Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: theme.accentLight }}
            >
              <Text
                className="text-[12px] font-bold"
                style={{ color: theme.accent }}
              >
                {module.duration}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Main Content Area with Swipe ── */}
        <View className="flex-1 px-5 pt-2 pb-4" {...panResponder.panHandlers}>
          <Animated.View
            className="flex-1 rounded-[32px] overflow-hidden"
            style={{
              backgroundColor: theme.card,
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim },
              ],
              borderWidth: 1,
              borderColor: theme.cardBorder,
              shadowColor: theme.accent,
              shadowOpacity: 0.08,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 6,
            }}
          >
            {/* ── Decorative Header Strip ── */}
            <View
              className="items-center pt-8 pb-6"
              style={{ backgroundColor: theme.accentGlow }}
            >
              <View
                className="w-[72px] h-[72px] rounded-[24px] items-center justify-center"
                style={{
                  backgroundColor: theme.accentLight,
                  shadowColor: theme.accent,
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 4,
                }}
              >
                <ThemeIcon
                  color={theme.accent}
                  size={36}
                  strokeWidth={2}
                />
              </View>
            </View>

            {/* ── Slide Content ── */}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                paddingHorizontal: 28,
                paddingTop: 28,
                paddingBottom: 24,
                flexGrow: 1,
                justifyContent: "center",
              }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                className="text-[24px] leading-[38px] font-bold text-center"
                style={{
                  color: "#1C1C1E",
                  letterSpacing: -0.4,
                }}
              >
                {slide.text}
              </Text>

              {/* ── Tip Section ── */}
              {tip && (
                <View
                  className="flex-row items-center gap-3 mt-8 p-4 rounded-[20px]"
                  style={{ backgroundColor: theme.tipBg }}
                >
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: theme.accentLight }}
                  >
                    <Lightbulb color={theme.accent} size={18} strokeWidth={2.5} />
                  </View>
                  <Text
                    className="flex-1 text-[13px] leading-5 font-medium"
                    style={{ color: theme.accent, opacity: 0.85 }}
                  >
                    {tip}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* ── Dot Indicators ── */}
            <View className="flex-row items-center justify-center gap-2 pb-6 px-6">
              {module.slides.map((_, i) => {
                const isActive = i === currentSlide;
                return (
                  <Pressable
                    key={i}
                    onPress={() => goToSlide(i)}
                    hitSlop={8}
                  >
                    <Animated.View
                      style={{
                        width: isActive ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: isActive
                          ? theme.accent
                          : i < currentSlide
                            ? theme.accent
                            : theme.cardBorder,
                        opacity: isActive ? 1 : i < currentSlide ? 0.5 : 0.35,
                        transform: isActive ? [{ scale: dotScale }] : [],
                      }}
                    />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </View>

        {/* ── Bottom Controls ── */}
        <View className="px-5 pb-4">
          <View className="flex-row items-center gap-3">
            {/* Previous Button */}
            <Pressable
              onPress={() => goToSlide(currentSlide - 1)}
              disabled={atStart}
              className="w-[60px] h-[56px] rounded-[20px] items-center justify-center"
              style={{
                backgroundColor: atStart ? "transparent" : theme.accentLight,
                opacity: atStart ? 0.3 : 1,
                borderWidth: atStart ? 0 : 1,
                borderColor: theme.cardBorder,
              }}
            >
              <ChevronLeft
                color={theme.accent}
                size={26}
                strokeWidth={2.5}
              />
            </Pressable>

            {/* Main Action Button */}
            <Pressable
              onPress={() => {
                if (atEnd) {
                  Speech.stop();
                  router.back();
                } else {
                  goToSlide(currentSlide + 1);
                }
              }}
              className="flex-1 h-[56px] rounded-[20px] flex-row items-center justify-center gap-2.5"
              style={{
                backgroundColor: theme.accent,
                shadowColor: theme.accent,
                shadowOpacity: 0.3,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 5,
              }}
            >
              {atEnd ? (
                <>
                  <Check color="#FFFFFF" size={22} strokeWidth={3} />
                  <Text className="text-[17px] font-bold text-white tracking-tight">
                    Complete Lesson
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-[17px] font-bold text-white tracking-tight">
                    Continue
                  </Text>
                  <ChevronRight color="#FFFFFF" size={22} strokeWidth={3} />
                </>
              )}
            </Pressable>
          </View>

          {/* ── Swipe Hint ── */}
          {currentSlide === 0 && (
            <Text className="text-[12px] text-center mt-3 font-medium" style={{ color: theme.accent, opacity: 0.5 }}>
              Swipe left or right to navigate
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
