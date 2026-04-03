import {
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Audio } from "expo-av";
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
} from "lucide-react-native";
import { getContentProgress, saveContentProgress } from "@/lib/mental-store";
import {
  MENTAL_LESSONS_BY_ID,
  type MentalLessonModule,
} from "@/lib/mental-lessons";

const SWIPE_THRESHOLD = 70;

const THEMES = [
  { bg: "#F4F9F6", card: "#E8F4EE", accent: "#439C74", Icon: Leaf },
  { bg: "#F2F6FE", card: "#E6EEFD", accent: "#4A79D1", Icon: Waves },
  { bg: "#FEF4F6", card: "#FDE9EC", accent: "#D66579", Icon: Heart },
  { bg: "#F9F5FB", card: "#F3EBF7", accent: "#9C62D6", Icon: Brain },
  { bg: "#FFFAEB", card: "#FEF4D6", accent: "#DE9936", Icon: Sun },
  { bg: "#F5FCFE", card: "#EAF7FD", accent: "#37A2C4", Icon: Cloud },
  { bg: "#FAF6F4", card: "#F5ECE8", accent: "#A87D6C", Icon: Feather },
  { bg: "#F3FAFF", card: "#E6F4FF", accent: "#459FB8", Icon: Sparkles },
  { bg: "#FDF7FD", card: "#FAE6FA", accent: "#B36CB2", Icon: Star },
  { bg: "#F2F4F8", card: "#E5E8F0", accent: "#5C7594", Icon: Moon },
];

export default function LessonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ moduleId: string }>();
  const [module, setModule] = useState<MentalLessonModule | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      if (!params.moduleId) return;

      setLoading(true);
      setCurrentSlide(0);
      setModule(MENTAL_LESSONS_BY_ID[params.moduleId] ?? null);

      const storedProgress = await getContentProgress();
      setProgress(storedProgress[params.moduleId] ?? 0);
      setLoading(false);
    })();
  }, [params.moduleId]);

  const stopAudio = useCallback(async () => {
    if (!sound) {
      setIsPlaying(false);
      return;
    }
    try {
      await sound.stopAsync();
    } catch {}
    try {
      await sound.unloadAsync();
    } catch {}
    setSound(null);
    setIsPlaying(false);
  }, [sound]);

  useEffect(() => {
    return () => {
      void stopAudio();
    };
  }, [stopAudio]);

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

  const goToSlide = useCallback(
    async (nextIndex: number) => {
      if (!module) return;
      const boundedIndex = Math.max(
        0,
        Math.min(module.slides.length - 1, nextIndex),
      );
      if (boundedIndex === currentSlide) return;

      await stopAudio();

      const isNext = boundedIndex > currentSlide;

      fadeAnim.setValue(0);
      slideAnim.setValue(isNext ? 25 : -25);

      setCurrentSlide(boundedIndex);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      await updateProgress(boundedIndex, module.slides.length);
    },
    [currentSlide, fadeAnim, slideAnim, module, stopAudio, updateProgress],
  );

  const handleToggleAudio = useCallback(async () => {
    if (!module) return;
    if (isPlaying) {
      Speech.stop();
      await stopAudio();
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
  }, [currentSlide, isPlaying, module, stopAudio]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            void goToSlide(currentSlide + 1);
          } else if (gestureState.dx >= SWIPE_THRESHOLD) {
            void goToSlide(currentSlide - 1);
          }
        },
      }),
    [currentSlide, goToSlide],
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F4F9F6] items-center justify-center">
        <View className="animate-pulse flex-row items-center gap-3">
          <Leaf color="#439C74" size={28} />
          <Text className="text-[17px] font-medium text-[#439C74]">
            Relaxing...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!module) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7] items-center justify-center px-8">
        <Text className="text-[18px] font-bold text-black">
          Lesson not found
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-5 rounded-full bg-[#AF52DE] px-6 py-3.5 flex-row items-center justify-center gap-2"
        >
          <ArrowLeft color="#fff" size={20} />
          <Text className="text-white font-semibold text-[16px]">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const slide = module.slides[currentSlide];
  const atStart = currentSlide === 0;
  const atEnd = currentSlide === module.slides.length - 1;
  const theme = THEMES[currentSlide % THEMES.length];
  const ThemeIcon = theme.Icon;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.bg }}>
      <View className="flex-1 px-6 pt-6 pb-8">
        {/* Navigation & Controls header */}
        <View className="flex-row items-center justify-between mb-8">
          <Pressable
            onPress={() => router.back()}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: theme.card }}
          >
            <ArrowLeft color={theme.accent} size={24} />
          </Pressable>

          <View className="flex-1 px-4">
            <Text
              className="text-[16px] font-bold tracking-tight text-center"
              style={{ color: theme.accent }}
              numberOfLines={1}
            >
              {module.title}
            </Text>
            <Text
              className="text-[13px] font-medium text-center mt-1 opacity-70"
              style={{ color: theme.accent }}
            >
              {currentSlide + 1} of {module.slides.length}
            </Text>
          </View>

          <Pressable
            onPress={() => void handleToggleAudio()}
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: isPlaying ? theme.accent : theme.card }}
          >
            {isPlaying ? (
              <VolumeX color="#FFFFFF" size={24} />
            ) : (
              <Volume2 color={theme.accent} size={24} />
            )}
          </Pressable>
        </View>

        {/* Fancy Progress Indicator */}
        <View
          className="h-1.5 rounded-full overflow-hidden mb-10"
          style={{ backgroundColor: theme.card }}
        >
          <Animated.View
            className="h-full rounded-full"
            style={{
              width: `${((currentSlide + 1) / module.slides.length) * 100}%`,
              backgroundColor: theme.accent,
            }}
          />
        </View>

        {/* Content Card with Swipe Support */}
        <View className="flex-1" {...panResponder.panHandlers}>
          <Animated.View
            className="flex-1 w-full rounded-[36px] bg-white overflow-hidden justify-center"
            style={{
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
              shadowColor: theme.accent,
              shadowOpacity: 0.12,
              shadowRadius: 30,
              shadowOffset: { width: 0, height: 16 },
              elevation: 8,
            }}
          >
            <View
              className="absolute top-0 inset-x-0 h-40 justify-end items-center pb-8"
              style={{ backgroundColor: theme.card }}
            >
              <View
                className="w-[84px] h-[84px] rounded-[30px] bg-white items-center justify-center -mb-[58px]"
                style={{
                  shadowColor: theme.accent,
                  shadowOpacity: 0.15,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 8 },
                  elevation: 5,
                  transform: [{ rotate: "10deg" }],
                }}
              >
                <ThemeIcon
                  color={theme.accent}
                  size={44}
                  strokeWidth={2.5}
                  style={{ transform: [{ rotate: "-10deg" }] }}
                />
              </View>
            </View>

            <View className="px-8 mt-[40px] mb-4 items-center">
              <Text
                className="text-[28px] leading-[42px] font-bold text-center"
                style={{ color: "#2C2C2E", letterSpacing: -0.5 }}
              >
                {slide.text}
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Beautiful Bottom Controls */}
        <View className="flex-row items-center justify-between gap-4 mt-8">
          <Pressable
            onPress={() => void goToSlide(currentSlide - 1)}
            disabled={atStart}
            className="w-[80px] h-[64px] rounded-[24px] items-center justify-center transition-opacity"
            style={{
              backgroundColor: atStart ? "transparent" : theme.card,
              opacity: atStart ? 0.3 : 1,
            }}
          >
            <ChevronLeft
              color={atStart ? theme.accent : theme.accent}
              size={32}
            />
          </Pressable>

          <Pressable
            onPress={() => {
              if (atEnd) {
                router.back();
              } else {
                void goToSlide(currentSlide + 1);
              }
            }}
            className="flex-1 h-[64px] rounded-[24px] flex-row items-center justify-center gap-3"
            style={{ backgroundColor: theme.accent }}
          >
            {atEnd ? (
              <>
                <Text className="text-[18px] font-bold text-white">
                  Complete
                </Text>
                <Check color="#FFFFFF" size={24} strokeWidth={3} />
              </>
            ) : (
              <>
                <Text className="text-[18px] font-bold text-white">Next</Text>
                <ChevronRight color="#FFFFFF" size={24} strokeWidth={3} />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
