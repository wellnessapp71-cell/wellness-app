import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";
import { GlassCard } from "@/components/ui/glass-card";
import { CommunityPostCard } from "@/components/mental/CommunityPostCard";
import {
  getChatRoom,
  getCommunityPosts,
  saveCommunityPost,
  reportPost,
  blockUser,
  deleteChatRoom,
  inviteToRoom,
} from "@/lib/mental-store";
import { getAuth } from "@/lib/user-store";
import type { ChatRoom, CommunityPost } from "@aura/types";

export default function ChatRoomScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [posting, setPosting] = useState(false);
  const [userId, setUserId] = useState("local");
  const [userName, setUserName] = useState("You");
  const [showInfo, setShowInfo] = useState(false);
  const [inviteId, setInviteId] = useState("");

  const loadRoom = useCallback(async () => {
    if (!roomId) return;
    const auth = await getAuth();
    setUserId(auth?.userId ?? "local");
    setUserName(auth?.name ?? auth?.username ?? "You");

    const r = await getChatRoom(roomId);
    setRoom(r);

    const p = await getCommunityPosts(roomId);
    setPosts(p.sort((a, b) => new Date(a.createdAtIso).getTime() - new Date(b.createdAtIso).getTime()));
  }, [roomId]);

  useFocusEffect(
    useCallback(() => {
      loadRoom();
    }, [loadRoom]),
  );

  const handlePost = async () => {
    if (!newPostText.trim() || !room) return;
    setPosting(true);

    const post: CommunityPost = {
      postId: `cp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      roomId: room.roomId,
      authorId: userId,
      isAnonymous,
      displayName: isAnonymous ? "Anonymous" : userName,
      content: newPostText.trim(),
      createdAtIso: new Date().toISOString(),
      reportCount: 0,
      isHidden: false,
    };

    await saveCommunityPost(post);
    setNewPostText("");
    setPosting(false);
    await loadRoom();

    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleReport = async (postId: string) => {
    await reportPost(postId);
    await loadRoom();
  };

  const handleBlock = async (authorId: string) => {
    await blockUser(authorId);
    await loadRoom();
  };

  const handleDeleteRoom = () => {
    Alert.alert(
      "Delete Room",
      "This will permanently delete this room and all its posts. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteChatRoom(roomId!);
            router.back();
          },
        },
      ],
    );
  };

  const handleInvite = async () => {
    if (!inviteId.trim()) return;
    await inviteToRoom(roomId!, [inviteId.trim()]);
    setInviteId("");
    Alert.alert("Invited", "User has been invited to this room.");
    await loadRoom();
  };

  const handleShareRoom = async () => {
    if (!room) return;
    await Share.share({
      message: `Join my chat room "${room.name}" on Aura Wellness! Room ID: ${room.roomId}`,
    });
  };

  if (!room) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2F2F7] items-center justify-center">
        <Text className="text-[#8A8A8E]">Loading room...</Text>
      </SafeAreaView>
    );
  }

  const isOwner = room.createdBy === userId;
  const isPrivate = room.visibility === "private";

  return (
    <SafeAreaView className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View className="px-6 pt-4 pb-3 flex-row items-center gap-3 border-b border-black/5">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[18px]">‹</Text>
        </Pressable>
        <Pressable onPress={() => setShowInfo(!showInfo)} className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text style={{ fontSize: 18 }}>{room.icon}</Text>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[17px] font-bold text-black" numberOfLines={1}>
                  {room.name}
                </Text>
                {isPrivate && <Text className="text-[12px]">🔒</Text>}
              </View>
              <Text className="text-[11px] text-[#8A8A8E]">
                {posts.length} post{posts.length !== 1 ? "s" : ""} · {room.memberCount} member{room.memberCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </Pressable>
        <Pressable
          onPress={() => setShowInfo(!showInfo)}
          className="w-9 h-9 rounded-full bg-white items-center justify-center"
        >
          <Text className="text-[16px]">ℹ️</Text>
        </Pressable>
      </View>

      {/* Room Info Panel (expandable) */}
      {showInfo && (
        <View className="px-6 py-4 bg-white border-b border-black/5">
          <Text className="text-[13px] text-[#3C3C43] mb-2">{room.description}</Text>

          {/* Keywords */}
          <View className="flex-row flex-wrap gap-1 mb-3">
            {room.keywords.map((kw) => (
              <View key={kw} className="px-2 py-0.5 rounded-full bg-[#AF52DE10]">
                <Text className="text-[11px] text-[#AF52DE] font-medium">{kw}</Text>
              </View>
            ))}
          </View>

          <Text className="text-[11px] text-[#8A8A8E] mb-3">
            Created by {room.createdByName} · {room.visibility === "private" ? "Private (invite only)" : "Public"}
          </Text>

          {/* Actions */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={handleShareRoom}
              className="flex-row items-center gap-1 px-3 py-2 rounded-lg bg-[#E5E5EA]"
            >
              <Text className="text-[12px]">📤</Text>
              <Text className="text-[12px] font-semibold text-[#3C3C43]">Share</Text>
            </Pressable>

            {isPrivate && isOwner && (
              <View className="flex-row items-center gap-2 flex-1">
                <TextInput
                  value={inviteId}
                  onChangeText={setInviteId}
                  placeholder="User ID to invite"
                  placeholderTextColor="#C6C6C8"
                  className="flex-1 text-[12px] text-black bg-[#F2F2F7] rounded-lg px-3 py-2"
                />
                <Pressable
                  onPress={handleInvite}
                  className="px-3 py-2 rounded-lg bg-[#AF52DE]"
                >
                  <Text className="text-white text-[12px] font-semibold">Invite</Text>
                </Pressable>
              </View>
            )}

            {isOwner && (
              <Pressable
                onPress={handleDeleteRoom}
                className="flex-row items-center gap-1 px-3 py-2 rounded-lg bg-[#FF3B3015]"
              >
                <Text className="text-[12px]">🗑️</Text>
                <Text className="text-[12px] font-semibold text-[#FF3B30]">Delete</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Posts */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: false })
          }
        >
          {posts.length === 0 ? (
            <View className="items-center py-16">
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text className="text-[17px] font-bold text-black mt-3">No posts yet</Text>
              <Text className="text-[14px] text-[#8A8A8E] mt-1 text-center">
                Be the first to start the conversation in {room.name}.
              </Text>
            </View>
          ) : (
            posts.map((post) => (
              <CommunityPostCard
                key={post.postId}
                post={post}
                onReport={handleReport}
                onBlock={handleBlock}
              />
            ))
          )}
          <View className="h-4" />
        </ScrollView>

        {/* Compose Bar */}
        <View className="px-4 py-3 bg-white border-t border-black/5">
          {/* Anonymous toggle row */}
          <View className="flex-row items-center gap-2 mb-2">
            <Pressable
              onPress={() => setIsAnonymous(!isAnonymous)}
              className="flex-row items-center gap-1 px-2 py-1 rounded-full"
              style={{
                backgroundColor: isAnonymous ? "#AF52DE15" : "#E5E5EA",
              }}
            >
              <Text style={{ fontSize: 12 }}>{isAnonymous ? "🎭" : "👤"}</Text>
              <Text
                className="text-[11px] font-semibold"
                style={{ color: isAnonymous ? "#AF52DE" : "#8A8A8E" }}
              >
                {isAnonymous ? "Anonymous" : userName}
              </Text>
            </Pressable>
            <Text className="text-[10px] text-[#C6C6C8]">
              Tap to toggle
            </Text>
          </View>

          {/* Input + Send */}
          <View className="flex-row items-end gap-2">
            <TextInput
              value={newPostText}
              onChangeText={setNewPostText}
              placeholder="Write a message..."
              placeholderTextColor="#C6C6C8"
              multiline
              className="flex-1 bg-[#F2F2F7] rounded-2xl px-4 py-2.5 text-[15px] text-black"
              style={{ maxHeight: 100 }}
            />
            <Pressable
              onPress={handlePost}
              disabled={posting || !newPostText.trim()}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{
                backgroundColor:
                  posting || !newPostText.trim() ? "#E5E5EA" : "#AF52DE",
              }}
            >
              <Text
                className="text-[18px]"
                style={{
                  color: posting || !newPostText.trim() ? "#C6C6C8" : "#fff",
                }}
              >
                ↑
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
