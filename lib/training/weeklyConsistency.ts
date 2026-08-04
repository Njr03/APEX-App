import {
  endOfWeek,
  isWithinInterval,
  parseISO,
  startOfWeek,
  subWeeks,
} from 'date-fns';

import { inferSplitFromWorkoutName, SPLIT_DEFINITIONS, type TrainingSplit } from '@/lib/training/splits';
import type { Workout } from '@/lib/supabase';

export const WEEKLY_CONSISTENCY_WEEKS = 8;
export const SPLIT_CELL_ORDER: TrainingSplit[] = ['A', 'B', 'L'];

export interface WeeklyConsistencyEntry {
  week: string;
  weekIndex: number;
  weekStart: string;
  weekEnd: string;
  A: boolean;
  B: boolean;
  L: boolean;
}

export interface WeeklyConsistencySummary {
  perfectWeeks: number;
  adherencePercent: number;
  label: string;
}

export function buildWeeklyConsistencyEntries(
  workouts: Workout[],
  referenceDate = new Date(),
): WeeklyConsistencyEntry[] {
  const completed = workouts.filter((workout) => workout.status === 'completed');

  return Array.from({ length: WEEKLY_CONSISTENCY_WEEKS }, (_, index) => {
    const weeksAgo = WEEKLY_CONSISTENCY_WEEKS - 1 - index;
    const weekStart = startOfWeek(subWeeks(referenceDate, weeksAgo), {
      weekStartsOn: 1,
    });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const splits = new Set<TrainingSplit>();

    for (const workout of completed) {
      const startedAt = parseISO(workout.started_at);
      if (!isWithinInterval(startedAt, { start: weekStart, end: weekEnd })) {
        continue;
      }

      const split = inferSplitFromWorkoutName(workout.name);
      if (split) {
        splits.add(split);
      }
    }

    return {
      week: `W${index + 1}`,
      weekIndex: index + 1,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      A: splits.has('A'),
      B: splits.has('B'),
      L: splits.has('L'),
    };
  });
}

export function summarizeWeeklyConsistency(
  entries: WeeklyConsistencyEntry[],
): WeeklyConsistencySummary {
  const perfectWeeks = entries.filter(
    (entry) => entry.A && entry.B && entry.L,
  ).length;
  const adherencePercent = Math.round(
    (perfectWeeks / entries.length) * 100,
  );

  return {
    perfectWeeks,
    adherencePercent,
    label: `${perfectWeeks}/${entries.length} perfect weeks · ${adherencePercent}% adherence`,
  };
}

export function formatWeeklyConsistencyTooltip(entry: WeeklyConsistencyEntry): string {
  const formatSplit = (label: string, completed: boolean) =>
    `${label} ${completed ? '✓' : '✗'}${completed ? '' : ' (missed)'}`;

  return `${entry.week}: ${formatSplit('Upper A', entry.A)}, ${formatSplit('Upper B', entry.B)}, ${formatSplit('Legs', entry.L)}`;
}

export function splitCellColor(split: TrainingSplit, completed: boolean): string {
  if (!completed) {
    return 'rgba(27,27,53,0.5)';
  }

  const hex = SPLIT_DEFINITIONS[split].color.replace('#', '');
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},0.85)`;
}

export function weeklyConsistencyQueryStart(referenceDate = new Date()): string {
  return startOfWeek(subWeeks(referenceDate, WEEKLY_CONSISTENCY_WEEKS - 1), {
    weekStartsOn: 1,
  }).toISOString();
}
