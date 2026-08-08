import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { useRoutineSummaries, useWorkoutHistory } from '@/hooks/queries';
import { useStartWorkoutSession } from '@/hooks/useStartWorkoutSession';
import { colors } from '@/constants/theme';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import {
  isRoutineCompletedThisWeek,
  WEEKLY_COMPLETION_BLOCKED_MESSAGE,
} from '@/lib/workout/weeklyCompletion';

export function SavedWorkoutsSection() {
  const {
    data: workouts,
    isLoading,
    isError,
    error,
    refetch,
  } = useRoutineSummaries();
  const { data: workoutHistory } = useWorkoutHistory();
  const { startFromRoutineId, isStarting } = useStartWorkoutSession();
  const [startError, setStartError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const handleStart = async (workoutId: string) => {
    setStartError(null);

    try {
      await startFromRoutineId(workoutId);
      router.push('/workout/active');
    } catch (err) {
      setStartError(getSupabaseErrorMessage(err));
    }
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <AppText variant="display">Saved Workouts</AppText>
        <Pressable
          accessibilityLabel="Create workout"
          accessibilityRole="button"
          className="rounded-full bg-accent p-2 active:opacity-80"
          onPress={() => router.push('/routines/new')}
        >
          <Plus color={colors.bg} size={20} />
        </Pressable>
      </View>

      {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

      {isError ? (
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {startError ? (
        <AppText className="text-accent3" variant="body">
          {startError}
        </AppText>
      ) : null}

      {!isLoading && !isError && (workouts?.length ?? 0) === 0 ? (
        <Card>
          <AppText variant="muted">
            No saved workouts yet. Create one to pre-fill your training sessions.
          </AppText>
          <Button
            className="mt-4"
            label="Create Workout"
            onPress={() => router.push('/routines/new')}
            variant="secondary"
          />
        </Card>
      ) : null}

      {!isLoading && !isError && workouts && workouts.length > 0
        ? workouts.map((workout) => (
            <Card key={workout.id}>
              <Link asChild href={`/routines/${workout.id}`}>
                <Pressable className="active:opacity-80">
                  <AppText variant="body">{workout.name}</AppText>
                  {workout.description ? (
                    <AppText className="mt-1" numberOfLines={2} variant="muted">
                      {workout.description}
                    </AppText>
                  ) : null}
                  <View className="mt-3 flex-row gap-4">
                    <View>
                      <AppText variant="muted">Exercises</AppText>
                      <AppText variant="mono">{workout.exercise_count}</AppText>
                    </View>
                    <View>
                      <AppText variant="muted">Last used</AppText>
                      <AppText variant="mono">
                        {workout.last_used_at
                          ? format(parseISO(workout.last_used_at), 'MMM d')
                          : 'Never'}
                      </AppText>
                    </View>
                  </View>
                </Pressable>
              </Link>

              <Button
                className="mt-3"
                disabled={
                  isStarting ||
                  (workoutHistory
                    ? isRoutineCompletedThisWeek(workout.id, workoutHistory)
                    : false)
                }
                label="Start Workout"
                loading={isStarting}
                onPress={() => void handleStart(workout.id)}
                variant="secondary"
              />
              {workoutHistory &&
              isRoutineCompletedThisWeek(workout.id, workoutHistory) ? (
                <AppText className="mt-2" variant="muted">
                  {WEEKLY_COMPLETION_BLOCKED_MESSAGE}
                </AppText>
              ) : null}
            </Card>
          ))
        : null}

      {!isLoading && !isError && (workouts?.length ?? 0) > 0 ? (
        <Button
          label="Manage All Workouts"
          onPress={() => router.push('/routines')}
          variant="ghost"
        />
      ) : null}
    </View>
  );
}
