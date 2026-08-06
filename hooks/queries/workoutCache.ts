import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/hooks/queries/queryKeys';
import type { Set, WorkoutWithDetails } from '@/lib/supabase';

export function clearActiveWorkoutCache(
  queryClient: QueryClient,
  userId: string,
) {
  void queryClient.cancelQueries({
    queryKey: queryKeys.workouts.active(userId),
  });
  queryClient.setQueryData(queryKeys.workouts.active(userId), null);
}

export function setActiveWorkoutCache(
  queryClient: QueryClient,
  userId: string,
  workout: WorkoutWithDetails | null,
) {
  queryClient.setQueryData(queryKeys.workouts.active(userId), workout);
}

export function appendSetToActiveWorkoutCache(
  queryClient: QueryClient,
  userId: string,
  newSet: Set,
) {
  queryClient.setQueryData<WorkoutWithDetails | null>(
    queryKeys.workouts.active(userId),
    (current) => {
      if (!current) return current;

      return {
        ...current,
        workout_exercises: current.workout_exercises.map((we) =>
          we.id === newSet.workout_exercise_id
            ? {
                ...we,
                sets: [...we.sets, newSet].sort(
                  (a, b) => a.set_number - b.set_number,
                ),
              }
            : we,
        ),
      };
    },
  );
}

export function updateSetInActiveWorkoutCache(
  queryClient: QueryClient,
  userId: string,
  updatedSet: Set,
) {
  queryClient.setQueryData<WorkoutWithDetails | null>(
    queryKeys.workouts.active(userId),
    (current) => {
      if (!current) return current;

      return {
        ...current,
        workout_exercises: current.workout_exercises.map((we) =>
          we.id === updatedSet.workout_exercise_id
            ? {
                ...we,
                sets: we.sets
                  .map((set) => (set.id === updatedSet.id ? updatedSet : set))
                  .sort((a, b) => a.set_number - b.set_number),
              }
            : we,
        ),
      };
    },
  );
}

/** Refreshes workout lists/history but leaves the active-workout slot as-is. */
export function invalidateWorkoutQueriesExceptActive(
  queryClient: QueryClient,
) {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.workouts.all,
    predicate: (query) => query.queryKey[1] !== 'active',
  });
}

/** Refreshes dashboard tiles, insights, history, routines, and profile metrics. */
export async function invalidateDashboardMetrics(
  queryClient: QueryClient,
  userId?: string,
) {
  await Promise.all([
    invalidateWorkoutQueriesExceptActive(queryClient),
    queryClient.invalidateQueries({ queryKey: queryKeys.profile.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.personalRecords.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.routines.all }),
    userId
      ? queryClient.invalidateQueries({
          queryKey: queryKeys.workouts.active(userId),
        })
      : Promise.resolve(),
  ]);
}
