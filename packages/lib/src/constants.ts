/** Shared iOS-style color tokens used across web and mobile */
export const colors = {
  // Backgrounds
  background: "#F2F2F7",
  card: "#FFFFFF",
  border: "rgba(0, 0, 0, 0.04)",

  // Text
  primary: "#000000",
  secondary: "#8A8A8E",
  tertiary: "#C6C6C8",
  separator: "rgba(60, 60, 67, 0.05)",

  // Accents
  blue: "#007AFF",
  red: "#FF2D55",
  green: "#34C759",
  orange: "#FF9500",
  purple: "#AF52DE",
  destructive: "#FF3B30",
  gray: "#8E8E93",

  // Surfaces
  groupedBackground: "#E5E5EA",
  deviceFrame: "#1C1C1E",
} as const;

/** Shared mock data for development */
export const TASKS = [
  { id: 1, title: "Morning Grounding", duration: "5 min", type: "Spiritual" as const, color: colors.purple, done: true },
  { id: 2, title: "Deep Work Flow", duration: "90 min", type: "Mental" as const, color: colors.blue, done: false },
  { id: 3, title: "Desk Yoga Routine", duration: "10 min", type: "Physical" as const, color: colors.green, done: false },
  { id: 4, title: "Sleep Wind-down", duration: "15 min", type: "Lifestyle" as const, color: colors.orange, done: false },
];

export const WELLNESS_SCORES = [
  { subject: "Physical", value: 75, fullMark: 100 },
  { subject: "Lifestyle", value: 90, fullMark: 100 },
  { subject: "Spiritual", value: 85, fullMark: 100 },
  { subject: "Mental", value: 60, fullMark: 100 },
];

export const USER_PROFILE = {
  name: "Alex Rivera",
  company: "ACME Corp",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
  streak: 12,
  coins: 450,
};
