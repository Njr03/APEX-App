import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View, type LayoutChangeEvent } from 'react-native';
import { Text } from '@/components/ui/Text';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';

import { DashboardWorkoutCard } from '@/components/dashboard/DashboardWorkoutCard';
import { RoutineCardBreakdownModal } from '@/components/dashboard/RoutineCardBreakdownModal';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { AppText } from '@/components/ui/AppText';
import { CardScrollSlider } from '@/components/ui/CardScrollSlider';
import { QueryError } from '@/components/ui/QueryState';
import {
  useDeleteRoutine,
  useRoutineSummaries,
  useWorkoutHistory,
} from '@/hooks/queries';
import { useCardRowScroller } from '@/hooks/useCardRowScroller';
import { useStartWorkoutSession } from '@/hooks/useStartWorkoutSession';
import { colors, fonts } from '@/constants/theme';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import { buildRoutineCardModel } from '@/lib/dashboard/routineCardDisplay';
import {
  applySavedWorkoutOrderToDashboardCards,
  sortRoutinesByDashboardOrder,
} from '@/lib/dashboard/savedWorkoutCardOrder';
import {
  DASHBOARD_WORKOUT_CARD_RADIUS,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import { dedupeSavedWorkoutsForSession } from '@/lib/routines/sessionWorkouts';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import {
  isRoutineCompletedThisWeek,
  WEEKLY_COMPLETION_BLOCKED_MESSAGE,
} from '@/lib/workout/weeklyCompletion';
import { router, useFocusEffect } from 'expo-router';
import { useDashboardCardsStore } from '@/stores/dashboardCardsStore';
import type { HorizontalScrollTarget } from '@/lib/ui/horizontalScroll';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const CARD_GAP = 10;

interface SavedWorkoutListItem {
  key: string;
  routineId: string;
  workout: RoutineSummary;
}

type SavedWorkoutRowItem =
  | (SavedWorkoutListItem & { kind: 'workout' })
  | { kind: 'add'; key: '__add__' };

interface SavedWorkoutCardsRowProps {
  heading?: string;
  unit?: 'kg' | 'lb';
}

function SavedWorkoutCard({
  workout,
  workouts,
  isDeleting,
  unit,
  onDelete,
  onEdit,
  onPress,
  cardWidth,
}: {
  workout: RoutineSummary;
  workouts: ReturnType<typeof useWorkoutHistory>['data'];
  isDeleting: boolean;
  unit: 'kg' | 'lb';
  onDelete: () => void;
  onEdit: () => void;
  onPress: () => void;
  cardWidth: number;
}) {
  return (
    <View
      style={{
        alignSelf: 'stretch',
        minWidth: 0,
        width: cardWidth,
      }}
    >
      <DashboardWorkoutCard
        compact
        footer={
          <View className="flex-row justify-end" style={{ gap: 6, marginTop: 4 }}>
            <Pressable
              accessibilityLabel={`Edit ${workout.name}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation?.();
                onEdit();
              }}
              style={{
                alignItems: 'center',
                borderColor: BORDER,
                borderRadius: 8,
                borderWidth: 1,
                height: 28,
                justifyContent: 'center',
                width: 28,
              }}
            >
              <Pencil color={MUTED} size={14} />
            </Pressable>
            <Pressable
              accessibilityLabel={`Delete ${workout.name}`}
              accessibilityRole="button"
              disabled={isDeleting}
              hitSlop={8}
              onPress={(event) => {
                event.stopPropagation?.();
                onDelete();
              }}
              style={{
                alignItems: 'center',
                borderColor: 'rgba(255,107,107,0.25)',
                borderRadius: 8,
                borderWidth: 1,
                height: 28,
                justifyContent: 'center',
                opacity: isDeleting ? 0.5 : 1,
                width: 28,
              }}
            >
              <Trash2 color={colors.accent3} size={14} />
            </Pressable>
          </View>
        }
        model={buildRoutineCardModel(workout, workouts ?? [])}
        onPress={onPress}
        unit={unit}
      />
    </View>
  );
}

function AddWorkoutCard() {
  const { pressed, handlers } = useDashboardTilePress(() => {
    router.push('/routines/new');
  });

  return (
    <Pressable
      accessibilityLabel="Create workout"
      accessibilityRole="button"
      className={dashboardTileWebClassName('week-split-card')}
      {...handlers}
      style={{
        alignItems: 'center',
        alignSelf: 'stretch',
        backgroundColor: CARD_BG,
        borderColor: 'rgba(200,255,90,0.25)',
        borderRadius: DASHBOARD_WORKOUT_CARD_RADIUS,
        borderStyle: 'dashed',
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: 8,
        width: '100%',
        ...dashboardPressStyle(pressed),
      }}
    >
      <Plus color={colors.accent} size={22} strokeWidth={2.5} />
      <Text
        style={{
          color: colors.accent,
          fontFamily: fonts.brand,
          fontSize: 11,
          fontWeight: '700',
          marginTop: 6,
        }}
      >
        Add
      </Text>
    </Pressable>
  );
}

export function SavedWorkoutCardsRow({
  heading = 'Saved Workouts',
  unit = 'lb',
}: SavedWorkoutCardsRowProps) {
  const { width: viewportWidth } = useLayoutBreakpoint();
  const [rowWidth, setRowWidth] = useState(0);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);
  const [confirmWorkout, setConfirmWorkout] = useState<RoutineSummary | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const {
    data: savedWorkouts,
    isLoading,
    isError,
    error,
    refetch,
  } = useRoutineSummaries();
  const { data: workouts } = useWorkoutHistory();
  const deleteRoutine = useDeleteRoutine();
  const { startFromRoutineId, isStarting } = useStartWorkoutSession();
  const configuredCards = useDashboardCardsStore((state) => state.cards);
  const dashboardHydrated = useDashboardCardsStore((state) => state.hydrated);
  const hydrateDashboardCards = useDashboardCardsStore((state) => state.hydrate);
  const setDashboardCards = useDashboardCardsStore((state) => state.setCards);

  useEffect(() => {
    void hydrateDashboardCards();
  }, [hydrateDashboardCards]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const sessionWorkouts = useMemo(
    () => dedupeSavedWorkoutsForSession(savedWorkouts ?? []),
    [savedWorkouts],
  );

  const orderedWorkouts = useMemo(
    () =>
      dashboardHydrated
        ? sortRoutinesByDashboardOrder(sessionWorkouts, configuredCards)
        : sessionWorkouts,
    [configuredCards, dashboardHydrated, sessionWorkouts],
  );

  const listItems = useMemo(
    (): SavedWorkoutListItem[] =>
      orderedWorkouts.map((workout) => ({
        key: workout.id,
        routineId: workout.id,
        workout,
      })),
    [orderedWorkouts],
  );

  const rowItems = useMemo(
    (): SavedWorkoutRowItem[] => [
      ...listItems.map((item) => ({ ...item, kind: 'workout' as const })),
      { kind: 'add', key: '__add__' },
    ],
    [listItems],
  );

  const layoutWidth = rowWidth > 0 ? rowWidth : viewportWidth;
  const cardWidth = Math.min(280, Math.max(240, layoutWidth - 48));
  const addCardWidth = cardWidth / 2;
  const cardStep = cardWidth + CARD_GAP;
  const itemCount = listItems.length + 1;
  const visibleCardCount =
    rowWidth > 0 ? Math.max(1, Math.floor((rowWidth + CARD_GAP) / cardStep)) : 1;
  const maxScrollIndex = Math.max(0, itemCount - visibleCardCount);
  const scrollTargetRef = useRef<HorizontalScrollTarget>(null);

  const {
    handleScroll,
    handleScrollEnd,
    handleSliderChange,
    handleSliderEnd,
    scrollOffset,
    snapOffsets,
  } = useCardRowScroller({
    cardStep,
    maxScrollIndex,
    scrollRef: scrollTargetRef,
  });

  const assignListRef = useCallback((node: HorizontalScrollTarget | null) => {
    scrollTargetRef.current = node;
  }, []);

  const handleDelete = async (routineId: string) => {
    setDeletingRoutineId(routineId);
    try {
      await deleteRoutine.mutateAsync(routineId);
    } finally {
      setDeletingRoutineId(null);
    }
  };

  const handleOpenConfirm = (workout: RoutineSummary) => {
    setStartError(null);
    setConfirmWorkout(workout);
  };

  const handleConfirmStart = async () => {
    if (!confirmWorkout) return;

    setStartError(null);

    try {
      await startFromRoutineId(confirmWorkout.id);
      setConfirmWorkout(null);
      router.push('/workout/active');
    } catch (err) {
      setStartError(getSupabaseErrorMessage(err));
    }
  };

  const confirmWorkoutCompletedThisWeek = useMemo(() => {
    if (!confirmWorkout || !workouts) return false;
    return isRoutineCompletedThisWeek(confirmWorkout.id, workouts);
  }, [confirmWorkout, workouts]);

  const handleDragEnd = useCallback(
    ({ data }: { data: SavedWorkoutRowItem[] }) => {
      const orderedRoutineIds = data
        .filter((item): item is SavedWorkoutListItem & { kind: 'workout' } => item.kind === 'workout')
        .map((item) => item.routineId);

      void setDashboardCards(
        applySavedWorkoutOrderToDashboardCards(configuredCards, orderedRoutineIds),
      );
    },
    [configuredCards, setDashboardCards],
  );

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<SavedWorkoutRowItem>) => {
      if (item.kind === 'add') {
        return (
          <View
            style={{
              alignSelf: 'stretch',
              width: addCardWidth,
            }}
          >
            <AddWorkoutCard />
          </View>
        );
      }

      return (
        <ScaleDecorator>
          <Pressable
            accessibilityHint="Press and hold to reorder"
            delayLongPress={250}
            disabled={isActive}
            onLongPress={drag}
            style={{
              alignSelf: 'stretch',
              marginRight: CARD_GAP,
              opacity: isActive ? 0.92 : 1,
              width: cardWidth,
            }}
          >
            <SavedWorkoutCard
              cardWidth={cardWidth}
              isDeleting={deletingRoutineId === item.workout.id}
              onDelete={() => void handleDelete(item.workout.id)}
              onEdit={() => router.push(`/routines/${item.workout.id}/edit`)}
              onPress={() => handleOpenConfirm(item.workout)}
              unit={unit}
              workout={item.workout}
              workouts={workouts}
            />
          </Pressable>
        </ScaleDecorator>
      );
    },
    [
      addCardWidth,
      cardWidth,
      deletingRoutineId,
      unit,
      workouts,
    ],
  );

  return (
    <View className="gap-3">
      <TabPageHeading title={heading} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : null}

      {isError ? (
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !isError ? (
        <View
          onLayout={(event: LayoutChangeEvent) => {
            setRowWidth(event.nativeEvent.layout.width);
          }}
        >
          <DraggableFlatList
            ref={assignListRef}
            horizontal
            activationDistance={12}
            containerStyle={{ flexGrow: 0 }}
            contentContainerStyle={{
              alignItems: 'stretch',
              paddingBottom: 4,
              paddingRight: 4,
              paddingTop: 4,
            }}
            data={rowItems}
            decelerationRate="fast"
            keyExtractor={(item) => item.key}
            nestedScrollEnabled
            onDragEnd={handleDragEnd}
            onMomentumScrollEnd={handleScrollEnd}
            onScroll={handleScroll}
            onScrollEndDrag={handleScrollEnd}
            renderItem={renderItem}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
            snapToAlignment="start"
            snapToOffsets={snapOffsets.length > 0 ? snapOffsets : undefined}
          />

          <CardScrollSlider
            max={maxScrollIndex}
            onChange={handleSliderChange}
            onChangeEnd={handleSliderEnd}
            value={scrollOffset}
          />
        </View>
      ) : null}

      <RoutineCardBreakdownModal
        blockedMessage={
          confirmWorkoutCompletedThisWeek ? WEEKLY_COMPLETION_BLOCKED_MESSAGE : null
        }
        isStarting={isStarting}
        onClose={() => {
          setConfirmWorkout(null);
          setStartError(null);
        }}
        onStartWorkout={
          confirmWorkout && !confirmWorkoutCompletedThisWeek
            ? () => void handleConfirmStart()
            : undefined
        }
        routine={confirmWorkout}
        startError={startError}
        unit={unit}
        visible={confirmWorkout != null}
      />
    </View>
  );
}
