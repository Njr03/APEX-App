import { Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { colors, fonts } from '@/constants/theme';
import {
  buildLineSegments,
  buildAreaPath,
  buildVolumeChartPoints,
  formatVolumeAxisLabel,
  volumeChartBounds,
  VOLUME_CHART_VIEWBOX,
  VOLUME_GRID_LEVELS,
  volumeChartY,
} from '@/lib/progress/chartGeometry';
import type { SplitVolumeTrendData } from '@/lib/progress/splitVolumeTrend';

const CARD_BG = '#141427';
const CARD_BORDER = 'rgba(255,255,255,0.06)';
const DOT_STROKE = '#0d0d1b';

const SERIES = [
  { key: 'upperA' as const, label: 'Upper A', color: '#ff8c42', gradientId: 'gradA' },
  { key: 'upperB' as const, label: 'Upper B', color: '#38d9f5', gradientId: 'gradB' },
  { key: 'legs' as const, label: 'Legs', color: '#b06bff', gradientId: 'gradL' },
];

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center" style={{ gap: 6 }}>
      <View
        style={{
          backgroundColor: color,
          borderRadius: 999,
          height: 8,
          width: 8,
        }}
      />
      <Text
        style={{
          color: colors.muted,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 10,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function SplitVolumeTrendChart({ data }: { data: SplitVolumeTrendData }) {
  const { chartBottom } = volumeChartBounds();
  const weekCount = data.labels.length;

  return (
    <View
      style={{
        backgroundColor: CARD_BG,
        borderColor: CARD_BORDER,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        padding: 16,
      }}
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text
          style={{
            color: colors.text,
            fontFamily: fonts.display,
            fontSize: 15,
          }}
        >
          Volume Trend
        </Text>
        <View className="flex-row flex-wrap justify-end" style={{ gap: 10 }}>
          {SERIES.map((series) => (
            <LegendChip key={series.key} color={series.color} label={series.label} />
          ))}
        </View>
      </View>

      <Svg
        height={VOLUME_CHART_VIEWBOX.height}
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${VOLUME_CHART_VIEWBOX.width} ${VOLUME_CHART_VIEWBOX.height}`}
        width="100%"
      >
        <Defs>
          {SERIES.map((series) => (
            <LinearGradient
              key={series.gradientId}
              id={series.gradientId}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <Stop offset="0%" stopColor={series.color} stopOpacity={0.3} />
              <Stop offset="100%" stopColor={series.color} stopOpacity={0} />
            </LinearGradient>
          ))}
        </Defs>

        {VOLUME_GRID_LEVELS.map((level) => {
          const y = volumeChartY(level);
          return (
            <Line
              key={level}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
              x1={44}
              x2={570}
              y1={y}
              y2={y}
            />
          );
        })}

        {VOLUME_GRID_LEVELS.map((level) => (
          <SvgText
            key={`label-${level}`}
            fill={colors.muted}
            fontFamily={fonts.jetbrainsMono}
            fontSize={9}
            textAnchor="end"
            x={40}
            y={volumeChartY(level) + 3}
          >
            {formatVolumeAxisLabel(level)}
          </SvgText>
        ))}

        {data.labels.map((label, index) => (
          <SvgText
            key={label}
            fill={colors.muted}
            fontFamily={fonts.jetbrainsMono}
            fontSize={9}
            textAnchor="middle"
            x={buildVolumeChartPoints(data.upperA)[index]?.x ?? 0}
            y={chartBottom + 16}
          >
            {label}
          </SvgText>
        ))}

        {SERIES.map((series) => {
          const points = buildVolumeChartPoints(data[series.key]);
          const segments = buildLineSegments(points);

          return segments.map((segment, segmentIndex) => (
            <Path
              key={`${series.key}-area-${segmentIndex}`}
              d={buildAreaPath(segment, chartBottom)}
              fill={`url(#${series.gradientId})`}
            />
          ));
        })}

        {SERIES.map((series) => {
          const segments = buildLineSegments(buildVolumeChartPoints(data[series.key]));

          return segments.map((segment, segmentIndex) => (
            <Path
              key={`${series.key}-line-${segmentIndex}`}
              d={segment.path}
              fill="none"
              stroke={series.color}
              strokeLinejoin="round"
              strokeWidth={2}
            />
          ));
        })}

        {SERIES.flatMap((series) => {
          const points = buildVolumeChartPoints(data[series.key]);
          return points
            .filter((point) => point.value > 0)
            .map((point) => (
              <Circle
                key={`${series.key}-dot-${point.index}`}
                cx={point.x}
                cy={point.y}
                fill={series.color}
                r={2.5}
                stroke={DOT_STROKE}
                strokeWidth={1.5}
              />
            ));
        })}
      </Svg>
    </View>
  );
}
