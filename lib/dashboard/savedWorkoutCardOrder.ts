import { parseISO } from 'date-fns';

import type { DashboardCardRef } from '@/lib/dashboard/dashboardCards';
import { dashboardCardKey } from '@/lib/dashboard/dashboardCards';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import type { WorkoutHistoryRow } from '@/hooks/queries/useProgressStats';
import { resolveWorkoutSplit } from '@/lib/training/splits';

export function sortRoutinesByDashboardOrder(
  routines: RoutineSummary[],
  cards: DashboardCardRef[],
): RoutineSummary[] {
  const byId = new Map(routines.map((routine) => [routine.id, routine]));
  const ordered: RoutineSummary[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    if (card.kind !== 'routine') continue;

    const routine = byId.get(card.routineId);
    if (!routine || seen.has(routine.id)) continue;

    ordered.push(routine);
    seen.add(routine.id);
  }

  for (const routine of routines) {
    if (!seen.has(routine.id)) {
      ordered.push(routine);
    }
  }

  return ordered;
}


export function applySavedWorkoutOrderToDashboardCards(
  cards: DashboardCardRef[],
  orderedRoutineIds: string[],
): DashboardCardRef[] {
  const routineCards = new Map(
    cards
      .filter(
        (card): card is Extract<DashboardCardRef, { kind: 'routine' }> =>
          card.kind === 'routine',
      )
      .map((card) => [card.routineId, card]),
  );

  const orderedRoutineCards: DashboardCardRef[] = [];
  const seenRoutineIds = new Set<string>();

  for (const routineId of orderedRoutineIds) {
    if (seenRoutineIds.has(routineId)) continue;

    seenRoutineIds.add(routineId);
    orderedRoutineCards.push(
      routineCards.get(routineId) ?? { kind: 'routine', routineId },
    );
  }

  for (const [routineId, card] of routineCards) {
    if (!seenRoutineIds.has(routineId)) {
      orderedRoutineCards.push(card);
    }
  }

  let routineIndex = 0;
  const merged: DashboardCardRef[] = [];

  for (const card of cards) {
    if (card.kind === 'split') {
      merged.push(card);
      continue;
    }

    if (routineIndex < orderedRoutineCards.length) {
      merged.push(orderedRoutineCards[routineIndex]!);
      routineIndex += 1;
    }
  }

  while (routineIndex < orderedRoutineCards.length) {
    merged.push(orderedRoutineCards[routineIndex]!);
    routineIndex += 1;
  }

  return merged;
}

function latestCompletionMs(
  card: DashboardCardRef,
  workouts: WorkoutHistoryRow[],
): number | null {
  if (card.kind === 'routine') {
    const relevant = workouts.filter(
      (workout) => workout.routine_id === card.routineId && workout.completed_at,
    );

    if (relevant.length === 0) return null;

    return Math.max(
      ...relevant.map((workout) => parseISO(workout.completed_at!).getTime()),
    );
  }

  const relevant = workouts.filter((workout) => {
    if (!workout.completed_at) return false;

    return (
      resolveWorkoutSplit({
        name: workout.name,
      }) === card.split
    );
  });

  if (relevant.length === 0) return null;

  return Math.max(
    ...relevant.map((workout) => parseISO(workout.completed_at!).getTime()),
  );
}

/** Adds saved workouts that have at least one completed session. */
export function ensureCompletedRoutinesOnDashboard(
  cards: DashboardCardRef[],
  workouts: WorkoutHistoryRow[],
): DashboardCardRef[] {
  const completedRoutineIds = new Set<string>();

  for (const workout of workouts) {
    if (workout.routine_id && workout.completed_at) {
      completedRoutineIds.add(workout.routine_id);
    }
  }

  const next = [...cards];

  for (const routineId of completedRoutineIds) {
    const ref: DashboardCardRef = { kind: 'routine', routineId };
    const key = dashboardCardKey(ref);

    if (!next.some((card) => dashboardCardKey(card) === key)) {
      next.push(ref);
    }
  }

  return next;
}

/** Puts completed cards first, ordered by most recent session. */
export function reorderDashboardByRecentCompletions(
  cards: DashboardCardRef[],
  workouts: WorkoutHistoryRow[],
): DashboardCardRef[] {
  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const aTime = latestCompletionMs(a.card, workouts);
      const bTime = latestCompletionMs(b.card, workouts);

      if (aTime != null && bTime != null) return bTime - aTime;
      if (aTime != null) return -1;
      if (bTime != null) return 1;
      return a.index - b.index;
    })
    .map(({ card }) => card);
}

export async function syncDashboardFromWorkoutHistory(
  workouts: WorkoutHistoryRow[],
  store: {
    hydrate: () => Promise<void>;
    getCards: () => DashboardCardRef[];
    setCards: (cards: DashboardCardRef[]) => Promise<void>;
  },
) {
  await store.hydrate();

  const cards = reorderDashboardByRecentCompletions(
    ensureCompletedRoutinesOnDashboard(store.getCards(), workouts),
    workouts,
  );

  await store.setCards(cards);
}
