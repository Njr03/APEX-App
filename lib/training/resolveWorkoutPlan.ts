import { getSplitTemplate, type SplitWorkoutPlan } from '@/lib/training/splitTemplates';
import type { TrainingSplit } from '@/lib/training/splits';
import { throwIfSupabaseError } from '@/lib/supabase/errors';
import { supabase } from '@/lib/supabase';
import { useWorkoutPlanStore } from '@/stores/workoutPlanStore';

export function parseRouteParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseTrainingSplit(split?: string): TrainingSplit | null {
  if (split === 'A' || split === 'B' || split === 'L') return split;
  return null;
}

export async function resolveWorkoutPlan(
  splitParam: string | undefined,
  confirmedParam: string | undefined,
): Promise<SplitWorkoutPlan | null> {
  const pending = useWorkoutPlanStore.getState().pendingPlan;
  if (pending) return pending;

  const confirmed = parseRouteParam(confirmedParam);
  const split = parseTrainingSplit(parseRouteParam(splitParam));
  if (confirmed !== '1' || !split) return null;

  const template = getSplitTemplate(split);
  const result = await supabase.from('exercises').select('id, name');
  const exercises = throwIfSupabaseError(result);

  const resolvedExercises = template.exercises.map((item) => {
    const exercise = exercises.find((entry) => entry.name === item.exerciseName);
    return {
      ...item,
      exerciseId: exercise?.id,
    };
  });

  if (resolvedExercises.some((item) => !item.exerciseId)) {
    return null;
  }

  return {
    split,
    exercises: resolvedExercises,
  };
}
