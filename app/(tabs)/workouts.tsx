import { RefreshControl, ScrollView } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { SavedWorkoutCardsRow } from '@/components/workout/SavedWorkoutCardsRow';
import { WorkoutHistoryChart } from '@/components/workout/WorkoutHistoryChart';
import { colors } from '@/constants/theme';
import { useProfile } from '@/hooks/queries';
import { usePullToRefreshDashboard } from '@/hooks/usePullToRefreshDashboard';
import { useRefreshDashboardOnFocus } from '@/hooks/useRefreshDashboardOnFocus';
import { useTabScrollViewToTop } from '@/hooks/useTabScrollToTop';

import { resolveUnitPreference } from '@/lib/profile/unitPreference';

export default function WorkoutsScreen() {
  const scrollRef = useTabScrollViewToTop('workouts');
  const { data: profile } = useProfile();
  const unit = resolveUnitPreference(profile?.unit_preference);
  const { onRefresh, refreshing } = usePullToRefreshDashboard();
  useRefreshDashboardOnFocus();

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-5 p-5 pb-10"
        refreshControl={
          <RefreshControl
            colors={[colors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={colors.accent}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <SavedWorkoutCardsRow unit={unit} />

        <WorkoutHistoryChart unit={unit} />
      </ScrollView>
    </Screen>
  );
}
