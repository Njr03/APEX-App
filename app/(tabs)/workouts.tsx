import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import {
  ScrollView,
  View,
} from 'react-native';
import { format, parseISO } from 'date-fns';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { SavedWorkoutCardsRow } from '@/components/workout/SavedWorkoutCardsRow';
import { WorkoutHistoryChart } from '@/components/workout/WorkoutHistoryChart';
import {
  useActiveWorkout,
  useClearUnfinishedWorkouts,
  useProfile,
} from '@/hooks/queries';

import { resolveUnitPreference } from '@/lib/profile/unitPreference';

export default function WorkoutsScreen() {
  const {
    data: activeWorkout,
    refetch: refetchActive,
  } = useActiveWorkout();
  const { data: profile } = useProfile();
  const clearUnfinished = useClearUnfinishedWorkouts();

  useFocusEffect(
    useCallback(() => {
      void refetchActive();
    }, [refetchActive]),
  );

  const handleDeleteUnfinished = async () => {
    await clearUnfinished.mutateAsync();
  };

  const hasUnfinishedSession =
    activeWorkout != null && activeWorkout.status === 'in_progress';
  const unit = resolveUnitPreference(profile?.unit_preference);

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 p-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {hasUnfinishedSession && activeWorkout ? (
          <View className="gap-3">
            <AppText variant="display">Unfinished Session</AppText>
            <AppText variant="muted">
              Resume your current workout or delete it to start fresh.
            </AppText>

            <Card>
              <AppText variant="body">{activeWorkout.name}</AppText>
              <AppText className="mt-1" variant="muted">
                Started{' '}
                {format(parseISO(activeWorkout.started_at), 'MMM d · h:mm a')}
              </AppText>

              <View className="mt-3 flex-row gap-2">
                <Button
                  className="flex-1"
                  label="Resume"
                  onPress={() => router.push('/workout/active')}
                />
                <Button
                  className="flex-1"
                  label="Delete"
                  loading={clearUnfinished.isPending}
                  onPress={() => void handleDeleteUnfinished()}
                  variant="danger"
                />
              </View>
            </Card>
          </View>
        ) : null}

        <SavedWorkoutCardsRow hasUnfinishedSession={hasUnfinishedSession} unit={unit} />

        <WorkoutHistoryChart unit={unit} />
      </ScrollView>
    </Screen>
  );
}
