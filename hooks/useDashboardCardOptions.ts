import { useMemo } from 'react';

import { useRoutineSummaries } from '@/hooks/queries';
import {
  cardRefIncluded,
  type DashboardCardRef,
} from '@/lib/dashboard/dashboardCards';
import { routineCardRef } from '@/stores/dashboardCardsStore';

export interface DashboardCardOption {
  ref: DashboardCardRef;
  label: string;
  subtitle: string;
}

/** Saved workouts not already pinned to the dashboard (excludes split templates). */
export function useDashboardCardOptions(cardsForAvailability: DashboardCardRef[]) {
  const { data: routines } = useRoutineSummaries();

  return useMemo(() => {
    const options: DashboardCardOption[] = [];

    for (const routine of routines ?? []) {
      const ref = routineCardRef(routine.id);
      if (!cardRefIncluded(cardsForAvailability, ref)) {
        options.push({
          ref,
          label: routine.name,
          subtitle: routine.target_muscles,
        });
      }
    }

    return options;
  }, [cardsForAvailability, routines]);
}
