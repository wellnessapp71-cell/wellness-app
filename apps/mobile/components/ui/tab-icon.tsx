import Svg, { Circle, Path, Rect } from "react-native-svg";

type TabIconName = "home" | "wheel" | "discover" | "profile" | "plans" | "track";

export function TabIcon({
  name,
  color,
  size,
  focused = false,
}: {
  name: TabIconName;
  color: string;
  size: number;
  focused?: boolean;
}) {
  const sw = 1.8;

  switch (name) {
    case "home":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {focused ? (
            <>
              <Path
                d="M3 10.5L12 3l9 7.5"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M5.5 9.5V20h13V9.5"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={color}
                fillOpacity={0.15}
              />
              <Path
                d="M10 20v-5h4v5"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={color}
                fillOpacity={0.4}
              />
            </>
          ) : (
            <>
              <Path
                d="M3 10.5L12 3l9 7.5"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M5.5 9.5V20h13V9.5"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M10 20v-5h4v5"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </Svg>
      );

    case "plans":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {focused ? (
            <>
              <Rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="2"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.15}
              />
              <Path
                d="M8 10h8M8 14h5"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <Rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="2"
                stroke={color}
                strokeWidth={sw}
              />
              <Path
                d="M8 10h8M8 14h5"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
              />
            </>
          )}
        </Svg>
      );

    case "track":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {focused ? (
            <>
              <Path
                d="M4 19h16"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Path
                d="M4 15l5-5 4 4 7-8"
                stroke={color}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="4" cy="15" r="1.5" fill={color} />
              <Circle cx="9" cy="10" r="1.5" fill={color} />
              <Circle cx="13" cy="14" r="1.5" fill={color} />
              <Circle cx="20" cy="6" r="1.5" fill={color} />
            </>
          ) : (
            <>
              <Path
                d="M4 19h16"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
              />
              <Path
                d="M4 15l5-5 4 4 7-8"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </Svg>
      );

    case "wheel":
    case "discover":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {focused ? (
            <>
              <Circle
                cx="12"
                cy="12"
                r="9"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.1}
              />
              <Path
                d="M9 15l2-6 6-2-2 6-6 2Z"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill={color}
                fillOpacity={0.25}
              />
              <Circle cx="12" cy="12" r="1.2" fill={color} />
            </>
          ) : (
            <>
              <Circle
                cx="12"
                cy="12"
                r="9"
                stroke={color}
                strokeWidth={sw}
              />
              <Path
                d="M9 15l2-6 6-2-2 6-6 2Z"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Circle cx="12" cy="12" r="1" fill={color} />
            </>
          )}
        </Svg>
      );

    case "profile":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {focused ? (
            <>
              <Circle
                cx="12"
                cy="8"
                r="3.5"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.2}
              />
              <Path
                d="M5.5 19c1.3-3 4.1-4.5 6.5-4.5s5.2 1.5 6.5 4.5"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              <Circle
                cx="12"
                cy="8"
                r="3.5"
                stroke={color}
                strokeWidth={sw}
              />
              <Path
                d="M5.5 19c1.3-3 4.1-4.5 6.5-4.5s5.2 1.5 6.5 4.5"
                stroke={color}
                strokeWidth={sw}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </Svg>
      );
  }
}
