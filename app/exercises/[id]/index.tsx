import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { format, parseISO } from 'date-fns';

import { ExerciseHistoryChart } from '@/components/exercises/ExerciseHistoryChart';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useExercise, useExerciseHistory, useProfile } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { kgToDisplay, volumeLabel } from '@/lib/units';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading, isError, error } = useExercise(id);
  const { data: history, isLoading: historyLoading } = useExerciseHistory(id);
  const { data: profile } = useProfile();

  const unit = resolveUnitPreference(profile?.unit_preference);

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

  if (isError || !exercise) {
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
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <View>
          <AppText className="text-3xl" variant="display">
            {exercise.name}
          </AppText>
          <AppText className="mt-2 capitalize" variant="muted">
            {exercise.muscle_group.replace('_', ' ')}
            {exercise.equipment ? ` · ${exercise.equipment}` : ''}
            {exercise.exercise_type ? ` · ${exercise.exercise_type}` : ''}
          </AppText>
        </View>

        {exercise.instructions ? (
          <Card>
            <AppText variant="display">Instructions</AppText>
            <AppText className="mt-2 leading-6" variant="body">
              {exercise.instructions}
            </AppText>
          </Card>
        ) : null}

        {historyLoading ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <ExerciseHistoryChart
            data={history?.progression ?? []}
            unit={unit}
          />
        )}

        <View className="gap-2">
          <AppText variant="display">Past performances</AppText>
          {(history?.sessions ?? []).length === 0 ? (
            <Card>
              <AppText variant="muted">No logged sets yet for this exercise.</AppText>
            </Card>
          ) : (
            (history?.sessions ?? []).map((session) => (
              <Card key={session.workout_id}>
                <AppText variant="body">{session.workout_name}</AppText>
                <AppText className="mt-1" variant="muted">
                  {format(parseISO(session.workout_date), 'MMM d, yyyy')}
                </AppText>
                <AppText className="mt-2" variant="mono">
                  {session.sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map(
                      (set) =>
                        `${set.reps}×${kgToDisplay(set.weight, unit)}${set.is_pr ? ' 🏆' : ''}`,
                    )
                    .join(' · ')}{' '}
                  {volumeLabel(unit)}
                </AppText>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
