import type { QueryClient } from '@tanstack/react-query';

import {
  WORKOUT_DETAIL_SELECT,
  normalizeWorkoutDetails,
} from '@/hooks/queries/useWorkouts';
import { setActiveWorkoutCache } from '@/hooks/queries/workoutCache';
import type { SplitWorkoutPlan } from '@/lib/training/splitTemplates';
import { inferSplitFromWorkoutName, resolveWorkoutSplit } from '@/lib/training/splits';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import {
  supabase,
  type RoutineWithExercises,
  type Workout,
  type WorkoutWithDetails,
} from '@/lib/supabase';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

export async function loadWorkoutDetails(
  workoutId: string,
): Promise<WorkoutWithDetails> {
  const result = await supabase
    .from('workouts')
    .select(WORKOUT_DETAIL_SELECT)
    .eq('id', workoutId)
    .single();

  return normalizeWorkoutDetails(throwIfSupabaseError(result));
}

interface PopulateCallbacks {
  addExercise: (input: {
    workoutId: string;
    exerciseId: string;
    orderIndex: number;
  }) => Promise<{ id: string }>;
  createSet: (input: {
    workout_exercise_id: string;
    set_number: number;
    weight?: number | null;
    reps?: number | null;
  }) => Promise<unknown>;
}

export async function populateWorkoutFromPlan(
  workout: Workout,
  plan: SplitWorkoutPlan,
  callbacks: PopulateCallbacks,
) {
  const { setExerciseExpanded, setExerciseTargets, initSession } =
    useWorkoutSessionStore.getState();

  for (const [index, planned] of plan.exercises.entries()) {
    if (!planned.exerciseId) {
      throw new Error(`Missing exercise: ${planned.exerciseName}`);
    }

    const workoutExercise = await callbacks.addExercise({
      workoutId: workout.id,
      exerciseId: planned.exerciseId,
      orderIndex: index,
    });

    setExerciseTargets(workoutExercise.id, {
      targetSets: planned.sets,
      targetReps: planned.reps,
      targetWeight: planned.weightKg,
    });

    for (let setNumber = 1; setNumber <= planned.sets; setNumber += 1) {
      await callbacks.createSet({
        workout_exercise_id: workoutExercise.id,
        set_number: setNumber,
        weight: planned.weightKg,
        reps: planned.reps,
      });
    }

    setExerciseExpanded(workoutExercise.id, index === 0);
  }

  initSession(plan.split, workout.started_at);
}

export async function populateWorkoutFromRoutine(
  workout: Workout,
  routine: RoutineWithExercises,
  callbacks: PopulateCallbacks,
) {
  const { setExerciseExpanded, setExerciseTargets, initSession } =
    useWorkoutSessionStore.getState();

  for (const [index, re] of routine.routine_exercises.entries()) {
    const workoutExercise = await callbacks.addExercise({
      workoutId: workout.id,
      exerciseId: re.exercise_id,
      orderIndex: re.order_index ?? index,
    });

    setExerciseTargets(workoutExercise.id, {
      targetSets: re.target_sets,
      targetReps: re.target_reps,
      targetWeight: re.target_weight,
    });

    const setCount = Math.max(re.target_sets ?? 3, 1);
    for (let setNumber = 1; setNumber <= setCount; setNumber += 1) {
      await callbacks.createSet({
        workout_exercise_id: workoutExercise.id,
        set_number: setNumber,
        weight: re.target_weight ?? null,
        reps: re.target_reps ?? null,
      });
    }

    setExerciseExpanded(workoutExercise.id, index === 0);
  }

  initSession(
    resolveWorkoutSplit({
      name: workout.name,
      routineName: routine.name,
      muscleGroups: routine.routine_exercises.map(
        (entry) => entry.exercise?.muscle_group,
      ),
    }),
    workout.started_at,
  );
}

export async function hydrateActiveWorkoutCache(
  queryClient: QueryClient,
  userId: string,
  workoutId: string,
): Promise<WorkoutWithDetails> {
  const hydratedWorkout = await loadWorkoutDetails(workoutId);
  setActiveWorkoutCache(queryClient, userId, hydratedWorkout);
  return hydratedWorkout;
}
