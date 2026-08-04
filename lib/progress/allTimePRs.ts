import type { RecordType } from '@/lib/constants/training';
import type { PersonalRecord } from '@/lib/supabase';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import { kgToDisplay } from '@/lib/units';

export interface AllTimePRWorkoutContext {
  name: string | null;
  routine_id: string | null;
}

export interface AllTimePRRawRow extends PersonalRecord {
  exercise: { name: string };
  set: {
    workout_exercise: {
      workout: AllTimePRWorkoutContext | null;
    } | null;
  } | null;
}

export interface AllTimePRRow {
  id: string;
  exerciseName: string;
  recordType: RecordType;
  value: number;
  achievedAt: string;
  splitColor: string;
  displayValue: string;
}

const DEFAULT_SPLIT_COLOR = 'rgba(240,237,232,0.35)';

export function resolvePRSplitColor(workoutName: string | null | undefined): string {
  const split = workoutName ? inferSplitFromWorkoutName(workoutName) : null;
  if (!split) return DEFAULT_SPLIT_COLOR;
  return SPLIT_DEFINITIONS[split as TrainingSplit].color;
}

export function formatAllTimePRValue(
  recordType: RecordType,
  value: number,
  unit: 'kg' | 'lb' = 'kg',
): string {
  switch (recordType) {
    case 'max_reps':
      return `${Math.round(value)} reps`;
    case 'est_1rm':
      return `~${kgToDisplay(value, unit)} ${unit} 1RM`;
    case 'max_volume':
      return `${kgToDisplay(value, unit)} ${unit} vol`;
    case 'max_weight':
      return `${kgToDisplay(value, unit)} ${unit}`;
    default:
      return `${value.toFixed(1)}`;
  }
}

export function mapAllTimePRRow(
  row: AllTimePRRawRow,
  unit: 'kg' | 'lb' = 'kg',
): AllTimePRRow {
  const workoutName = row.set?.workout_exercise?.workout?.name ?? null;

  return {
    id: row.id,
    exerciseName: row.exercise.name,
    recordType: row.record_type,
    value: row.value,
    achievedAt: row.achieved_at,
    splitColor: resolvePRSplitColor(workoutName),
    displayValue: formatAllTimePRValue(row.record_type, row.value, unit),
  };
}

export const ALL_TIME_PR_SELECT = `
  *,
  exercise:exercises ( name ),
  set:sets (
    workout_exercise:workout_exercises (
      workout:workouts ( name, routine_id )
    )
  )
`;
