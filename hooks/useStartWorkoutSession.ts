import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  useAddWorkoutExercise,
  useClearUnfinishedWorkouts,
  useCreateWorkout,
} from '@/hooks/queries/useWorkouts';
import { fetchWorkoutHistory } from '@/hooks/queries/useProgressStats';
import { useCreateSet } from '@/hooks/queries/useSets';
import { defaultWorkoutName } from '@/hooks/useFinishWorkout';
import type { SplitWorkoutPlan } from '@/lib/training/splitTemplates';
import { getSplitWorkoutName } from '@/lib/training/splits';
import {
  hydrateActiveWorkoutCache,
  populateWorkoutFromPlan,
  populateWorkoutFromRoutine,
} from '@/lib/workout/populateWorkoutSession';
import {
  isRoutineCompletedThisWeek,
  isSplitCompletedThisWeek,
  WEEKLY_COMPLETION_BLOCKED_MESSAGE,
} from '@/lib/workout/weeklyCompletion';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type RoutineWithExercises,
  type WorkoutWithDetails,
} from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useWorkoutPlanStore } from '@/stores/workoutPlanStore';

async function fetchRoutineWithExercises(
  routineId: string,
): Promise<RoutineWithExercises> {
  const result = await supabase
    .from('routines')
    .select(
      `
      *,
      routine_exercises (
        *,
        exercise:exercises (*)
      )
    `,
    )
    .eq('id', routineId)
    .single();

  const data = throwIfSupabaseError(result);

  return {
    ...data,
    routine_exercises: [...(data.routine_exercises ?? [])].sort(
      (a, b) => a.order_index - b.order_index,
    ),
  } as RoutineWithExercises;
}

export function useStartWorkoutSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const createWorkout = useCreateWorkout();
  const addExercise = useAddWorkoutExercise();
  const createSet = useCreateSet();
  const clearUnfinished = useClearUnfinishedWorkouts();

  const mutation = useMutation({
    mutationFn: async ({
      plan,
      routine,
      routineId,
    }: {
      plan?: SplitWorkoutPlan;
      routine?: RoutineWithExercises;
      routineId?: string;
    }): Promise<WorkoutWithDetails> => {
      if (!user) throw new Error('Not authenticated');

      await clearUnfinished.mutateAsync();

      const resolvedRoutine =
        routine ?? (routineId ? await fetchRoutineWithExercises(routineId) : null);

      const history = await fetchWorkoutHistory(user.id);

      if (resolvedRoutine && isRoutineCompletedThisWeek(resolvedRoutine.id, history)) {
        throw new Error(WEEKLY_COMPLETION_BLOCKED_MESSAGE);
      }

      if (plan && isSplitCompletedThisWeek(plan.split, history)) {
        throw new Error(WEEKLY_COMPLETION_BLOCKED_MESSAGE);
      }

      const callbacks = {
        addExercise: (input: {
          workoutId: string;
          exerciseId: string;
          orderIndex: number;
        }) => addExercise.mutateAsync(input),
        createSet: (input: {
          workout_exercise_id: string;
          set_number: number;
          weight?: number | null;
          reps?: number | null;
        }) => createSet.mutateAsync(input),
      };

      const workout = await createWorkout.mutateAsync({
        name:
          resolvedRoutine?.name ??
          (plan ? getSplitWorkoutName(plan.split) : defaultWorkoutName()),
        routine_id: resolvedRoutine?.id ?? null,
      });

      if (resolvedRoutine?.routine_exercises.length) {
        await populateWorkoutFromRoutine(workout, resolvedRoutine, callbacks);
      } else if (plan?.exercises.length) {
        await populateWorkoutFromPlan(workout, plan, callbacks);
        useWorkoutPlanStore.getState().clearPendingPlan();
      }

      return hydrateActiveWorkoutCache(queryClient, user.id, workout.id);
    },
  });

  return {
    startFromPlan: (plan: SplitWorkoutPlan) => mutation.mutateAsync({ plan }),
    startFromRoutine: (routine: RoutineWithExercises) =>
      mutation.mutateAsync({ routine }),
    startFromRoutineId: (routineId: string) =>
      mutation.mutateAsync({ routineId }),
    isStarting: mutation.isPending,
    error: mutation.error,
  };
}
