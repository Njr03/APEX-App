import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';

import { DashboardWorkoutCard } from '@/components/dashboard/DashboardWorkoutCard';
import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { AppText } from '@/components/ui/AppText';
import { CardScrollSlider } from '@/components/ui/CardScrollSlider';
import { QueryError } from '@/components/ui/QueryState';
import { SwipeableCardRow } from '@/components/ui/SwipeableCardRow';
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
  DASHBOARD_WORKOUT_CARD_RADIUS,
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';
import { dedupeSavedWorkoutsForSession } from '@/lib/routines/sessionWorkouts';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { router, useFocusEffect } from 'expo-router';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';
const CARD_GAP = 10;

interface SavedWorkoutCardsRowProps {
  hasUnfinishedSession: boolean;
  heading?: string;
  unit?: 'kg' | 'lb';
}

function SavedWorkoutCard({
  workout,
  workouts,
  hasUnfinishedSession,
  isDeleting,
  unit,
  onDelete,
  onEdit,
  onStart,
  cardWidth,
}: {
  workout: RoutineSummary;
  workouts: ReturnType<typeof useWorkoutHistory>['data'];
  hasUnfinishedSession: boolean;
  isDeleting: boolean;
  unit: 'kg' | 'lb';
  onDelete: () => void;
  onEdit: () => void;
  onStart: () => void;
  cardWidth: number;
}) {
  const disabled = hasUnfinishedSession;

  return (
    <View
      style={{
        alignSelf: 'stretch',
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
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
        onPress={() => {
          if (!disabled) onStart();
        }}
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
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 16,
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
  hasUnfinishedSession,
  heading = 'Saved Workouts',
  unit = 'lb',
}: SavedWorkoutCardsRowProps) {
  const { width: viewportWidth } = useLayoutBreakpoint();
  const [rowWidth, setRowWidth] = useState(0);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);
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

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const sessionWorkouts = useMemo(
    () => dedupeSavedWorkoutsForSession(savedWorkouts ?? []),
    [savedWorkouts],
  );

  const layoutWidth = rowWidth > 0 ? rowWidth : viewportWidth;
  const cardWidth = Math.min(280, Math.max(240, layoutWidth - 48));
  const addCardWidth = cardWidth / 2;
  const cardStep = cardWidth + CARD_GAP;
  const itemCount = sessionWorkouts.length + 1;
  const visibleCardCount =
    rowWidth > 0 ? Math.max(1, Math.floor((rowWidth + CARD_GAP) / cardStep)) : 1;
  const maxScrollIndex = Math.max(0, itemCount - visibleCardCount);

  const {
    handleScroll,
    handleScrollEnd,
    handleSliderChange,
    handleSliderEnd,
    scrollOffset,
    scrollRef,
    snapOffsets,
  } = useCardRowScroller({ cardStep, maxScrollIndex });

  const handleDelete = async (routineId: string) => {
    setDeletingRoutineId(routineId);
    try {
      await deleteRoutine.mutateAsync(routineId);
    } finally {
      setDeletingRoutineId(null);
    }
  };

  const handleStart = async (routineId: string) => {
    setStartError(null);

    try {
      await startFromRoutineId(routineId);
      router.push('/workout/active');
    } catch (err) {
      setStartError(getSupabaseErrorMessage(err));
    }
  };

  return (
    <View className="gap-3">
      <InsightSectionHeading title={heading} />

      {isLoading ? (
        <ActivityIndicator color={colors.accent} />
      ) : null}

      {isError ? (
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {startError ? (
        <AppText className="text-accent3" variant="body">
          {startError}
        </AppText>
      ) : null}

      {!isLoading && !isError ? (
        <View
          onLayout={(event: LayoutChangeEvent) => {
            setRowWidth(event.nativeEvent.layout.width);
          }}
        >
          <SwipeableCardRow
            containerStyle={{ paddingBottom: 4, paddingTop: 4 }}
            contentContainerStyle={{ paddingRight: 4 }}
            onScroll={handleScroll}
            onScrollEnd={handleScrollEnd}
            scrollRef={scrollRef}
            snapOffsets={snapOffsets}
          >
            {sessionWorkouts.map((workout) => (
              <View
                key={workout.id}
                style={{
                  alignSelf: 'stretch',
                  flexShrink: 0,
                  marginRight: CARD_GAP,
                  width: cardWidth,
                }}
              >
                <SavedWorkoutCard
                  cardWidth={cardWidth}
                  hasUnfinishedSession={hasUnfinishedSession || isStarting}
                  isDeleting={deletingRoutineId === workout.id}
                  onDelete={() => void handleDelete(workout.id)}
                  onEdit={() => router.push(`/routines/${workout.id}/edit`)}
                  onStart={() => void handleStart(workout.id)}
                  unit={unit}
                  workout={workout}
                  workouts={workouts}
                />
              </View>
            ))}
            <View style={{ alignSelf: 'stretch', flexShrink: 0, width: addCardWidth }}>
              <AddWorkoutCard />
            </View>
          </SwipeableCardRow>

          <CardScrollSlider
            max={maxScrollIndex}
            onChange={handleSliderChange}
            onChangeEnd={handleSliderEnd}
            value={scrollOffset}
          />
        </View>
      ) : null}
    </View>
  );
}
