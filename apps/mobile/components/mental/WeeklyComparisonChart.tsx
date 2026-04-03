import { View, Text } from "react-native";
import Svg, { Rect, Text as SvgText, Line } from "react-native-svg";
import { GlassCard } from "@/components/ui/glass-card";

interface ComparisonField {
  label: string;
  baseline: number;
  current: number;
  /** If true, lower is better (e.g. stress) */
  invertGood?: boolean;
}

interface WeeklyComparisonChartProps {
  fields: ComparisonField[];
  title?: string;
}

export function WeeklyComparisonChart({
  fields,
  title = "Baseline vs This Week",
}: WeeklyComparisonChartProps) {
  const width = 320;
  const rowHeight = 48;
  const height = rowHeight * fields.length + 40;
  const barAreaLeft = 100;
  const barAreaRight = width - 16;
  const barAreaWidth = barAreaRight - barAreaLeft;

  const maxVal = Math.max(
    ...fields.map((f) => Math.max(f.baseline, f.current)),
    10,
  );

  function barWidth(val: number): number {
    return Math.max(4, (val / maxVal) * barAreaWidth);
  }

  return (
    <GlassCard className="p-4 mb-4">
      <Text className="text-[15px] font-bold text-black tracking-tight mb-3">{title}</Text>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Legend */}
        <Rect x={barAreaLeft} y={4} width={12} height={8} rx={2} fill="#E5E5EA" />
        <SvgText x={barAreaLeft + 16} y={12} fontSize={10} fill="#8A8A8E" fontWeight="600">
          Baseline
        </SvgText>
        <Rect x={barAreaLeft + 80} y={4} width={12} height={8} rx={2} fill="#AF52DE" />
        <SvgText x={barAreaLeft + 96} y={12} fontSize={10} fill="#8A8A8E" fontWeight="600">
          This Week
        </SvgText>

        {fields.map((field, i) => {
          const y = 28 + i * rowHeight;
          const diff = field.current - field.baseline;
          const improved = field.invertGood ? diff < 0 : diff > 0;
          const diffColor = improved ? "#34C759" : diff === 0 ? "#8A8A8E" : "#FF3B30";

          return (
            <View key={field.label}>
              {/* Field label */}
              <SvgText x={4} y={y + 14} fontSize={12} fill="#3C3C43" fontWeight="600">
                {field.label}
              </SvgText>

              {/* Baseline bar */}
              <Rect
                x={barAreaLeft}
                y={y + 2}
                width={barWidth(field.baseline)}
                height={10}
                rx={3}
                fill="#E5E5EA"
              />
              <SvgText
                x={barAreaLeft + barWidth(field.baseline) + 4}
                y={y + 11}
                fontSize={9}
                fill="#C6C6C8"
                fontWeight="600"
              >
                {field.baseline.toFixed(1)}
              </SvgText>

              {/* Current bar */}
              <Rect
                x={barAreaLeft}
                y={y + 16}
                width={barWidth(field.current)}
                height={10}
                rx={3}
                fill="#AF52DE"
              />
              <SvgText
                x={barAreaLeft + barWidth(field.current) + 4}
                y={y + 25}
                fontSize={9}
                fill="#AF52DE"
                fontWeight="700"
              >
                {field.current.toFixed(1)}
              </SvgText>

              {/* Change indicator */}
              <SvgText
                x={4}
                y={y + 30}
                fontSize={10}
                fill={diffColor}
                fontWeight="600"
              >
                {diff > 0 ? "+" : ""}{diff.toFixed(1)} {improved ? "✓" : diff === 0 ? "—" : "⚠"}
              </SvgText>

              {/* Separator */}
              {i < fields.length - 1 && (
                <Line
                  x1={4}
                  y1={y + rowHeight - 6}
                  x2={width - 4}
                  y2={y + rowHeight - 6}
                  stroke="#F2F2F7"
                  strokeWidth={1}
                />
              )}
            </View>
          );
        })}
      </Svg>
    </GlassCard>
  );
}
