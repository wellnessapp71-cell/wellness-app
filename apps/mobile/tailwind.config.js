/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: "#F2F2F7",
          card: "#FFFFFF",
          blue: "#007AFF",
          red: "#FF2D55",
          green: "#34C759",
          orange: "#FF9500",
          purple: "#AF52DE",
          destructive: "#FF3B30",
          gray: "#8E8E93",
          secondary: "#8A8A8E",
          tertiary: "#C6C6C8",
          separator: "#E5E5EA",
        },
      },
    },
  },
  plugins: [],
};
