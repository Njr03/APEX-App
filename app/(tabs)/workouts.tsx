import { PullToRefreshScrollView } from '@/components/ui/PullToRefreshScrollView';
import { Screen } from '@/components/ui/Screen';
import { SavedWorkoutCardsRow } from '@/components/workout/SavedWorkoutCardsRow';
import { WorkoutHistoryChart } from '@/components/workout/WorkoutHistoryChart';
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
      <PullToRefreshScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-5 p-5 pb-10"
        onRefresh={onRefresh}
        refreshing={refreshing}
        showsVerticalScrollIndicator={false}
      >
        <SavedWorkoutCardsRow unit={unit} />

        <WorkoutHistoryChart unit={unit} />
      </PullToRefreshScrollView>
    </Screen>
  );
}
