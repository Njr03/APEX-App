import { differenceInDays, parseISO } from 'date-fns';

import { MUSCLE_GROUPS, type MuscleGroup, type RecordType } from '@/lib/constants/training';
import { estimateOneRepMax, formatRecordTypeLabel } from '@/lib/personalRecords';
import type { PersonalRecord } from '@/lib/supabase';
import { formatMuscleGroupLabel } from '@/lib/training/targetMuscles';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import { formatExerciseScheme } from '@/lib/workout/formatSessionVolume';
import { kgToDisplay, weightUnitLabel } from '@/lib/units';

export interface RecentPRWorkoutContext {
  name: string | null;
  routine_id: string | null;
}

export interface RecentPRRawRow extends PersonalRecord {
  exercise: { name: string; muscle_group: string };
  set: {
    weight: number | null;
    reps: number | null;
    set_number: number;
    workout_exercise_id: string;
    workout_exercise: {
      workout: RecentPRWorkoutContext | null;
    } | null;
  } | null;
}

export interface DashboardRecentPR {
  id: string;
  exerciseId: string;
  exerciseName: string;
  recordType: RecordType;
  value: number;
  achievedAt: string;
  splitLabel: string;
  splitColor: string;
  timeAgo: string;
  displayValue: string;
  weightDisplayValue: string;
  improvementLabel: string | null;
  sets: number;
  reps: number | null;
  weightKg: number | null;
}

export interface DashboardPRLine {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  recordType: RecordType;
  displayValue: string;
  achievedAt: string;
  timeAgo: string;
  splitLabel: string;
  splitColor: string;
}

export interface GroupedExercisePRs {
  exerciseId: string;
  exerciseName: string;
  records: DashboardPRLine[];
}

export interface GroupedMusclePRs {
  muscleGroup: MuscleGroup;
  label: string;
  exercises: GroupedExercisePRs[];
}

const RECORD_TYPE_ORDER: RecordType[] = [
  'max_weight',
  'est_1rm',
  'max_reps',
  'max_volume',
];

function normalizeMuscleGroup(value: string): MuscleGroup {
  if ((MUSCLE_GROUPS as readonly string[]).includes(value)) {
    return value as MuscleGroup;
  }
  return 'full_body';
}

function recordTypeSortIndex(recordType: RecordType): number {
  const index = RECORD_TYPE_ORDER.indexOf(recordType);
  return index === -1 ? RECORD_TYPE_ORDER.length : index;
}

export const DASHBOARD_RECENT_PR_SLOT_COUNT = 4;
export const DASHBOARD_RECENT_PR_FETCH_LIMIT = 100;

const DEFAULT_SPLIT_COLOR = 'rgba(240,237,232,0.35)';
const DEFAULT_SPLIT_LABEL = 'Training';

function resolveSplitMeta(workoutName: string | null | undefined): {
  label: string;
  color: string;
} {
  const split = workoutName ? inferSplitFromWorkoutName(workoutName) : null;

  if (!split) {
    return { label: DEFAULT_SPLIT_LABEL, color: DEFAULT_SPLIT_COLOR };
  }

  const definition = SPLIT_DEFINITIONS[split as TrainingSplit];
  return { label: definition.name, color: definition.color };
}

export function formatPRTimeAgo(achievedAt: string): string {
  const days = differenceInDays(new Date(), parseISO(achievedAt));

  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function formatDashboardPRWeight(
  weightKg: number | null | undefined,
  unit: 'kg' | 'lb',
): string | null {
  if (weightKg == null || weightKg <= 0) return null;
  return `${kgToDisplay(weightKg, unit)} ${weightUnitLabel(unit)}`;
}

export function formatDashboardPRValue(
  recordType: RecordType,
  value: number,
  unit: 'kg' | 'lb',
): string {
  switch (recordType) {
    case 'max_reps':
      return `${Math.round(value)} reps`;
    case 'est_1rm':
      return `~${kgToDisplay(value, unit)} ${weightUnitLabel(unit)} 1RM`;
    case 'max_weight':
      return `${kgToDisplay(value, unit)} ${weightUnitLabel(unit)}`;
    case 'max_volume':
      return `${kgToDisplay(value, unit)} ${weightUnitLabel(unit)}`;
    default:
      return `${value.toFixed(1)}`;
  }
}

export function formatPRImprovement(
  recordType: RecordType,
  value: number,
  previousValue: number | null,
  unit: 'kg' | 'lb',
): string | null {
  if (previousValue == null || value <= previousValue) return null;

  const delta = value - previousValue;

  switch (recordType) {
    case 'max_reps':
      return `+${Math.round(delta)} reps`;
    case 'max_weight':
    case 'est_1rm':
    case 'max_volume':
      return `+${kgToDisplay(delta, unit)} ${weightUnitLabel(unit)}`;
    default:
      return null;
  }
}

function pickRepresentativePRForExercise(rows: RecentPRRawRow[]): RecentPRRawRow {
  const sorted = [...rows].sort((a, b) => b.achieved_at.localeCompare(a.achieved_at));
  const latestAt = sorted[0]?.achieved_at;
  if (!latestAt) return sorted[0];

  const latestRows = sorted.filter((row) => row.achieved_at === latestAt);
  return (
    latestRows.find((row) => row.record_type === 'est_1rm') ??
    latestRows.find((row) => row.record_type === 'max_weight') ??
    latestRows[0]
  );
}

/** One PR card per exercise — most recent achievement, best set scheme for display. */
export function dedupeRecentPRsByExercise(
  rows: RecentPRRawRow[],
  limit = DASHBOARD_RECENT_PR_SLOT_COUNT,
): RecentPRRawRow[] {
  const grouped = new Map<string, RecentPRRawRow[]>();

  for (const row of rows) {
    const group = grouped.get(row.exercise_id) ?? [];
    group.push(row);
    grouped.set(row.exercise_id, group);
  }

  return Array.from(grouped.values())
    .map(pickRepresentativePRForExercise)
    .sort((a, b) => b.achieved_at.localeCompare(a.achieved_at))
    .slice(0, limit);
}

function resolveEst1rmValue(row: RecentPRRawRow): number {
  if (row.record_type === 'est_1rm') return row.value;

  const weight = row.set?.weight ?? 0;
  const reps = row.set?.reps ?? 0;
  if (weight > 0 && reps > 0) return estimateOneRepMax(weight, reps);

  return row.value;
}

export function mapPRLine(row: RecentPRRawRow, unit: 'kg' | 'lb'): DashboardPRLine {
  const workoutName = row.set?.workout_exercise?.workout?.name ?? null;
  const { label, color } = resolveSplitMeta(workoutName);

  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise.name,
    muscleGroup: normalizeMuscleGroup(row.exercise.muscle_group),
    recordType: row.record_type,
    displayValue: formatDashboardPRValue(row.record_type, row.value, unit),
    achievedAt: row.achieved_at,
    timeAgo: formatPRTimeAgo(row.achieved_at),
    splitLabel: label,
    splitColor: color,
  };
}

export function groupPRsByMuscleAndExercise(lines: DashboardPRLine[]): GroupedMusclePRs[] {
  const byMuscle = new Map<MuscleGroup, Map<string, DashboardPRLine[]>>();

  for (const line of lines) {
    const muscleMap = byMuscle.get(line.muscleGroup) ?? new Map<string, DashboardPRLine[]>();
    const exerciseLines = muscleMap.get(line.exerciseId) ?? [];
    exerciseLines.push(line);
    muscleMap.set(line.exerciseId, exerciseLines);
    byMuscle.set(line.muscleGroup, muscleMap);
  }

  return MUSCLE_GROUPS.flatMap((muscleGroup) => {
    const muscleMap = byMuscle.get(muscleGroup);
    if (!muscleMap || muscleMap.size === 0) return [];

    const exercises = Array.from(muscleMap.entries())
      .map(([exerciseId, records]) => ({
        exerciseId,
        exerciseName: records[0]?.exerciseName ?? 'Exercise',
        records: [...records].sort(
          (a, b) => recordTypeSortIndex(a.recordType) - recordTypeSortIndex(b.recordType),
        ),
      }))
      .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName));

    return [
      {
        muscleGroup,
        label: formatMuscleGroupLabel(muscleGroup),
        exercises,
      },
    ];
  });
}

export function formatPRLineSummary(line: DashboardPRLine): string {
  return `${line.displayValue} · ${formatRecordTypeLabel(line.recordType)} · ${line.timeAgo}`;
}

export function mapRecentPRRow(
  row: RecentPRRawRow,
  unit: 'kg' | 'lb',
  previousEst1rm: number | null,
  setCount: number,
): DashboardRecentPR {
  const workoutName = row.set?.workout_exercise?.workout?.name ?? null;
  const { label, color } = resolveSplitMeta(workoutName);
  const weightKg = row.set?.weight ?? null;
  const reps = row.set?.reps ?? null;
  const sets = setCount > 0 ? setCount : row.set?.set_number ?? 1;
  const displayValue =
    weightKg != null || reps != null
      ? formatExerciseScheme(sets, reps, weightKg, unit)
      : formatDashboardPRValue(row.record_type, row.value, unit);
  const weightDisplayValue =
    formatDashboardPRWeight(weightKg, unit) ??
    (row.record_type === 'max_weight'
      ? formatDashboardPRValue('max_weight', row.value, unit)
      : '—');
  const improvementLabel = formatPRImprovement(
    'est_1rm',
    resolveEst1rmValue(row),
    previousEst1rm,
    unit,
  );

  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise.name,
    recordType: row.record_type,
    value: row.value,
    achievedAt: row.achieved_at,
    splitLabel: label,
    splitColor: color,
    timeAgo: formatPRTimeAgo(row.achieved_at),
    displayValue,
    weightDisplayValue,
    improvementLabel,
    sets,
    reps,
    weightKg,
  };
}

export const RECENT_PR_SELECT = `
  *,
  exercise:exercises!inner ( name, muscle_group ),
  set:sets (
    weight,
    reps,
    set_number,
    workout_exercise_id,
    workout_exercise:workout_exercises (
      workout:workouts ( name, routine_id )
    )
  )
`;
