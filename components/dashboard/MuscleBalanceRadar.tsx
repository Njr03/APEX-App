import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { QueryError } from '@/components/ui/QueryState';
import { colors, fonts } from '@/constants/theme';
import { useMuscleBalance } from '@/hooks/useMuscleBalance';
import {
  getMuscleBarFillColor,
  getMuscleDotColor,
  getMuscleTextColor,
  polarToCartesian,
  RADAR_CENTER,
  RADAR_LABEL_RADIUS,
  RADAR_MAX_RADIUS,
  RADAR_SIZE,
  RADAR_VIEW_ORIGIN,
  RADAR_VIEW_SIZE,
  radarDataPolygonPoints,
  radarLabelAnchor,
  radarPolygonPoints,
  type MuscleBalancePoint,
} from '@/lib/muscleBalance';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

const GRID_STROKE = 'rgba(255,255,255,0.06)';
const DATA_FILL = 'rgba(200,255,90,0.08)';
const DATA_STROKE = 'rgba(200,255,90,0.7)';
const DOT_STROKE = '#07070f';

function RadarChart({ points }: { points: MuscleBalancePoint[] }) {
  const values = points.map((point) => point.value);
  const dataPoints = values.map((value, index) =>
    polarToCartesian(
      RADAR_CENTER,
      RADAR_CENTER,
      (Math.min(100, Math.max(0, value)) / 100) * RADAR_MAX_RADIUS,
      index,
    ),
  );

  return (
    <Svg
      height={RADAR_SIZE}
      viewBox={`${RADAR_VIEW_ORIGIN} ${RADAR_VIEW_ORIGIN} ${RADAR_VIEW_SIZE} ${RADAR_VIEW_SIZE}`}
      width={RADAR_SIZE}
    >
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <Polygon
          key={scale}
          fill="none"
          points={radarPolygonPoints(scale)}
          stroke={GRID_STROKE}
          strokeWidth={1}
        />
      ))}

      {Array.from({ length: points.length }, (_, index) => {
        const outer = polarToCartesian(RADAR_CENTER, RADAR_CENTER, RADAR_MAX_RADIUS, index);
        return (
          <Line
            key={index}
            stroke={GRID_STROKE}
            strokeWidth={1}
            x1={RADAR_CENTER}
            x2={outer.x}
            y1={RADAR_CENTER}
            y2={outer.y}
          />
        );
      })}

      <Polygon
        fill={DATA_FILL}
        points={radarDataPolygonPoints(values)}
        stroke={DATA_STROKE}
        strokeWidth={1.5}
      />

      {dataPoints.map((point, index) => (
        <Circle
          key={index}
          cx={point.x}
          cy={point.y}
          fill={getMuscleDotColor(values[index])}
          r={3}
          stroke={DOT_STROKE}
          strokeWidth={1.5}
        />
      ))}

      {points.flatMap((point, index) => {
        const labelPos = polarToCartesian(
          RADAR_CENTER,
          RADAR_CENTER,
          RADAR_LABEL_RADIUS,
          index,
        );
        const anchor = radarLabelAnchor(labelPos.x);
        const valueColor = getMuscleTextColor(point.value, colors.muted);

        return [
          <SvgText
            key={`${point.key}-label`}
            fill={colors.muted}
            fontFamily={fonts.jetbrainsMono}
            fontSize={8.5}
            opacity={0.45}
            textAnchor={anchor}
            x={labelPos.x}
            y={labelPos.y}
          >
            {point.label}
          </SvgText>,
          <SvgText
            key={`${point.key}-value`}
            fill={valueColor}
            fontFamily={fonts.jetbrainsMono}
            fontSize={9}
            fontWeight="500"
            textAnchor={anchor}
            x={labelPos.x}
            y={labelPos.y + 11}
          >
            {point.value}%
          </SvgText>,
        ];
      })}
    </Svg>
  );
}

function ImbalancePanel({
  points,
  compact = false,
}: {
  points: MuscleBalancePoint[];
  compact?: boolean;
}) {
  return (
    <View
      className={compact ? 'w-full' : 'min-w-[156px] flex-1'}
      style={{ alignSelf: compact ? 'stretch' : undefined, gap: 10 }}
    >
      {points.map((point) => {
        const textColor = getMuscleTextColor(point.value, colors.muted);
        const barFill = getMuscleBarFillColor(point.value, 'rgba(240,237,232,0.25)');

        return (
          <View key={point.key} style={{ gap: 4 }}>
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 8 }}>
              <Text
                style={{
                  color: textColor,
                  flexGrow: 1,
                  flexShrink: 1,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 9,
                  minWidth: 0,
                }}
              >
                {point.label}
              </Text>
              <Text
                style={{
                  color: textColor,
                  flexShrink: 0,
                  fontFamily: fonts.jetbrainsMono,
                  fontSize: 10,
                }}
              >
                {point.value}%
              </Text>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 2,
                height: 3,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  backgroundColor: barFill,
                  borderRadius: 2,
                  height: 3,
                  width: `${point.value}%`,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function MuscleBalanceRadar({ compact = false }: { compact?: boolean }) {
  const { isCompact: layoutCompact } = useLayoutBreakpoint();
  const stacked = compact || layoutCompact;
  const { data, isLoading, isError, error, refetch } = useMuscleBalance();

  if (isLoading) {
    return null;
  }

  if (isError || !data) {
    return (
      <QueryError
        message={getSupabaseErrorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <InsightSectionHeading title="Muscle Balance" />

      <View
        className={stacked ? 'flex-col items-center' : 'flex-row items-start'}
        style={{ gap: stacked ? 14 : 16 }}
      >
        <RadarChart points={data.points} />
        <ImbalancePanel compact={stacked} points={data.points} />
      </View>

      <Text
        style={{
          color: colors.muted,
          fontFamily: fonts.body,
          fontSize: 11,
        }}
      >
        Last 4 weeks · volume coverage vs monthly target
      </Text>
    </View>
  );
}
