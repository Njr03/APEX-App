import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';

export function dedupeSavedWorkoutsForSession(
  workouts: RoutineSummary[],
): RoutineSummary[] {
  const seenIds = new Set<string>();

  return workouts.filter((workout) => {
    if (seenIds.has(workout.id)) return false;
    seenIds.add(workout.id);
    return true;
  });
}

export function upsertRoutineSummary(
  workouts: RoutineSummary[] | undefined,
  routine: RoutineSummary,
): RoutineSummary[] {
  if (!workouts?.length) return [routine];

  const withoutExisting = workouts.filter((entry) => entry.id !== routine.id);
  return [routine, ...withoutExisting];
}
