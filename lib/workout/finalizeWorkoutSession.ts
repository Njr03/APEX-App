import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase, type Set, type WorkoutWithDetails } from '@/lib/supabase';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';

export function resolveWorkoutNameForSplitTracking(
  name: string,
  activeSplit: TrainingSplit | null,
): string {
  if (inferSplitFromWorkoutName(name)) {
    return name;
  }

  if (!activeSplit) {
    return name;
  }

  return `${SPLIT_DEFINITIONS[activeSplit].eyebrow} — ${name}`;
}

/** Marks logged sets as completed so volume and muscle-balance metrics include them. */
export async function finalizeWorkoutSets(
  workout: WorkoutWithDetails,
  completedAt: Date,
): Promise<WorkoutWithDetails> {
  const completedAtIso = completedAt.toISOString();

  const workoutExercises = await Promise.all(
    workout.workout_exercises.map(async (workoutExercise) => {
      const sets = await Promise.all(
        (workoutExercise.sets ?? []).map(async (set) => {
          if (set.completed_at || set.is_warmup) {
            return set;
          }

          const weight = set.weight ?? 0;
          const reps = set.reps ?? 0;
          if (weight <= 0 || reps <= 0) {
            return set;
          }

          const result = await supabase
            .from('sets')
            .update({ completed_at: completedAtIso })
            .eq('id', set.id)
            .select('*')
            .single();

          return throwIfSupabaseError(result) as Set;
        }),
      );

      return { ...workoutExercise, sets };
    }),
  );

  return { ...workout, workout_exercises: workoutExercises };
}
