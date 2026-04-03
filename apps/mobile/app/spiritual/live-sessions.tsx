import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";

const TEAL = "#30B0C7";

// ─── Example session cards (showing future UI) ─────────────────────────────

const EXAMPLE_SESSIONS = [
  {
    id: "session_1",
    title: "Morning Calm Circle",
    host: "Aura Community",
    type: "free" as const,
    date: "Every Mon & Thu",
    time: "7:00 AM",
    duration: "30 min",
    participants: 42,
    description: "Start your day with guided breathwork and a group meditation led by the community.",
    icon: "🌅",
    tags: ["meditation", "community"],
  },
  {
    id: "session_2",
    title: "Guided Meditation with Sarah",
    host: "Sarah Chen, MBSR Instructor",
    type: "premium" as const,
    date: "Every Wednesday",
    time: "6:30 PM",
    duration: "45 min",
    participants: 18,
    description: "Mindfulness-Based Stress Reduction techniques with a certified instructor.",
    icon: "🧘",
    tags: ["expert", "MBSR"],
  },
  {
    id: "session_3",
    title: "Gratitude & Reflection",
    host: "Aura Community",
    type: "free" as const,
    date: "Every Friday",
    time: "8:00 PM",
    duration: "20 min",
    participants: 31,
    description: "End your week with a guided gratitude session and shared reflections.",
    icon: "🙏",
    tags: ["gratitude", "community"],
  },
  {
    id: "session_4",
    title: "Yoga Nidra Deep Rest",
    host: "Dr. Maya Patel",
    type: "premium" as const,
    date: "Saturdays",
    time: "9:00 PM",
    duration: "60 min",
    participants: 12,
    description: "Guided body-mind relaxation for deep nervous system restoration.",
    icon: "😴",
    tags: ["expert", "sleep"],
  },
];

export default function SpiritualLiveSessionsScreen() {
  const router = useRouter();
  const [notified, setNotified] = useState(false);

  function handleNotify() {
    setNotified(true);
    Alert.alert(
      "You're on the list! 🎉",
      "We'll notify you as soon as live sessions launch. Thank you for your interest!",
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
          Live Sessions
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="pt-4 pb-10">
          {/* Hero */}
          <View className="items-center mb-6">
            <Text style={{ fontSize: 64 }}>🎯</Text>
            <Text className="text-[28px] font-bold text-black tracking-tight text-center mt-4">
              Coming Soon
            </Text>
            <Text className="text-[17px] text-[#3C3C43] text-center mt-3 leading-relaxed px-4">
              Join live community meditation, breathwork, and expert-led wellness sessions.
            </Text>
          </View>

          {/* What's coming card */}
          <GlassCard className="p-4 mb-5" style={{ backgroundColor: TEAL + "08" }}>
            <Text className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: TEAL }}>
              What's coming
            </Text>
            {[
              { icon: "🧘", text: "Free community meditation circles" },
              { icon: "🌬️", text: "Guided breathwork sessions" },
              { icon: "🙏", text: "Gratitude & reflection groups" },
              { icon: "👩‍⚕️", text: "Premium expert-led workshops" },
              { icon: "🔄", text: "Session replays & recordings" },
              { icon: "📅", text: "Calendar integration" },
            ].map((item) => (
              <View key={item.text} className="flex-row items-center gap-3 mb-2.5">
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                <Text className="text-[14px] text-[#3C3C43]">{item.text}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Notify me button */}
          <Pressable
            onPress={handleNotify}
            disabled={notified}
            className="rounded-2xl py-4 items-center mb-6"
            style={{ backgroundColor: notified ? "#34C759" : TEAL }}
          >
            <Text className="text-white text-[17px] font-semibold">
              {notified ? "✓ You'll be notified" : "🔔 Notify me when live sessions launch"}
            </Text>
          </Pressable>

          {/* ── Example Session Cards ── */}
          <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider mb-3">
            Preview: Upcoming Sessions
          </Text>

          {EXAMPLE_SESSIONS.map((session) => (
            <Pressable
              key={session.id}
              onPress={() =>
                Alert.alert("Coming Soon", "Live sessions will be available in a future update.")
              }
              className="mb-3"
            >
              <GlassCard className="p-4">
                <View className="flex-row items-start gap-3">
                  <View
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: TEAL + "15" }}
                  >
                    <Text style={{ fontSize: 24 }}>{session.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-0.5">
                      <Text className="text-[15px] font-bold text-black flex-1" numberOfLines={1}>
                        {session.title}
                      </Text>
                      {session.type === "premium" ? (
                        <View className="px-1.5 py-0.5 rounded bg-[#FFD60A]">
                          <Text className="text-[9px] font-bold text-black">PRO</Text>
                        </View>
                      ) : (
                        <View className="px-1.5 py-0.5 rounded" style={{ backgroundColor: "#34C75920" }}>
                          <Text className="text-[9px] font-bold text-[#34C759]">FREE</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-[12px] text-[#8A8A8E]">{session.host}</Text>
                    <Text className="text-[13px] text-[#3C3C43] mt-1.5" numberOfLines={2}>
                      {session.description}
                    </Text>
                    <View className="flex-row items-center gap-3 mt-2">
                      <Text className="text-[11px] text-[#8A8A8E]">📅 {session.date}</Text>
                      <Text className="text-[11px] text-[#8A8A8E]">⏰ {session.time}</Text>
                      <Text className="text-[11px] text-[#8A8A8E]">⏱️ {session.duration}</Text>
                    </View>
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[10px]">👥</Text>
                        <Text className="text-[11px] font-semibold" style={{ color: TEAL }}>
                          {session.participants} joined
                        </Text>
                      </View>
                      {session.tags.map((tag) => (
                        <View key={tag} className="px-2 py-0.5 rounded-full" style={{ backgroundColor: TEAL + "10" }}>
                          <Text className="text-[10px] font-semibold capitalize" style={{ color: TEAL }}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          ))}

          {/* Disclaimer */}
          <GlassCard className="p-3 mt-3 mb-4" style={{ backgroundColor: "#8A8A8E08" }}>
            <Text className="text-[11px] text-[#8A8A8E] text-center leading-relaxed">
              Session times and hosts shown above are examples of what's planned. Actual schedule will be announced at launch.
            </Text>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
