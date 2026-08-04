import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/constants/training';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  arms: 'Arms',
  back: 'Back',
  chest: 'Chest',
  core: 'Core',
  full_body: 'Full body',
  legs: 'Legs',
  shoulders: 'Shoulders',
};

export function formatMuscleGroupLabel(muscleGroup: string): string {
  if (muscleGroup in MUSCLE_LABELS) {
    return MUSCLE_LABELS[muscleGroup as MuscleGroup];
  }

  return muscleGroup
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function collectTargetMuscleGroups(
  muscleGroups: Iterable<string | null | undefined>,
): MuscleGroup[] {
  const unique = new Set<string>();

  for (const group of muscleGroups) {
    if (group) unique.add(group);
  }

  return MUSCLE_GROUPS.filter((group) => unique.has(group));
}

export function formatTargetMusclesSubtitle(
  muscleGroups: Iterable<string | null | undefined>,
  fallback = '—',
): string {
  const ordered = collectTargetMuscleGroups(muscleGroups);
  if (ordered.length === 0) return fallback;

  return ordered.map(formatMuscleGroupLabel).join(', ');
}

export function targetMusclesFromWorkoutExercises(
  workoutExercises:
    | Array<{ exercise?: { muscle_group: string } | null }>
    | null
    | undefined,
  fallback = '—',
): string {
  return formatTargetMusclesSubtitle(
    (workoutExercises ?? []).map((entry) => entry.exercise?.muscle_group),
    fallback,
  );
}
