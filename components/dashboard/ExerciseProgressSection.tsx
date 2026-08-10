import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/Text';

import { ExerciseProgressChartModal } from '@/components/dashboard/ExerciseProgressChartModal';
import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { ExercisePickerModal } from '@/components/workout/ExercisePickerModal';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import {
  dashboardCardFrameStyle,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import type { Exercise } from '@/lib/supabase';
import { fonts } from '@/constants/theme';

const CARD_BG = '#141427';
const MUTED = 'rgba(240,237,232,0.5)';

interface ExerciseProgressSectionProps {
  unit: 'kg' | 'lb';
}

export function ExerciseProgressSection({ unit }: ExerciseProgressSectionProps) {
  const { isCompact } = useLayoutBreakpoint();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [chartVisible, setChartVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const openPicker = () => setPickerVisible(true);
  const { pressed, handlers } = useDashboardTilePress(
    pickerVisible || chartVisible ? undefined : openPicker,
  );

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setChartVisible(true);
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        className={dashboardTileWebClassName('week-split-card')}
        {...handlers}
        style={{
          alignSelf: 'stretch',
          backgroundColor: CARD_BG,
          borderWidth: 1,
          padding: isCompact ? 16 : 18,
          width: '100%',
          ...dashboardCardFrameStyle(14),
          ...dashboardPressStyle(pressed),
        }}
      >
        <View style={{ gap: 10 }}>
          <InsightSectionHeading title="Exercise progress" />
          <View style={{ gap: 4 }}>
            <Text
              style={{
                color: '#f0ede8',
                fontFamily: fonts.bodyMedium,
                fontSize: 13,
              }}
            >
              {selectedExercise?.name ?? 'Select an exercise'}
            </Text>
            <Text
              style={{
                color: MUTED,
                fontFamily: fonts.body,
                fontSize: 11,
              }}
            >
              Max weight progression with PR highlights
            </Text>
          </View>
        </View>
      </Pressable>

      <ExercisePickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={handleSelectExercise}
        title="Select exercise"
        titleStyle="section"
        visible={pickerVisible}
      />

      <ExerciseProgressChartModal
        exercise={selectedExercise}
        onClose={({ hadLoggedWorkouts }) => {
          setChartVisible(false);
          if (!hadLoggedWorkouts) {
            setSelectedExercise(null);
          }
        }}
        unit={unit}
        visible={chartVisible}
      />
    </>
  );
}
