import { format, parseISO } from 'date-fns';

import {
  DashboardDetailModal,
  DashboardDetailRow,
  DashboardDetailSection,
} from '@/components/dashboard/DashboardDetailModal';
import type { WeeklyConsistencyEntry } from '@/lib/training/weeklyConsistency';
import {
  SPLIT_CELL_ORDER,
  splitCellColor,
} from '@/lib/training/weeklyConsistency';
import { SPLIT_DEFINITIONS } from '@/lib/training/splits';
import { colors, fonts } from '@/constants/theme';
import { View } from 'react-native';
import { Text } from '@/components/ui/Text';

interface WeeklyConsistencyDetailModalProps {
  visible: boolean;
  onClose: () => void;
  summaryLabel: string;
  perfectWeeks: number;
  adherencePercent: number;
  entries: WeeklyConsistencyEntry[];
  selectedWeek?: WeeklyConsistencyEntry | null;
}

function WeekBreakdown({
  entry,
}: {
  entry: WeeklyConsistencyEntry;
}) {
  return (
    <DashboardDetailSection
      title={`${format(parseISO(entry.weekStart), 'MMM d')} – ${format(parseISO(entry.weekEnd), 'MMM d, yyyy')}`}
    >
      {SPLIT_CELL_ORDER.map((split) => {
        const definition = SPLIT_DEFINITIONS[split];
        const completed = entry[split];

        return (
          <View
            key={split}
            className="flex-row items-center justify-between gap-3"
          >
            <View className="flex-row items-center gap-2">
              <View
                style={{
                  backgroundColor: splitCellColor(split, completed),
                  borderRadius: 4,
                  height: 14,
                  width: 14,
                }}
              />
              <Text style={{ color: colors.text, fontFamily: fonts.body, fontSize: 12 }}>
                {definition.name}
              </Text>
            </View>
            <Text
              style={{
                color: completed ? definition.color : colors.muted,
                fontFamily: fonts.jetbrainsMono,
                fontSize: 11,
              }}
            >
              {completed ? 'Completed' : 'Missed'}
            </Text>
          </View>
        );
      })}
    </DashboardDetailSection>
  );
}

export function WeeklyConsistencyDetailModal({
  visible,
  onClose,
  summaryLabel,
  perfectWeeks,
  adherencePercent,
  entries,
  selectedWeek,
}: WeeklyConsistencyDetailModalProps) {
  const focusEntry = selectedWeek ?? entries[entries.length - 1];

  return (
    <DashboardDetailModal
      eyebrow="Training insight"
      eyebrowColor={colors.accent}
      onClose={onClose}
      subtitle={summaryLabel}
      title={selectedWeek ? `${selectedWeek.week} Breakdown` : 'Weekly Consistency'}
      visible={visible}
    >
      <DashboardDetailSection title="Overview">
        <DashboardDetailRow
          label="Perfect weeks"
          value={`${perfectWeeks} / ${entries.length}`}
          valueColor={colors.accent}
        />
        <DashboardDetailRow
          label="Adherence"
          value={`${adherencePercent}%`}
          valueColor={colors.accent}
        />
        <DashboardDetailRow label="Tracking window" value="Last 8 weeks" />
      </DashboardDetailSection>

      {focusEntry ? <WeekBreakdown entry={focusEntry} /> : null}
    </DashboardDetailModal>
  );
}
