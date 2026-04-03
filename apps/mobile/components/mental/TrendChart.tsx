import { View, Text } from "react-native";
import Svg, { Polyline, Line, Circle, Rect, Text as SvgText } from "react-native-svg";

interface TrendChartProps {
  /** Array of numeric values (7 or 30) */
  data: number[];
  /** Chart label */
  label: string;
  /** Line/accent color */
  color: string;
  /** Unit suffix (e.g. "/10", "h", "%") */
  unit?: string;
  /** Whether lower is better (e.g. stress) — inverts the good/bad coloring */
  invertGood?: boolean;
  /** Height of the SVG chart area */
  height?: number;
  /** Show as bar chart instead of line */
  barChart?: boolean;
}

const DAY_LABELS_7 = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function TrendChart({
  data,
  label,
  color,
  unit = "",
  invertGood = false,
  height = 120,
  barChart = false,
}: TrendChartProps) {
  const width = 320; // fixed SVG width, will stretch to container
  const padding = { top: 10, bottom: 24, left: 8, right: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const safeData = data.length > 0 ? data : [0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;

  // Compute latest value and trend
  const latest = safeData[safeData.length - 1];
  const prev = safeData.length > 1 ? safeData[safeData.length - 2] : latest;
  const delta = latest - prev;
  const trendUp = delta > 0;
  const trendIsGood = invertGood ? !trendUp : trendUp;

  function yForVal(v: number): number {
    return padding.top + chartH - ((v - min) / range) * chartH;
  }

  function xForIdx(i: number): number {
    const spacing = safeData.length > 1 ? chartW / (safeData.length - 1) : chartW / 2;
    return padding.left + i * spacing;
  }

  // Build polyline points
  const points = safeData
    .map((v, i) => `${xForIdx(i)},${yForVal(v)}`)
    .join(" ");

  // Day labels (show only for 7-day data)
  const showDayLabels = safeData.length === 7;

  return (
    <View className="mb-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-[15px] font-bold text-black tracking-tight">{label}</Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="text-[15px] font-bold" style={{ color }}>
            {latest > 0 ? latest.toFixed(latest % 1 === 0 ? 0 : 1) : "—"}
            {unit}
          </Text>
          {delta !== 0 && (
            <Text
              className="text-[12px] font-semibold"
              style={{ color: trendIsGood ? "#34C759" : "#FF3B30" }}
            >
              {trendUp ? "↑" : "↓"}{Math.abs(delta).toFixed(1)}
            </Text>
          )}
        </View>
      </View>

      {/* SVG Chart */}
      <View
        className="bg-white rounded-2xl overflow-hidden border border-black/5"
        style={{ height }}
      >
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((frac) => (
            <Line
              key={frac}
              x1={padding.left}
              y1={padding.top + chartH * (1 - frac)}
              x2={width - padding.right}
              y2={padding.top + chartH * (1 - frac)}
              stroke="#E5E5EA"
              strokeWidth={0.5}
              strokeDasharray="4 4"
            />
          ))}

          {barChart ? (
            // Bar chart
            safeData.map((v, i) => {
              const barW = Math.max(4, chartW / safeData.length - 4);
              const barH = ((v - min) / range) * chartH;
              const x = padding.left + (chartW / safeData.length) * i + 2;
              const y = padding.top + chartH - barH;
              return (
                <Rect
                  key={i}
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(1, barH)}
                  rx={3}
                  fill={v > 0 ? color + "80" : "#E5E5EA"}
                />
              );
            })
          ) : (
            <>
              {/* Filled line chart */}
              <Polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {safeData.map((v, i) =>
                v > 0 ? (
                  <Circle
                    key={i}
                    cx={xForIdx(i)}
                    cy={yForVal(v)}
                    r={3}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={1.5}
                  />
                ) : null
              )}
            </>
          )}

          {/* Day labels for 7-day view */}
          {showDayLabels &&
            DAY_LABELS_7.map((dayLabel, i) => (
              <SvgText
                key={i}
                x={xForIdx(i)}
                y={height - 4}
                fontSize={9}
                fill="#C6C6C8"
                fontWeight="600"
                textAnchor="middle"
              >
                {dayLabel}
              </SvgText>
            ))}
        </Svg>
      </View>
    </View>
  );
}

// ─── Sparkline (small inline trend) ─────────────────────────────────────────

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color, width = 60, height = 24 }: SparklineProps) {
  const safeData = data.length > 0 ? data : [0];
  const max = Math.max(...safeData, 1);
  const min = Math.min(...safeData, 0);
  const range = max - min || 1;

  const points = safeData
    .map((v, i) => {
      const x = (i / (safeData.length - 1 || 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
