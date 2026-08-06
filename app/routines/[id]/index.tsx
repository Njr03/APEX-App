import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useDeleteRoutine, useProfile, useRoutine } from '@/hooks/queries';
import { useStartWorkoutSession } from '@/hooks/useStartWorkoutSession';
import { kgToDisplay, volumeLabel } from '@/lib/units';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: routine, isLoading, isError, error } = useRoutine(id);
  const { data: profile } = useProfile();
  const deleteRoutine = useDeleteRoutine();
  const { startFromRoutine, isStarting } = useStartWorkoutSession();
  const [startError, setStartError] = useState<string | null>(null);

  const unit = resolveUnitPreference(profile?.unit_preference);

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
                {re.target_sets ?? '—'} × {re.target_reps ?? '—'} reps
                {re.target_weight != null
                  ? ` @ ${kgToDisplay(re.target_weight, unit)} ${volumeLabel(unit)}`
                  : ''}
              </AppText>
            </View>
          ))}
        </Card>

        <Button
          disabled={isStarting}
          label="Start Workout"
          loading={isStarting}
          onPress={() => void handleStart()}
        />
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
