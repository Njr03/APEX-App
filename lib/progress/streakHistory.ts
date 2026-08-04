import { differenceInCalendarDays, parseISO } from 'date-fns';

export interface StreakRun {
  length: number;
  endDate: string;
}

/** Consecutive training-day runs (gap > 1 calendar day starts a new run). */
export function computeStreakRuns(trainingDayKeys: string[]): StreakRun[] {
  const sorted = [...new Set(trainingDayKeys)].sort();
  if (sorted.length === 0) return [];

  const runs: StreakRun[] = [];
  let runStartIndex = 0;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = parseISO(sorted[index - 1]!);
    const current = parseISO(sorted[index]!);
    const gap = differenceInCalendarDays(current, previous);

    if (gap > 1) {
      runs.push({
        length: index - runStartIndex,
        endDate: sorted[index - 1]!,
      });
      runStartIndex = index;
    }
  }

  runs.push({
    length: sorted.length - runStartIndex,
    endDate: sorted[sorted.length - 1]!,
  });

  return runs;
}

export function streakBarOpacity(
  length: number,
  longestStreak: number,
): number {
  if (length <= 0) return 0.3;
  const threshold = Math.max(longestStreak * 0.8, 1);
  const ratio = Math.min(1, length / threshold);
  return 0.3 + ratio * 0.7;
}
