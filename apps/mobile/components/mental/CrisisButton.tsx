import { View, Text, Pressable, Linking, Alert } from "react-native";

interface CrisisButtonProps {
  onBook?: () => void;
}

const CRISIS_HOTLINES = [
  { label: "988 Suicide & Crisis Lifeline (US)", number: "988" },
  { label: "Crisis Text Line (US)", number: "text HOME to 741741" },
  { label: "Vandrevala Foundation (IN)", number: "1860-2662-345" },
];

export function CrisisButton({ onBook }: CrisisButtonProps) {
  const handlePress = () => {
    Alert.alert(
      "Immediate Support",
      "If you are in crisis or need help right now, please reach out.",
      [
        {
          text: "Call 988 (US)",
          onPress: () => Linking.openURL("tel:988"),
        },
        ...(onBook
          ? [
              {
                text: "Book In-App Support",
                onPress: onBook,
              },
            ]
          : []),
        { text: "Cancel", style: "cancel" as const },
      ],
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      className="mx-0"
    >
      <View
        className="flex-row items-center gap-2.5 rounded-2xl px-4 py-3"
        style={{
          backgroundColor: "#FF3B3010",
          borderWidth: 1.5,
          borderColor: "#FF3B3030",
        }}
      >
        <Text style={{ fontSize: 18 }}>🆘</Text>
        <View className="flex-1">
          <Text className="text-[14px] font-bold text-[#FF3B30]">
            Need help now?
          </Text>
          <Text className="text-[12px] text-[#8A8A8E]">
            Tap for crisis hotline or in-app support
          </Text>
        </View>
        <Text className="text-[#FF3B30] text-[18px]">›</Text>
      </View>
    </Pressable>
  );
}
