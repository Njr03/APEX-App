import { subWeeks } from 'date-fns';

import type { Exercise, Set, WorkoutExercise } from '@/lib/supabase';
import { calculateWorkoutVolume } from '@/lib/workout/volume';

export const MUSCLE_BALANCE_WEEKS = 4;
export const RADAR_AXIS_COUNT = 5;
/** Inner chart coordinate space (grid + data polygon). */
export const RADAR_CHART_SIZE = 200;
export const RADAR_CENTER = RADAR_CHART_SIZE / 2;
export const RADAR_MAX_RADIUS = 74;
export const RADAR_LABEL_RADIUS = RADAR_MAX_RADIUS * 1.12;
export const RADAR_LABEL_VALUE_GAP = 10;
export const RADAR_VIEW_PADDING = 4;
const RADAR_LABEL_CHAR_WIDTH = 5.1;

/** Radar + panel muscle groups (core excluded — tracked separately later). */
export const RADAR_MUSCLE_GROUPS = [
  { key: 'chest', label: 'CHEST' },
  { key: 'shoulders', label: 'SHOULDERS' },
  { key: 'arms', label: 'ARMS' },
  { key: 'legs', label: 'LEGS' },
  { key: 'back', label: 'BACK' },
] as const;

export type RadarMuscleKey = (typeof RADAR_MUSCLE_GROUPS)[number]['key'];

/** Monthly target volume (kg) per muscle group — used to normalize 4-week coverage to 0–100. */
export const MUSCLE_TARGET_VOLUME_KG: Record<RadarMuscleKey, number> = {
  chest: 12_000,
  shoulders: 8_000,
  arms: 10_000,
  legs: 20_000,
  back: 15_000,
};

export interface MuscleBalancePoint {
  label: string;
  key: RadarMuscleKey;
  value: number;
  volume: number;
}

export type WorkoutForMuscleBalance = {
  status: string;
  workout_exercises?: (Pick<WorkoutExercise, 'id'> & {
    exercise: Pick<Exercise, 'muscle_group'> | null;
    sets?: Pick<Set, 'weight' | 'reps' | 'is_warmup' | 'completed_at'>[] | null;
  })[];
};

export function muscleBalanceQueryStart(referenceDate = new Date()): string {
  return subWeeks(referenceDate, MUSCLE_BALANCE_WEEKS).toISOString();
}

export function radarAngle(index: number): number {
  return (index / RADAR_AXIS_COUNT) * 360 - 90;
}

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  index: number,
): { x: number; y: number } {
  const angleRad = (radarAngle(index) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

export function radarPolygonPoints(
  scale: number,
  cx = RADAR_CENTER,
  cy = RADAR_CENTER,
  maxRadius = RADAR_MAX_RADIUS,
): string {
  return Array.from({ length: RADAR_AXIS_COUNT }, (_, index) => {
    const { x, y } = polarToCartesian(cx, cy, maxRadius * scale, index);
    return `${x},${y}`;
  }).join(' ');
}

export function radarDataPolygonPoints(
  values: number[],
  cx = RADAR_CENTER,
  cy = RADAR_CENTER,
  maxRadius = RADAR_MAX_RADIUS,
): string {
  return values
    .map((value, index) => {
      const radius = (Math.min(100, Math.max(0, value)) / 100) * maxRadius;
      const { x, y } = polarToCartesian(cx, cy, radius, index);
      return `${x},${y}`;
    })
    .join(' ');
}

export function radarLabelAnchor(x: number, cx = RADAR_CENTER): 'start' | 'middle' | 'end' {
  if (x > cx + 4) return 'start';
  if (x < cx - 4) return 'end';
  return 'middle';
}

export function estimateRadarViewBox(
  labels: readonly string[] = RADAR_MUSCLE_GROUPS.map((group) => group.label),
): { minX: number; minY: number; width: number; height: number } {
  let minX = RADAR_CENTER - RADAR_MAX_RADIUS;
  let maxX = RADAR_CENTER + RADAR_MAX_RADIUS;
  let minY = RADAR_CENTER - RADAR_MAX_RADIUS;
  let maxY = RADAR_CENTER + RADAR_MAX_RADIUS;

  for (let index = 0; index < labels.length; index += 1) {
    const label = labels[index]!;
    const { x, y } = polarToCartesian(
      RADAR_CENTER,
      RADAR_CENTER,
      RADAR_LABEL_RADIUS,
      index,
    );
    const anchor = radarLabelAnchor(x);
    const rowWidth = Math.max(label.length, 4) * RADAR_LABEL_CHAR_WIDTH;

    let left = x;
    let right = x;

    if (anchor === 'middle') {
      left -= rowWidth / 2;
      right += rowWidth / 2;
    } else if (anchor === 'start') {
      right += rowWidth;
    } else {
      left -= rowWidth;
    }

    const top = y - 9;
    const bottom = y + RADAR_LABEL_VALUE_GAP + 10;

    minX = Math.min(minX, left);
    maxX = Math.max(maxX, right);
    minY = Math.min(minY, top);
    maxY = Math.max(maxY, bottom);
  }

  const pad = RADAR_VIEW_PADDING;

  return {
    minX: minX - pad,
    minY: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}

export function computeMuscleBalance(
  workouts: WorkoutForMuscleBalance[],
  targets: Record<RadarMuscleKey, number> = MUSCLE_TARGET_VOLUME_KG,
): MuscleBalancePoint[] {
  const volumes: Record<RadarMuscleKey, number> = {
    chest: 0,
    shoulders: 0,
    arms: 0,
    legs: 0,
    back: 0,
  };

  for (const workout of workouts) {
    if (workout.status !== 'completed') continue;

    for (const workoutExercise of workout.workout_exercises ?? []) {
      const muscleGroup = workoutExercise.exercise?.muscle_group;
      if (!muscleGroup || !(muscleGroup in volumes)) continue;

      const volume = calculateWorkoutVolume(workoutExercise.sets ?? []);
      volumes[muscleGroup as RadarMuscleKey] += volume;
    }
  }

  return RADAR_MUSCLE_GROUPS.map(({ key, label }) => {
    const target = targets[key];
    const volume = volumes[key];
    const value = Math.min(100, Math.round((volume / target) * 100));

    return { label, key, value, volume };
  });
}

export function getMuscleDotColor(value: number): string {
  if (value >= 80) return '#c8ff5a';
  if (value >= 60) return '#f5c842';
  return '#ff5f5f';
}

export function getMuscleTextColor(value: number, muted: string): string {
  return value < 60 ? '#ff5f5f' : muted;
}

export function getMuscleBarFillColor(value: number, muted: string): string {
  if (value < 60) return '#ff5f5f';
  if (value >= 85) return '#c8ff5a';
  return muted;
}
