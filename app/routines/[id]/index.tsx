import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useDeleteRoutine, useProfile, useRoutine, useWorkoutHistory } from '@/hooks/queries';
import { useStartWorkoutSession } from '@/hooks/useStartWorkoutSession';
import { colors } from '@/constants/theme';
import { formatSetRepsWeight } from '@/lib/workout/formatSessionVolume';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import {
  isRoutineCompletedThisWeek,
  WEEKLY_COMPLETION_BLOCKED_MESSAGE,
} from '@/lib/workout/weeklyCompletion';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: routine, isLoading, isError, error } = useRoutine(id);
  const { data: profile } = useProfile();
  const { data: workoutHistory } = useWorkoutHistory();
  const deleteRoutine = useDeleteRoutine();
  const { startFromRoutine, isStarting } = useStartWorkoutSession();
  const [startError, setStartError] = useState<string | null>(null);

  const unit = resolveUnitPreference(profile?.unit_preference);
  const completedThisWeek = useMemo(
    () =>
      routine && workoutHistory
        ? isRoutineCompletedThisWeek(routine.id, workoutHistory)
        : false,
    [routine, workoutHistory],
  );

  const handleStart = async () => {
    if (!routine) return;

    setStartError(null);

    try {
      await startFromRoutine(routine);
      router.push('/workout/active');
    } catch (err) {
      setStartError(getSupabaseErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    await deleteRoutine.mutateAsync(id!);
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (isError || !routine) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <AppText className="text-accent3" variant="body">
          {getSupabaseErrorMessage(error)}
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
      >
        <BackButton />
        <AppText className="text-3xl" variant="display">
          {routine.name}
        </AppText>
        {routine.description ? (
          <AppText variant="muted">{routine.description}</AppText>
        ) : null}

        <Card className="gap-3">
          {(routine.routine_exercises ?? []).map((re) => (
            <View key={re.id}>
              <AppText variant="body">{re.exercise.name}</AppText>
              <AppText className="mt-1" variant="mono">
                {formatSetRepsWeight(
                  re.target_sets,
                  re.target_reps,
                  re.target_weight,
                  unit,
                )}
              </AppText>
            </View>
          ))}
        </Card>

        <Button
          disabled={isStarting || completedThisWeek}
          label="Start Workout"
          loading={isStarting}
          onPress={() => void handleStart()}
        />
        {completedThisWeek ? (
          <AppText variant="muted">{WEEKLY_COMPLETION_BLOCKED_MESSAGE}</AppText>
        ) : null}
        {startError ? (
          <AppText className="text-accent3" variant="body">
            {startError}
          </AppText>
        ) : null}
        <Button
          label="Edit Workout"
          onPress={() => router.push(`/routines/${id}/edit`)}
          variant="secondary"
        />
        <Button
          label="Delete Workout"
          loading={deleteRoutine.isPending}
          onPress={handleDelete}
          variant="danger"
        />
      </ScrollView>
    </Screen>
  );
}
