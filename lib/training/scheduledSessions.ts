import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getISODay,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameWeek,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import type { WeekSplitCardData } from '@/hooks/useThisWeekSplits';
import {
  SPLIT_DEFINITIONS,
  WEEKLY_SPLIT_ORDER,
  getSplitWorkoutName,
  type TrainingSplit,
} from '@/lib/training/splits';
import type { Workout } from '@/lib/supabase';

export type SessionListItem =
  | { type: 'completed'; workout: Workout }
  | { type: 'upcoming'; split: TrainingSplit; date: Date };

export function getSplitForIsoDay(isoDay: number): TrainingSplit | null {
  return (
    WEEKLY_SPLIT_ORDER.find(
      (split) => SPLIT_DEFINITIONS[split].scheduledDay === isoDay,
    ) ?? null
  );
}

export function getSessionsForDate(
  date: Date,
  workouts: Workout[],
  cards: WeekSplitCardData[],
): SessionListItem[] {
  const completed = workouts
    .filter(
      (workout) =>
        workout.status === 'completed' &&
        isSameDay(parseISO(workout.started_at), date),
    )
    .map((workout) => ({ type: 'completed' as const, workout }));

  const today = startOfDay(new Date());
  const split = getSplitForIsoDay(getISODay(date));

  if (!split) return completed;

  const card = cards.find((entry) => entry.definition.id === split);
  if (!card || card.status === 'completed') return completed;

  const isFutureOrToday = !isBefore(date, today);
  const isCurrentWeek = isSameWeek(date, new Date(), { weekStartsOn: 1 });

  if (isCurrentWeek && isFutureOrToday) {
    return [...completed, { type: 'upcoming' as const, split, date }];
  }

  if (isAfter(date, today) && !isCurrentWeek) {
    return [...completed, { type: 'upcoming' as const, split, date }];
  }

  return completed;
}

export function buildCalendarDayMarkers(
  month: Date,
  workouts: Workout[],
  cards: WeekSplitCardData[],
): {
  trainingDays: Set<string>;
  upcomingDaysBySplit: Map<string, TrainingSplit>;
} {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const trainingDays = new Set<string>();
  const upcomingDaysBySplit = new Map<string, TrainingSplit>();

  for (const date of days) {
    if (!isSameMonth(date, month)) continue;

    const key = format(date, 'yyyy-MM-dd');
    const sessions = getSessionsForDate(date, workouts, cards);

    if (sessions.some((session) => session.type === 'completed')) {
      trainingDays.add(key);
    }

    const upcoming = sessions.find((session) => session.type === 'upcoming');
    if (upcoming && upcoming.type === 'upcoming') {
      upcomingDaysBySplit.set(key, upcoming.split);
    }
  }

  return { trainingDays, upcomingDaysBySplit };
}

export function getUpcomingSessionLabel(split: TrainingSplit): string {
  return getSplitWorkoutName(split);
}
