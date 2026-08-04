import { calculateSetVolume } from '@/lib/personalRecords';
import type { RoutineExercise, WorkoutWithDetails } from '@/lib/supabase';
import {
  calculateWorkoutVolume,
  collectWorkoutSets,
} from '@/lib/workout/volume';

export type RoutineTargetCheck = {
  routine_exercises: Pick<
    RoutineExercise,
    | 'exercise_id'
    | 'target_sets'
    | 'target_reps'
    | 'target_weight'
  >[];
};

/**
 * Returns true when every routine exercise with defined targets
 * meets or exceeds its target volume (sets × reps × weight).
 */
export function didHitRoutineTargets(
  workout: WorkoutWithDetails,
  routine: RoutineTargetCheck,
): boolean {
  const targeted = routine.routine_exercises.filter(
    (re) =>
      re.target_sets != null &&
      re.target_reps != null &&
      re.target_weight != null &&
      re.target_sets > 0 &&
      re.target_reps > 0 &&
      re.target_weight > 0,
  );

  if (targeted.length === 0) {
    return false;
  }

  for (const target of targeted) {
    const workoutExercise = workout.workout_exercises.find(
      (we) => we.exercise_id === target.exercise_id,
    );

    if (!workoutExercise) {
      return false;
    }

    const actualVolume = (workoutExercise.sets ?? [])
      .filter((set) => set.completed_at && !set.is_warmup)
      .reduce(
        (sum, set) =>
          sum + calculateSetVolume(set.weight ?? 0, set.reps ?? 0),
        0,
      );

    const targetVolume =
      target.target_sets! * target.target_reps! * target.target_weight!;

    if (actualVolume < targetVolume) {
      return false;
    }
  }

  return true;
}

/** Sum actual logged volume for the workout session. */
export function getWorkoutLoggedVolume(workout: WorkoutWithDetails): number {
  return calculateWorkoutVolume(collectWorkoutSets(workout.workout_exercises));
}
