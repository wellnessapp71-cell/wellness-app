import { View, Text, Pressable, Alert } from "react-native";
import { GlassCard } from "@/components/ui/glass-card";
import type { CommunityPost } from "@aura/types";

interface CommunityPostCardProps {
  post: CommunityPost;
  onReport: (postId: string) => void;
  onBlock: (authorId: string) => void;
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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommunityPostCard({ post, onReport, onBlock }: CommunityPostCardProps) {
  const handleReport = () => {
    Alert.alert(
      "Report Post",
      "Are you sure you want to report this post? Posts with 3+ reports are automatically hidden.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: () => onReport(post.postId),
        },
      ],
    );
  };

  const handleBlock = () => {
    Alert.alert(
      "Block User",
      "You will no longer see posts from this user. This can be undone in settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => onBlock(post.authorId),
        },
      ],
    );
  };

  return (
    <GlassCard className="p-4 mb-3">
      {/* Author row */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-[#AF52DE15] items-center justify-center">
            <Text style={{ fontSize: 14 }}>{post.isAnonymous ? "🎭" : "👤"}</Text>
          </View>
          <View>
            <Text className="text-[14px] font-semibold text-black">
              {post.displayName}
            </Text>
            <Text className="text-[11px] text-[#C6C6C8]">{timeAgo(post.createdAtIso)}</Text>
          </View>
        </View>
        {post.isAnonymous && (
          <View className="px-2 py-0.5 rounded-full bg-[#AF52DE10]">
            <Text className="text-[10px] font-semibold text-[#AF52DE]">Anonymous</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text className="text-[15px] text-[#3C3C43] leading-relaxed mb-3">
        {post.content}
      </Text>

      {/* Actions */}
      <View className="flex-row items-center gap-4 pt-1 border-t border-black/5">
        <Pressable onPress={handleReport} className="flex-row items-center gap-1 py-2">
          <Text style={{ fontSize: 12 }}>⚠️</Text>
          <Text className="text-[12px] text-[#8A8A8E] font-medium">Report</Text>
        </Pressable>
        {!post.isAnonymous && (
          <Pressable onPress={handleBlock} className="flex-row items-center gap-1 py-2">
            <Text style={{ fontSize: 12 }}>🚫</Text>
            <Text className="text-[12px] text-[#8A8A8E] font-medium">Block</Text>
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}
