import { differenceInCalendarWeeks, parseISO, startOfWeek } from 'date-fns';

/** Weeks since the user's profile was created (1-indexed). */
export function getCurrentWeekNumber(createdAt: string, now = new Date()): number {
  const created = parseISO(createdAt);
  const createdWeek = startOfWeek(created, { weekStartsOn: 1 });
  const currentWeek = startOfWeek(now, { weekStartsOn: 1 });
  return Math.max(1, differenceInCalendarWeeks(currentWeek, createdWeek) + 1);
}
