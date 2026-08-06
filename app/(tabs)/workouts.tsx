import { ScrollView } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { SavedWorkoutCardsRow } from '@/components/workout/SavedWorkoutCardsRow';
import { WorkoutHistoryChart } from '@/components/workout/WorkoutHistoryChart';
import { useProfile } from '@/hooks/queries';
import { useRefreshDashboardOnFocus } from '@/hooks/useRefreshDashboardOnFocus';

import { resolveUnitPreference } from '@/lib/profile/unitPreference';

export default function WorkoutsScreen() {
  const { data: profile } = useProfile();
  const unit = resolveUnitPreference(profile?.unit_preference);
  useRefreshDashboardOnFocus();

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <SavedWorkoutCardsRow unit={unit} />

        <WorkoutHistoryChart unit={unit} />
      </ScrollView>
    </Screen>
  );
}
