import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Pencil } from 'lucide-react-native';

import {
  DashboardCardsCarousel,
  DashboardCardsGrid,
  type DashboardCarouselItem,
} from '@/components/dashboard/DashboardCardsCarousel';
import { DashboardAddCardModal } from '@/components/dashboard/DashboardAddCardModal';
import { DashboardCardsEditModal } from '@/components/dashboard/DashboardCardsEditModal';
import { DashboardEmptyCardSlot } from '@/components/dashboard/DashboardEmptyCardSlot';
import { DashboardRoutineCard } from '@/components/dashboard/DashboardRoutineCard';
import { RoutineCardBreakdownModal } from '@/components/dashboard/RoutineCardBreakdownModal';
import { WeekSplitCard } from '@/components/dashboard/WeekSplitCard';
import { DASHBOARD_SECTION_HEADING_STYLE } from '@/components/dashboard/InsightSectionHeading';
import { WeekSplitCardBreakdownModal } from '@/components/dashboard/WeekSplitCardBreakdownModal';
import { AppText } from '@/components/ui/AppText';
import { QueryError } from '@/components/ui/QueryState';
import { useRoutineSummaries, useWorkoutHistory } from '@/hooks/queries';
import { useThisWeekSplits, type WeekSplitCardData } from '@/hooks/useThisWeekSplits';
import { colors } from '@/constants/theme';
import { dashboardCardKey } from '@/lib/dashboard/dashboardCards';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { inferSplitFromWorkoutName } from '@/lib/training/splits';
import { useDashboardCardsStore } from '@/stores/dashboardCardsStore';

interface ThisWeekSectionProps {
  unit?: 'kg' | 'lb';
  showHeading?: boolean;
  showCards?: boolean;
}

export function ThisWeekHeading({ onEdit }: { onEdit?: () => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <AppText style={DASHBOARD_SECTION_HEADING_STYLE}>This Week</AppText>
      {onEdit ? (
        <Pressable
          accessibilityLabel="Edit dashboard workout cards"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onEdit}
          style={{
            alignItems: 'center',
            borderColor: 'rgba(255,255,255,0.08)',
            borderRadius: 8,
            borderWidth: 1,
            height: 28,
            justifyContent: 'center',
            width: 28,
          }}
        >
          <Pencil color={colors.muted} size={14} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function SplitCardsRow({ unit = 'kg' }: { unit?: 'kg' | 'lb' }) {
  const { isCompact } = useLayoutBreakpoint();
  const { data, isLoading, isError, error, refetch } = useThisWeekSplits();
  const { data: routines } = useRoutineSummaries();
  const { data: workouts } = useWorkoutHistory();
  const configuredCards = useDashboardCardsStore((state) => state.cards);
  const hydrated = useDashboardCardsStore((state) => state.hydrated);
  const hydrate = useDashboardCardsStore((state) => state.hydrate);

  const [editVisible, setEditVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [selectedSplitCard, setSelectedSplitCard] = useState<WeekSplitCardData | null>(
    null,
  );
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineSummary | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const splitCardsById = useMemo(
    () => new Map((data?.cards ?? []).map((card) => [card.definition.id, card])),
    [data?.cards],
  );

  const routinesById = useMemo(
    () => new Map((routines ?? []).map((routine) => [routine.id, routine])),
    [routines],
  );

  const routineMusclesBySplit = useMemo(() => {
    const map = new Map<string, string>();

    for (const routine of routines ?? []) {
      const split = inferSplitFromWorkoutName(routine.name);
      if (split && routine.target_muscles) {
        map.set(split, routine.target_muscles);
      }
    }

    return map;
  }, [routines]);

  const cardItems = useMemo((): DashboardCarouselItem[] => {
    const items: DashboardCarouselItem[] = [];

    for (const configured of configuredCards) {
      const key = dashboardCardKey(configured);

      if (configured.kind === 'split') {
        const card = splitCardsById.get(configured.split);
        if (!card) continue;

        items.push({
          key,
          node: (
            <WeekSplitCard
              card={card}
              onPress={() => setSelectedSplitCard(card)}
              routineMuscles={routineMusclesBySplit.get(card.definition.id)}
              unit={unit}
            />
          ),
        });
        continue;
      }

      const routine = routinesById.get(configured.routineId);
      if (!routine) continue;

      items.push({
        key,
        node: (
          <DashboardRoutineCard
            onPress={() => setSelectedRoutine(routine)}
            routine={routine}
            unit={unit}
            workouts={workouts ?? []}
          />
        ),
      });
    }

    return items;
  }, [configuredCards, routineMusclesBySplit, routinesById, splitCardsById, unit, workouts]);

  if (!hydrated || isLoading) {
    return (
      <View className="gap-3">
        <ThisWeekHeading onEdit={() => setEditVisible(true)} />
        <View className="items-center py-8">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View className="gap-3">
        <ThisWeekHeading onEdit={() => setEditVisible(true)} />
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <ThisWeekHeading onEdit={() => setEditVisible(true)} />

      {cardItems.length === 0 ? (
        <DashboardEmptyCardSlot onPress={() => setAddVisible(true)} />
      ) : cardItems.length > (isCompact ? 1 : 3) ? (
        <DashboardCardsCarousel items={cardItems} />
      ) : (
        <DashboardCardsGrid items={cardItems} />
      )}

      <WeekSplitCardBreakdownModal
        card={selectedSplitCard}
        onClose={() => setSelectedSplitCard(null)}
        unit={unit}
        visible={selectedSplitCard != null}
      />

      <RoutineCardBreakdownModal
        onClose={() => setSelectedRoutine(null)}
        routine={selectedRoutine}
        unit={unit}
        visible={selectedRoutine != null}
      />

      <DashboardCardsEditModal
        onClose={() => setEditVisible(false)}
        visible={editVisible}
      />

      <DashboardAddCardModal
        onClose={() => setAddVisible(false)}
        visible={addVisible}
      />
    </View>
  );
}

export function ThisWeekSection({
  unit = 'kg',
  showHeading = true,
  showCards = true,
}: ThisWeekSectionProps) {
  return (
    <View className="gap-4">
      {showHeading && !showCards ? <ThisWeekHeading /> : null}
      {showCards ? <SplitCardsRow unit={unit} /> : null}
    </View>
  );
}
