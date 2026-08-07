import { type ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';

import { ExerciseProgressSection } from '@/components/dashboard/ExerciseProgressSection';
import { MuscleBalanceDetailModal } from '@/components/dashboard/MuscleBalanceDetailModal';
import { MuscleBalanceRadar } from '@/components/dashboard/MuscleBalanceRadar';
import { WeeklyConsistencyDetailModal } from '@/components/dashboard/WeeklyConsistencyDetailModal';
import { WeeklyConsistencyTracker } from '@/components/dashboard/WeeklyConsistencyTracker';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import {
  dashboardCardFrameStyle,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import { useMuscleBalance } from '@/hooks/useMuscleBalance';
import { useWeeklyConsistency } from '@/hooks/useWeeklyConsistency';
import type { WeeklyConsistencyEntry } from '@/lib/training/weeklyConsistency';

const CARD_BG = '#141427';

function InsightCard({
  children,
  onPress,
  compact,
}: {
  children: ReactNode;
  onPress: () => void;
  compact: boolean;
}) {
  const { pressed, handlers } = useDashboardTilePress(onPress);

  return (
    <Pressable
      accessibilityRole="button"
      className={dashboardTileWebClassName('week-split-card')}
      {...handlers}
      style={{
        alignSelf: 'stretch',
        backgroundColor: CARD_BG,
        borderWidth: 1,
        padding: compact ? 16 : 18,
        width: '100%',
        ...dashboardCardFrameStyle(14),
        ...dashboardPressStyle(pressed),
      }}
    >
      {children}
    </Pressable>
  );
}

export function TrainingInsightsSection({ unit = 'kg' }: { unit?: 'kg' | 'lb' }) {
  const { isCompact } = useLayoutBreakpoint();
  const { data: consistencyData } = useWeeklyConsistency();
  const { data: muscleData } = useMuscleBalance();

  const [consistencyVisible, setConsistencyVisible] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeeklyConsistencyEntry | null>(
    null,
  );
  const [muscleVisible, setMuscleVisible] = useState(false);

  const openConsistencyOverview = () => {
    setSelectedWeek(null);
    setConsistencyVisible(true);
  };

  const openConsistencyWeek = (entry: WeeklyConsistencyEntry) => {
    setSelectedWeek(entry);
    setConsistencyVisible(true);
  };

  return (
    <>
      <View style={{ gap: isCompact ? 16 : 20 }}>
        <View className="flex-col" style={{ alignItems: 'stretch', gap: isCompact ? 16 : 20 }}>
          <InsightCard compact={isCompact} onPress={openConsistencyOverview}>
            <WeeklyConsistencyTracker onWeekPress={openConsistencyWeek} />
          </InsightCard>
          <InsightCard compact={isCompact} onPress={() => setMuscleVisible(true)}>
            <MuscleBalanceRadar compact={isCompact} />
          </InsightCard>
          <ExerciseProgressSection unit={unit} />
        </View>
      </View>

      <WeeklyConsistencyDetailModal
        adherencePercent={consistencyData?.summary.adherencePercent ?? 0}
        entries={consistencyData?.entries ?? []}
        onClose={() => {
          setConsistencyVisible(false);
          setSelectedWeek(null);
        }}
        perfectWeeks={consistencyData?.summary.perfectWeeks ?? 0}
        selectedWeek={selectedWeek}
        summaryLabel={consistencyData?.summary.label ?? ''}
        visible={consistencyVisible}
      />

      <MuscleBalanceDetailModal
        onClose={() => setMuscleVisible(false)}
        points={muscleData?.points ?? []}
        visible={muscleVisible}
      />
    </>
  );
}
