import type { DashboardCardRef } from '@/lib/dashboard/dashboardCards';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';

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
