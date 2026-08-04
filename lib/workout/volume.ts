import type { Set } from '@/lib/supabase';

/** Sum of weight × reps for all non-warmup completed sets. Weights stored in kg. */
export function calculateWorkoutVolume(
  sets: Pick<Set, 'weight' | 'reps' | 'is_warmup' | 'completed_at'>[],
): number {
  return sets.reduce((total, set) => {
    if (set.is_warmup || !set.completed_at) return total;
    const weight = set.weight ?? 0;
    const reps = set.reps ?? 0;
    return total + weight * reps;
  }, 0);
}

export function countCompletedSets(
  sets: Pick<Set, 'completed_at' | 'is_warmup'>[],
): number {
  return sets.filter((set) => set.completed_at && !set.is_warmup).length;
}

export function collectWorkoutSets(
  workoutExercises: Array<{ sets?: Set[] | null }>,
): Set[] {
  return workoutExercises.flatMap((we) => we.sets ?? []);
}

export function countWorkoutPRSets(
  workoutExercises: Array<{ sets?: Set[] | null }>,
): number {
  return collectWorkoutSets(workoutExercises).filter(
    (set) => set.is_pr && set.completed_at,
  ).length;
}
