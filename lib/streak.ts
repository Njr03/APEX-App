import {
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
} from 'date-fns';

/** Normalize any timestamp to a local calendar-day key (yyyy-MM-dd). */
export function toCalendarDayKey(date: Date | string): string {
  const value = typeof date === 'string' ? parseISO(date) : date;
  return format(startOfDay(value), 'yyyy-MM-dd');
}

export type StreakStatus = 'active' | 'at_risk' | 'broken';

export interface StreakDisplayState {
  /** Streak count shown in the UI (may differ from stored value if expired). */
  streak: number;
  status: StreakStatus;
  daysSinceLastWorkout: number | null;
  message: string;
}

/**
 * Streak rules (local calendar days — uses device timezone via date-fns):
 *
 * - First ever completion → streak = 1
 * - Same day as last completion → streak unchanged
 * - 1 day gap → consecutive day, streak + 1
 * - 2 day gap → 1-day grace buffer, streak + 1 if user trains today
 * - 3+ day gap → streak resets to 1 on next completion (display as broken until then)
 */
export function calculateStreakUpdate(
  currentStreak: number,
  lastCompletedAt: string | null,
  completedAt: Date = new Date(),
): number {
  if (!lastCompletedAt) {
    return 1;
  }

  const gap = differenceInCalendarDays(
    startOfDay(completedAt),
    startOfDay(parseISO(lastCompletedAt)),
  );

  if (gap <= 0) {
    return Math.max(currentStreak, 1);
  }

  if (gap === 1 || gap === 2) {
    return Math.max(currentStreak, 0) + 1;
  }

  return 1;
}

export function calculateLongestStreak(
  currentLongest: number,
  newCurrent: number,
): number {
  return Math.max(currentLongest, newCurrent);
}

/**
 * Derives UI streak state from the last completed workout date.
 * Stored profile.current_streak may be stale if the user hasn't opened the app
 * after missing days — this keeps the dashboard honest.
 */
export function getStreakDisplayState(
  storedStreak: number,
  lastCompletedAt: string | null,
  referenceDate: Date = new Date(),
): StreakDisplayState {
  if (!lastCompletedAt) {
    return {
      streak: 0,
      status: 'broken',
      daysSinceLastWorkout: null,
      message: 'Complete a workout to start your streak.',
    };
  }

  const gap = differenceInCalendarDays(
    startOfDay(referenceDate),
    startOfDay(parseISO(lastCompletedAt)),
  );

  if (gap <= 0) {
    return {
      streak: Math.max(storedStreak, 1),
      status: 'active',
      daysSinceLastWorkout: 0,
      message: 'Trained today — streak locked in.',
    };
  }

  if (gap === 1) {
    return {
      streak: storedStreak,
      status: 'active',
      daysSinceLastWorkout: 1,
      message: 'Train today to extend your streak.',
    };
  }

  if (gap === 2) {
    return {
      streak: storedStreak,
      status: 'at_risk',
      daysSinceLastWorkout: 2,
      message: 'Grace day — train today or your streak resets.',
    };
  }

  return {
    streak: 0,
    status: 'broken',
    daysSinceLastWorkout: gap,
    message: 'Streak reset — start fresh today.',
  };
}

/** Recompute streak from unique local training days (for validation/sync). */
export function calculateStreakFromCalendarDays(dayKeys: string[]): number {
  if (dayKeys.length === 0) return 0;

  const uniqueDays = [...new Set(dayKeys)].sort();
  let streak = 1;
  let best = 1;

  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prev = parseISO(uniqueDays[i - 1]!);
    const curr = parseISO(uniqueDays[i]!);
    const gap = differenceInCalendarDays(curr, prev);

    if (gap === 1) {
      streak += 1;
    } else if (gap === 2) {
      streak += 1;
    } else {
      streak = 1;
    }

    best = Math.max(best, streak);
  }

  return best;
}
