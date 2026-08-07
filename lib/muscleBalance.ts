import { subWeeks } from 'date-fns';

import type { Exercise, Set, WorkoutExercise } from '@/lib/supabase';
import { calculateWorkoutVolume } from '@/lib/workout/volume';

export const MUSCLE_BALANCE_WEEKS = 4;
export const RADAR_AXIS_COUNT = 5;
/** Inner chart diameter (grid + data polygon). */
export const RADAR_CHART_SIZE = 200;
/** Extra SVG padding so axis labels (e.g. SHOULDERS, BACK) are not clipped. */
export const RADAR_LABEL_INSET = 34;
export const RADAR_VIEW_SIZE = RADAR_CHART_SIZE + RADAR_LABEL_INSET * 2;
export const RADAR_VIEW_ORIGIN = -RADAR_LABEL_INSET;
/** Rendered SVG dimensions — matches expanded viewBox. */
export const RADAR_SIZE = RADAR_VIEW_SIZE;
export const RADAR_CENTER = RADAR_CHART_SIZE / 2;
export const RADAR_MAX_RADIUS = 66;
export const RADAR_LABEL_RADIUS = RADAR_MAX_RADIUS * 1.32;

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
