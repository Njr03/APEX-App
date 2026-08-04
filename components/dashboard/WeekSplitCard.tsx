import type { WeekSplitCardData } from '@/hooks/useThisWeekSplits';
import { DashboardWorkoutCard } from '@/components/dashboard/DashboardWorkoutCard';

interface WeekSplitCardProps {
  card: WeekSplitCardData;
  unit: 'kg' | 'lb';
  onPress: () => void;
  routineMuscles?: string;
}

export function WeekSplitCard({
  card,
  unit,
  onPress,
  routineMuscles,
}: WeekSplitCardProps) {
  const { definition, status, completedSession, lastSession, targetMuscles } = card;

  return (
    <DashboardWorkoutCard
      model={{
        color: definition.color,
        completedSession,
        eyebrow: definition.eyebrow,
        lastSession,
        splitId: definition.id,
        status,
        subtitle: routineMuscles || targetMuscles || definition.muscles,
        title: definition.name,
      }}
      onPress={onPress}
      unit={unit}
    />
  );
}
