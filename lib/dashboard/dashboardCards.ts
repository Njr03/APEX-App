import {
  SPLIT_DEFINITIONS,
  WEEKLY_SPLIT_ORDER,
  type TrainingSplit,
} from '@/lib/training/splits';

export type DashboardCardRef =
  | { kind: 'split'; split: TrainingSplit }
  | { kind: 'routine'; routineId: string };

export const DEFAULT_DASHBOARD_CARDS: DashboardCardRef[] = WEEKLY_SPLIT_ORDER.map(
  (split) => ({ kind: 'split', split }),
);

export function dashboardCardKey(card: DashboardCardRef): string {
  return card.kind === 'split' ? `split:${card.split}` : `routine:${card.routineId}`;
}

export function dashboardCardLabel(card: DashboardCardRef): string {
  if (card.kind === 'split') {
    return SPLIT_DEFINITIONS[card.split].name;
  }

  return 'Saved workout';
}

export function isSameDashboardCard(a: DashboardCardRef, b: DashboardCardRef): boolean {
  return dashboardCardKey(a) === dashboardCardKey(b);
}

export function cardRefIncluded(
  cards: DashboardCardRef[],
  candidate: DashboardCardRef,
): boolean {
  return cards.some((card) => isSameDashboardCard(card, candidate));
}
