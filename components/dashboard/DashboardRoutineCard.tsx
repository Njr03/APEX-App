import { DashboardWorkoutCard } from '@/components/dashboard/DashboardWorkoutCard';
import { buildRoutineCardModel } from '@/lib/dashboard/routineCardDisplay';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import type { Workout } from '@/lib/supabase';

interface DashboardRoutineCardProps {
  routine: RoutineSummary;
  workouts: Workout[];
  unit: 'kg' | 'lb';
  onPress: () => void;
}

export function DashboardRoutineCard({
  routine,
  workouts,
  unit,
  onPress,
}: DashboardRoutineCardProps) {
  return (
    <DashboardWorkoutCard
      model={buildRoutineCardModel(routine, workouts)}
      onPress={onPress}
      unit={unit}
    />
  );
}
