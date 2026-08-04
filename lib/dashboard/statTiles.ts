import {
  differenceInCalendarWeeks,
  startOfWeek,
  startOfYear,
} from 'date-fns';

const KG_TO_LB = 2.20462;

export type StatDeltaTone = 'positive' | 'negative' | 'neutral';

export function formatStatVolumeK(
  volumeKg: number,
  unit: 'kg' | 'lb',
): { value: string; unit: string } {
  const amount = unit === 'lb' ? volumeKg * KG_TO_LB : volumeKg;

  if (amount >= 1000) {
    return {
      value: `${(amount / 1000).toFixed(1)}k`,
      unit: ` ${unit}`,
    };
  }

  const rounded = Math.round(amount * 10) / 10;
  const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);

  return { value, unit: ` ${unit}` };
}

export function formatVolumeDeltaPercent(deltaPercent: number | null): {
  label: string;
  tone: StatDeltaTone;
} {
  if (deltaPercent == null) {
    return { label: 'No prior week data', tone: 'neutral' };
  }

  const sign = deltaPercent > 0 ? '+' : '';
  return {
    label: `${sign}${deltaPercent.toFixed(1)}% vs last week`,
    tone: deltaPercent >= 0 ? 'positive' : 'negative',
  };
}

export function formatStreakDelta(params: {
  currentStreak: number;
  longestStreak: number;
  trainingDaysThisWeek: number;
}): { label: string; tone: StatDeltaTone } {
  const { currentStreak, longestStreak, trainingDaysThisWeek } = params;

  if (currentStreak > 0 && currentStreak >= longestStreak) {
    return { label: 'Personal best', tone: 'positive' };
  }

  if (trainingDaysThisWeek > 0) {
    return {
      label: `+${trainingDaysThisWeek} this week`,
      tone: 'positive',
    };
  }

  if (longestStreak > currentStreak) {
    return {
      label: `${longestStreak - currentStreak} from best`,
      tone: 'negative',
    };
  }

  return { label: 'Start today', tone: 'neutral' };
}

export function getPlannedSessionsYtd(referenceDate = new Date()): number {
  const yearStart = startOfYear(referenceDate);
  const weeksElapsed =
    differenceInCalendarWeeks(
      startOfWeek(referenceDate, { weekStartsOn: 1 }),
      startOfWeek(yearStart, { weekStartsOn: 1 }),
    ) + 1;

  return weeksElapsed * 3;
}
