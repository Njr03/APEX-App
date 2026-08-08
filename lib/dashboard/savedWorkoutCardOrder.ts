import { parseISO, startOfWeek } from 'date-fns';

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

function latestWeekCompletionMs(
  card: DashboardCardRef,
  workouts: WorkoutHistoryRow[],
  weekStart: Date,
): number | null {
  const weekStartMs = weekStart.getTime();

  if (card.kind === 'routine') {
    const relevant = workouts.filter(
      (workout) =>
        workout.routine_id === card.routineId &&
        workout.completed_at &&
        parseISO(workout.completed_at).getTime() >= weekStartMs,
    );

    if (relevant.length === 0) return null;

    return Math.max(
      ...relevant.map((workout) => parseISO(workout.completed_at!).getTime()),
    );
  }

  const relevant = workouts.filter((workout) => {
    if (!workout.completed_at) return false;
    if (parseISO(workout.completed_at).getTime() < weekStartMs) return false;

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

/** Puts this week's completed sessions first, most recent at the front. */
export function reorderDashboardByWeekSessions(
  cards: DashboardCardRef[],
  workouts: WorkoutHistoryRow[],
): DashboardCardRef[] {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  return cards
    .map((card, index) => ({ card, index }))
    .sort((a, b) => {
      const aTime = latestWeekCompletionMs(a.card, workouts, weekStart);
      const bTime = latestWeekCompletionMs(b.card, workouts, weekStart);

      if (aTime != null && bTime != null) return bTime - aTime;
      if (aTime != null) return -1;
      if (bTime != null) return 1;
      return a.index - b.index;
    })
    .map(({ card }) => card);
}

export async function syncCompletedRoutineToDashboard(
  routineId: string,
  workouts: WorkoutHistoryRow[],
  store: {
    hydrate: () => Promise<void>;
    getCards: () => DashboardCardRef[];
    addCard: (card: DashboardCardRef) => Promise<void>;
    setCards: (cards: DashboardCardRef[]) => Promise<void>;
  },
) {
  await store.hydrate();

  const ref: DashboardCardRef = { kind: 'routine', routineId };
  const refKey = dashboardCardKey(ref);

  let cards = store.getCards();
  if (!cards.some((card) => dashboardCardKey(card) === refKey)) {
    await store.addCard(ref);
    cards = store.getCards();
  }

  await store.setCards(reorderDashboardByWeekSessions(cards, workouts));
}
