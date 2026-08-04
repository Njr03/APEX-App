import type { TrainingSplit } from '@/lib/training/splits';

export interface KeyLiftDefinition {
  exerciseName: string;
  label: string;
  shortLabel: string;
  color: string;
  split: TrainingSplit;
}

export const KEY_LIFTS: KeyLiftDefinition[] = [
  {
    exerciseName: 'Barbell Bench Press',
    label: 'Bench Press',
    shortLabel: 'BENCH',
    color: '#ff8c42',
    split: 'A',
  },
  {
    exerciseName: 'Overhead Press',
    label: 'Overhead Press',
    shortLabel: 'OHP',
    color: '#38d9f5',
    split: 'B',
  },
  {
    exerciseName: 'Back Squat',
    label: 'Barbell Squat',
    shortLabel: 'SQUAT',
    color: '#b06bff',
    split: 'L',
  },
  {
    exerciseName: 'Barbell Row',
    label: 'Barbell Row',
    shortLabel: 'ROW',
    color: '#38d9f5',
    split: 'B',
  },
];

export interface KeyLiftProgressionRow {
  definition: KeyLiftDefinition;
  exerciseId: string;
  history: number[];
  currentMax: number;
  deltaKg: number;
}

export function computeHistoryDelta(history: number[]): number {
  if (history.length < 2) return 0;
  const first = history[0] ?? 0;
  const last = history[history.length - 1] ?? 0;
  return Math.round((last - first) * 10) / 10;
}

export function formatHistoryDelta(deltaKg: number): string {
  const sign = deltaKg >= 0 ? '+' : '';
  return `${sign}${deltaKg.toFixed(1)} kg in 8 weeks`;
}
