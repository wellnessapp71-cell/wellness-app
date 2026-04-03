import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Switch,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import { GlassCard } from "@/components/ui/glass-card";
import { CrisisButton } from "@/components/mental/CrisisButton";
import {
  getChatRooms,
  searchChatRooms,
  saveChatRoom,
} from "@/lib/mental-store";
import { getAuth } from "@/lib/user-store";
import type { ChatRoom, ChatRoomVisibility } from "@aura/types";

// ─── Default rooms (seeded on first launch) ─────────────────────────────────

const DEFAULT_ROOMS: Omit<ChatRoom, "createdBy" | "createdByName">[] = [
  {
    roomId: "room_general",
    name: "General Wellness",
    description: "Open discussion about mental health and wellbeing",
    keywords: ["general", "wellness", "mental health", "support"],
    icon: "💬",
    visibility: "public",
    createdAtIso: new Date(Date.now() - 30 * 86400000).toISOString(),
    memberCount: 24,
    invitedUserIds: [],
    lastActivityIso: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    roomId: "room_stress",
    name: "Stress & Anxiety",
    description: "Managing daily stress, anxiety, and panic",
    keywords: ["stress", "anxiety", "panic", "worry", "overwhelmed"],
    icon: "🌊",
    visibility: "public",
    createdAtIso: new Date(Date.now() - 25 * 86400000).toISOString(),
    memberCount: 18,
    invitedUserIds: [],
    lastActivityIso: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    roomId: "room_sleep",
    name: "Sleep Support",
    description: "Insomnia, sleep hygiene, and better rest",
    keywords: ["sleep", "insomnia", "rest", "tired", "fatigue"],
    icon: "😴",
    visibility: "public",
    createdAtIso: new Date(Date.now() - 20 * 86400000).toISOString(),
    memberCount: 15,
    invitedUserIds: [],
    lastActivityIso: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    roomId: "room_relationships",
    name: "Relationships",
    description: "Navigating connections and boundaries",
    keywords: ["relationships", "boundaries", "family", "friends", "love"],
    icon: "❤️",
    visibility: "public",
    createdAtIso: new Date(Date.now() - 18 * 86400000).toISOString(),
    memberCount: 12,
    invitedUserIds: [],
    lastActivityIso: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    roomId: "room_work",
    name: "Workplace Challenges",
    description: "Work stress, burnout, and career anxiety",
    keywords: ["work", "burnout", "career", "job", "boss", "deadline"],
    icon: "💼",
    visibility: "public",
    createdAtIso: new Date(Date.now() - 15 * 86400000).toISOString(),
    memberCount: 10,
    invitedUserIds: [],
    lastActivityIso: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    roomId: "room_recovery",
    name: "Recovery & Healing",
    description: "Healing journeys, grief, and resilience",
    keywords: ["recovery", "healing", "grief", "loss", "resilience", "trauma"],
    icon: "🌱",
    visibility: "public",
    createdAtIso: new Date(Date.now() - 10 * 86400000).toISOString(),
    memberCount: 8,
    invitedUserIds: [],
    lastActivityIso: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function CommunityScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 48, 520);
  const modalContentWidth = Math.min(contentWidth, 420);
  const twoColButtonWidth = Math.floor((modalContentWidth - 12) / 2);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [userId, setUserId] = useState("local");
  const [userName, setUserName] = useState("You");

  // Create room form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newVisibility, setNewVisibility] =
    useState<ChatRoomVisibility>("public");
  const [creating, setCreating] = useState(false);

  const loadRooms = useCallback(async () => {
    const auth = await getAuth();
    const uid = auth?.userId ?? "local";
    const uname = auth?.name ?? auth?.username ?? "You";
    setUserId(uid);
    setUserName(uname);

    let stored = await getChatRooms();
    // Seed default rooms on first use
    if (stored.length === 0) {
      for (const def of DEFAULT_ROOMS) {
        await saveChatRoom({
          ...def,
          createdBy: "system",
          createdByName: "Aura",
        });
      }
      stored = await getChatRooms();
    }
    setRooms(stored);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms]),
  );

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      const all = await getChatRooms();
      setRooms(all);
      return;
    }
    const results = await searchChatRooms(q, userId);
    setRooms(results);
  };

  const handleCreateRoom = async () => {
    if (!newName.trim()) return;
    setCreating(true);

    const keywords = newKeywords
      .split(",")
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const room: ChatRoom = {
      roomId: `room_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: newName.trim(),
      description: newDesc.trim() || `Chat about ${newName.trim()}`,
      keywords: keywords.length > 0 ? keywords : [newName.trim().toLowerCase()],
      icon: newVisibility === "private" ? "🔒" : "💬",
      visibility: newVisibility,
      createdBy: userId,
      createdByName: userName,
      createdAtIso: new Date().toISOString(),
      memberCount: 1,
      invitedUserIds: newVisibility === "private" ? [userId] : [],
      lastActivityIso: new Date().toISOString(),
    };

    await saveChatRoom(room);
    setNewName("");
    setNewDesc("");
    setNewKeywords("");
    setNewVisibility("public");
    setShowCreate(false);
    setCreating(false);
    await loadRooms();

    // Navigate into the new room
    router.push(`/mental/chatroom?roomId=${room.roomId}`);
  };

  const noResults = searchQuery.trim() && rooms.length === 0;

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
        <View className="flex-1">
          <Text className="text-[20px] font-bold text-black tracking-tight">
            Community
          </Text>
          <Text className="text-[12px] text-[#8A8A8E]">
            Chat forums & support rooms
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Crisis button */}
        <View className="px-6 pt-3 mb-3">
          <CrisisButton onBook={() => router.push("/mental/booking")} />
        </View>

        {/* Search */}
        <View className="px-6 mb-4">
          <View
            className="flex-row items-center bg-white rounded-xl px-4 py-3"
            style={{ borderWidth: 1, borderColor: "#E5E5EA" }}
          >
            <Text className="text-[16px] mr-2">🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={handleSearch}
              placeholder="Search rooms by keyword..."
              placeholderTextColor="#C6C6C8"
              className="flex-1 text-[15px] text-black"
              returnKeyType="search"
            />
            {searchQuery ? (
              <Pressable onPress={() => handleSearch("")}>
                <Text className="text-[14px] text-[#8A8A8E]">✕</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* No results — offer to create */}
        {noResults ? (
          <View className="px-6 items-center py-10">
            <Text style={{ fontSize: 40 }}>🔎</Text>
            <Text className="text-[17px] font-bold text-black mt-3">
              No rooms found for "{searchQuery}"
            </Text>
            <Text className="text-[14px] text-[#8A8A8E] mt-1 text-center mb-5">
              Create a new room and start the conversation.
            </Text>
            <Pressable
              onPress={() => {
                setNewName(searchQuery.trim());
                setNewKeywords(searchQuery.trim().toLowerCase());
                setShowCreate(true);
              }}
              className="rounded-xl py-3 px-8"
              style={{ backgroundColor: "#AF52DE" }}
            >
              <Text className="text-white text-[15px] font-semibold">
                Create "{searchQuery}" Room
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Room list */}
            <View className="px-6 mb-2">
              <Text className="text-[13px] font-semibold text-[#8A8A8E] uppercase tracking-wider">
                {searchQuery
                  ? `Results (${rooms.length})`
                  : `All Rooms (${rooms.length})`}
              </Text>
            </View>
            <View className="px-6 pb-24">
              {rooms.map((room) => (
                <ChatRoomCard
                  key={room.roomId}
                  room={room}
                  currentUserId={userId}
                  onPress={() =>
                    router.push(`/mental/chatroom?roomId=${room.roomId}`)
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB — Create Room */}
      <Pressable
        onPress={() => setShowCreate(true)}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-[#AF52DE] items-center justify-center shadow-lg"
        style={{ elevation: 8 }}
      >
        <Text className="text-white text-[28px] font-light">+</Text>
      </Pressable>

      {/* Create Room Modal */}
      <Modal visible={showCreate} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View
            className="bg-[#F2F2F7] rounded-t-3xl p-6 pt-4"
            style={{ maxHeight: "85%" }}
          >
            <View className="w-10 h-1 rounded-full bg-[#D1D1D6] self-center mb-4" />
            <Text className="text-[20px] font-bold text-black mb-5">
              Create Chat Room
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text className="text-[13px] text-[#8A8A8E] font-medium mb-1.5">
                Room Name *
              </Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Exam Stress, New Parents..."
                placeholderTextColor="#C6C6C8"
                className="bg-white rounded-xl px-4 py-3 text-[15px] text-black mb-4"
                style={{ borderWidth: 1, borderColor: "#E5E5EA" }}
              />

              {/* Description */}
              <Text className="text-[13px] text-[#8A8A8E] font-medium mb-1.5">
                Description
              </Text>
              <TextInput
                value={newDesc}
                onChangeText={setNewDesc}
                placeholder="What's this room about?"
                placeholderTextColor="#C6C6C8"
                multiline
                className="bg-white rounded-xl px-4 py-3 text-[15px] text-black mb-4"
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E5EA",
                  minHeight: 70,
                }}
                textAlignVertical="top"
              />

              {/* Keywords */}
              <Text className="text-[13px] text-[#8A8A8E] font-medium mb-1.5">
                Keywords (comma-separated)
              </Text>
              <TextInput
                value={newKeywords}
                onChangeText={setNewKeywords}
                placeholder="stress, exam, college..."
                placeholderTextColor="#C6C6C8"
                className="bg-white rounded-xl px-4 py-3 text-[15px] text-black mb-4"
                style={{ borderWidth: 1, borderColor: "#E5E5EA" }}
              />

              {/* Visibility */}
              <GlassCard className="p-4 mb-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text style={{ fontSize: 18 }}>
                      {newVisibility === "private" ? "🔒" : "🌐"}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-[14px] font-semibold text-black">
                        {newVisibility === "private"
                          ? "Private Room"
                          : "Public Room"}
                      </Text>
                      <Text className="text-[11px] text-[#8A8A8E]">
                        {newVisibility === "private"
                          ? "Only invited members can see & post"
                          : "Anyone can find and join this room"}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={newVisibility === "private"}
                    onValueChange={(v) =>
                      setNewVisibility(v ? "private" : "public")
                    }
                    trackColor={{ false: "#E5E5EA", true: "#AF52DE80" }}
                    thumbColor={
                      newVisibility === "private" ? "#AF52DE" : "#fff"
                    }
                  />
                </View>
              </GlassCard>

              {/* Actions */}
              <View
                className="flex-row justify-between mb-4"
                style={{
                  maxWidth: modalContentWidth,
                  width: "100%",
                  alignSelf: "center",
                }}
              >
                <View style={{ width: twoColButtonWidth }}>
                  <Pressable
                    onPress={() => {
                      setShowCreate(false);
                      setNewName("");
                      setNewDesc("");
                      setNewKeywords("");
                      setNewVisibility("public");
                    }}
                    className="rounded-xl py-3.5 items-center bg-[#E5E5EA]"
                  >
                    <Text className="text-[15px] font-semibold text-[#3C3C43]">
                      Cancel
                    </Text>
                  </Pressable>
                </View>
                <View style={{ width: twoColButtonWidth }}>
                  <Pressable
                    onPress={handleCreateRoom}
                    disabled={creating || !newName.trim()}
                    className="rounded-xl py-3.5 items-center"
                    style={{
                      backgroundColor:
                        creating || !newName.trim() ? "#C6C6C8" : "#AF52DE",
                    }}
                  >
                    <Text className="text-white text-[15px] font-semibold">
                      {creating ? "Creating..." : "Create Room"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Room Card ──────────────────────────────────────────────────────────────

function ChatRoomCard({
  room,
  currentUserId,
  onPress,
}: {
  room: ChatRoom;
  currentUserId: string;
  onPress: () => void;
}) {
  const isOwner = room.createdBy === currentUserId;
  const isPrivate = room.visibility === "private";

  return (
    <Pressable onPress={onPress}>
      <GlassCard className="p-4 mb-3">
        <View className="flex-row items-start gap-3">
          {/* Icon */}
          <View
            className="w-11 h-11 rounded-xl items-center justify-center"
            style={{ backgroundColor: isPrivate ? "#AF52DE15" : "#F0F0F5" }}
          >
            <Text style={{ fontSize: 22 }}>{room.icon}</Text>
          </View>

          {/* Info */}
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-[16px] font-bold text-black flex-shrink"
                numberOfLines={1}
              >
                {room.name}
              </Text>
              {isPrivate && (
                <View className="px-1.5 py-0.5 rounded bg-[#AF52DE15]">
                  <Text className="text-[10px] font-semibold text-[#AF52DE]">
                    Private
                  </Text>
                </View>
              )}
              {isOwner && (
                <View className="px-1.5 py-0.5 rounded bg-[#34C75915]">
                  <Text className="text-[10px] font-semibold text-[#34C759]">
                    Owner
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-[13px] text-[#8A8A8E] mt-0.5"
              numberOfLines={1}
            >
              {room.description}
            </Text>

            {/* Keywords */}
            <View className="flex-row flex-wrap gap-1 mt-2">
              {room.keywords.slice(0, 4).map((kw) => (
                <View
                  key={kw}
                  className="px-2 py-0.5 rounded-full bg-[#E5E5EA]"
                >
                  <Text className="text-[10px] text-[#636366]">{kw}</Text>
                </View>
              ))}
              {room.keywords.length > 4 && (
                <Text className="text-[10px] text-[#8A8A8E] self-center">
                  +{room.keywords.length - 4}
                </Text>
              )}
            </View>
          </View>

          {/* Chevron */}
          <Text className="text-[18px] text-[#C6C6C8] self-center">›</Text>
        </View>

        {/* Footer */}
        <View className="flex-row items-center gap-4 mt-3 pt-2 border-t border-black/5">
          <Text className="text-[11px] text-[#8A8A8E]">
            {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
          </Text>
          <Text className="text-[11px] text-[#8A8A8E]">
            by {room.createdByName}
          </Text>
          <Text className="text-[11px] text-[#C6C6C8] ml-auto">
            {timeAgo(room.lastActivityIso)}
          </Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
