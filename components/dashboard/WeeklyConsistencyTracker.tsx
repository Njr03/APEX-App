import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';

import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { QueryError } from '@/components/ui/QueryState';
import { useWeeklyConsistency } from '@/hooks/useWeeklyConsistency';
import {
  formatWeeklyConsistencyTooltip,
  SPLIT_CELL_ORDER,
  splitCellColor,
  type WeeklyConsistencyEntry,
} from '@/lib/training/weeklyConsistency';
import { colors, fonts } from '@/constants/theme';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

const CELL_SIZE = 22;
const CELL_GAP = 4;
const COLUMN_GAP = 8;

function ConsistencyCell({
  split,
  completed,
}: {
  split: (typeof SPLIT_CELL_ORDER)[number];
  completed: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: splitCellColor(split, completed),
        borderRadius: 4,
        height: CELL_SIZE,
        width: CELL_SIZE,
      }}
    />
  );
}

function WeekColumn({
  entry,
  onPress,
}: {
  entry: WeeklyConsistencyEntry;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const tooltip = formatWeeklyConsistencyTooltip(entry);
  const perfectWeek = entry.A && entry.B && entry.L;

  return (
    <View className="relative items-center" style={{ gap: 8 }}>
      <Pressable
        accessibilityHint={tooltip}
        accessibilityLabel={tooltip}
        accessibilityRole="button"
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={(event) => {
          event.stopPropagation?.();
          onPress();
        }}
        style={{
          alignItems: 'center',
          backgroundColor: perfectWeek ? 'rgba(200,255,90,0.06)' : 'transparent',
          borderColor: perfectWeek ? 'rgba(200,255,90,0.15)' : 'transparent',
          borderRadius: 8,
          borderWidth: 1,
          gap: CELL_GAP,
          paddingHorizontal: 4,
          paddingVertical: 6,
        }}
      >
        {SPLIT_CELL_ORDER.map((split) => (
          <ConsistencyCell
            key={split}
            completed={entry[split]}
            split={split}
          />
        ))}
      </Pressable>

      <Text
        style={{
          color: perfectWeek ? colors.accent : colors.muted2,
          fontFamily: fonts.jetbrainsMono,
          fontSize: 9,
          textAlign: 'center',
        }}
      >
        {entry.week}
      </Text>

      {Platform.OS === 'web' && hovered ? (
        <View
          pointerEvents="none"
          style={{
            backgroundColor: colors.surface2,
            borderColor: colors.border,
            borderRadius: 8,
            borderWidth: 1,
            bottom: 72,
            left: '50%',
            maxWidth: 220,
            paddingHorizontal: 8,
            paddingVertical: 6,
            position: 'absolute',
            transform: [{ translateX: -110 }],
            zIndex: 20,
          }}
        >
          <Text
            style={{
              color: colors.text,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 9,
              textAlign: 'center',
            }}
          >
            {tooltip}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function WeeklyConsistencyTracker({
  onWeekPress,
}: {
  onWeekPress?: (entry: WeeklyConsistencyEntry) => void;
}) {
  const { data, isLoading, isError, error, refetch } = useWeeklyConsistency();

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
    <View style={{ gap: 14 }}>
      <InsightSectionHeading title="Weekly Consistency" />

      <View className="flex-row items-start justify-center" style={{ gap: COLUMN_GAP }}>
        {data.entries.map((entry) => (
          <WeekColumn
            key={entry.week}
            entry={entry}
            onPress={() => onWeekPress?.(entry)}
          />
        ))}
      </View>

      <Text
        style={{
          color: colors.muted,
          fontFamily: fonts.body,
          fontSize: 11,
        }}
      >
        {data.summary.label}
      </Text>
    </View>
  );
}
