import { type ReactNode, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { MuscleBalanceDetailModal } from '@/components/dashboard/MuscleBalanceDetailModal';
import { MuscleBalanceRadar } from '@/components/dashboard/MuscleBalanceRadar';
import { WeeklyConsistencyDetailModal } from '@/components/dashboard/WeeklyConsistencyDetailModal';
import { WeeklyConsistencyTracker } from '@/components/dashboard/WeeklyConsistencyTracker';
import { dashboardCardFrameStyle, dashboardHoverStyle } from '@/lib/dashboard/cardStyles';
import { useMuscleBalance } from '@/hooks/useMuscleBalance';
import { useWeeklyConsistency } from '@/hooks/useWeeklyConsistency';
import type { WeeklyConsistencyEntry } from '@/lib/training/weeklyConsistency';

const CARD_BG = '#141427';

function InsightCard({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      className={Platform.OS === 'web' ? 'week-split-card' : undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={onPress}
      style={{
        backgroundColor: CARD_BG,
        borderWidth: 1,
        flex: 1,
        minWidth: 300,
        padding: 18,
        ...dashboardCardFrameStyle(14),
        ...dashboardHoverStyle(hovered),
      }}
    >
      {children}
    </Pressable>
  );
}

export function TrainingInsightsSection() {
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
      <View className="flex-row flex-wrap items-stretch" style={{ gap: 20 }}>
        <InsightCard onPress={openConsistencyOverview}>
          <WeeklyConsistencyTracker onWeekPress={openConsistencyWeek} />
        </InsightCard>
        <InsightCard onPress={() => setMuscleVisible(true)}>
          <MuscleBalanceRadar />
        </InsightCard>
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
