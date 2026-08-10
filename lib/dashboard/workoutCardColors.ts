import type { MuscleGroup } from '@/lib/constants/training';
import {
  collectTargetMuscleGroups,
} from '@/lib/training/targetMuscles';
import {
  inferSplitFromWorkoutName,
  type TrainingSplit,
} from '@/lib/training/splits';

/** Orange → purple → blue → green sequence for workout cards. */
export const WORKOUT_CARD_COLORS = {
  upper: '#ff8c42',
  lower: '#b06bff',
  core: '#38d9f5',
  other: '#c8ff5a',
} as const;

export const WORKOUT_CARD_LEGEND = [
  { label: 'Upper', color: WORKOUT_CARD_COLORS.upper },
  { label: 'Lower', color: WORKOUT_CARD_COLORS.lower },
  { label: 'Core', color: WORKOUT_CARD_COLORS.core },
  { label: 'Other', color: WORKOUT_CARD_COLORS.other },
] as const;

export type WorkoutCardColorCategory = keyof typeof WORKOUT_CARD_COLORS;

const UPPER_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms'];
const LOWER_GROUPS: MuscleGroup[] = ['legs'];
const CORE_GROUPS: MuscleGroup[] = ['core'];

export function workoutCardColorForCategory(
  category: WorkoutCardColorCategory,
): string {
  return WORKOUT_CARD_COLORS[category];
}

export function workoutCardColorForSplit(split: TrainingSplit): string {
  return workoutCardColorForCategory(split === 'L' ? 'lower' : 'upper');
}

function matchesCoreOrAbsName(name: string): boolean {
  return /\b(abs?|core)\b/i.test(name);
}

function categoryFromMuscleGroups(
  groups: MuscleGroup[],
  name?: string,
): WorkoutCardColorCategory {
  if (groups.includes('full_body')) return 'other';

  const upperCount = groups.filter((group) => UPPER_GROUPS.includes(group)).length;
  const lowerCount = groups.filter((group) => LOWER_GROUPS.includes(group)).length;
  const coreCount = groups.filter((group) => CORE_GROUPS.includes(group)).length;

  if (coreCount > 0 && upperCount === 0 && lowerCount === 0) return 'core';
  if (lowerCount > 0 && upperCount === 0 && coreCount === 0) return 'lower';
  if (upperCount > 0 && lowerCount === 0 && coreCount === 0) return 'upper';

  if (upperCount > 0 && lowerCount > 0) return 'other';
  if (coreCount > 0 && lowerCount > 0 && upperCount === 0) return 'other';

  if (lowerCount > upperCount) return 'lower';
  if (upperCount > lowerCount) return 'upper';
  if (coreCount > 0) return 'core';

  if (name && matchesCoreOrAbsName(name)) return 'core';

  return 'other';
}

export function resolveWorkoutCardColorCategory(input: {
  name?: string;
  split?: TrainingSplit | null;
  muscleGroups?: Iterable<string | null | undefined>;
  /** Saved workouts: derive color from exercises, not name keywords like "push". */
  preferMuscleGroups?: boolean;
}): WorkoutCardColorCategory {
  const groups = collectTargetMuscleGroups(input.muscleGroups ?? []);

  if (input.preferMuscleGroups && groups.length > 0) {
    return categoryFromMuscleGroups(groups, input.name);
  }

  const split =
    input.split ??
    (input.name ? inferSplitFromWorkoutName(input.name) : null);

  if (split === 'A' || split === 'B') return 'upper';
  if (split === 'L') return 'lower';

  if (groups.length > 0) {
    return categoryFromMuscleGroups(groups, input.name);
  }

  if (input.name && matchesCoreOrAbsName(input.name)) return 'core';
  return 'other';
}

export function resolveWorkoutCardColor(input: {
  name?: string;
  split?: TrainingSplit | null;
  muscleGroups?: Iterable<string | null | undefined>;
  preferMuscleGroups?: boolean;
}): string {
  return workoutCardColorForCategory(resolveWorkoutCardColorCategory(input));
}
