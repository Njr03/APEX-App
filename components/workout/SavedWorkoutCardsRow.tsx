import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';

import { DashboardWorkoutCard } from '@/components/dashboard/DashboardWorkoutCard';
import { InsightSectionHeading } from '@/components/dashboard/InsightSectionHeading';
import { AppText } from '@/components/ui/AppText';
import { QueryError } from '@/components/ui/QueryState';
import {
  useDeleteRoutine,
  useRoutineSummaries,
  useWorkoutHistory,
} from '@/hooks/queries';
import { useStartWorkoutSession } from '@/hooks/useStartWorkoutSession';
import { colors, fonts } from '@/constants/theme';
import type { RoutineSummary } from '@/hooks/queries/useRoutineSummaries';
import { buildRoutineCardModel } from '@/lib/dashboard/routineCardDisplay';
import {
  DASHBOARD_HOVER_BORDER,
  DASHBOARD_WORKOUT_CARD_RADIUS,
  dashboardHoverStyle,
} from '@/lib/dashboard/cardStyles';
import { dedupeSavedWorkoutsForSession } from '@/lib/routines/sessionWorkouts';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.06)';
const MUTED = 'rgba(240,237,232,0.5)';

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
}: {
  workout: RoutineSummary;
  workouts: ReturnType<typeof useWorkoutHistory>['data'];
  hasUnfinishedSession: boolean;
  isDeleting: boolean;
  unit: 'kg' | 'lb';
  onDelete: () => void;
  onEdit: () => void;
  onStart: () => void;
}) {
  const disabled = hasUnfinishedSession;

  return (
    <View
      style={{
        alignSelf: 'stretch',
        flex: 1,
        minWidth: 220,
        opacity: disabled ? 0.5 : 1,
        width: 240,
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
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityLabel="Create workout"
      accessibilityRole="button"
      className={Platform.OS === 'web' ? 'week-split-card' : undefined}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onPress={() => router.push('/routines/new')}
      style={{
        alignSelf: 'stretch',
        borderRadius: DASHBOARD_WORKOUT_CARD_RADIUS,
        borderStyle: hovered ? 'solid' : 'dashed',
        borderWidth: 1,
        cursor: Platform.OS === 'web' ? ('pointer' as const) : undefined,
        flex: 1,
        minWidth: 96,
        overflow: Platform.OS === 'web' ? ('visible' as const) : undefined,
        ...dashboardHoverStyle(hovered),
        borderColor: hovered ? DASHBOARD_HOVER_BORDER : 'rgba(200,255,90,0.25)',
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: CARD_BG,
          borderRadius: DASHBOARD_WORKOUT_CARD_RADIUS - 2,
          flex: 1,
          justifyContent: 'center',
          margin: 1,
          paddingHorizontal: 16,
          paddingVertical: 24,
        }}
      >
        <Plus color={colors.accent} size={22} />
        <Text
          style={{
            color: colors.accent,
            fontFamily: fonts.brand,
            fontSize: 12,
            fontWeight: '700',
            marginTop: 6,
          }}
        >
          Add
        </Text>
      </View>
    </Pressable>
  );
}

export function SavedWorkoutCardsRow({
  hasUnfinishedSession,
  heading = 'Saved Workouts',
  unit = 'lb',
}: SavedWorkoutCardsRowProps) {
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
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const sessionWorkouts = useMemo(
    () => dedupeSavedWorkoutsForSession(savedWorkouts ?? []),
    [savedWorkouts],
  );

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
        <ScrollView
          horizontal
          contentContainerStyle={{
            alignItems: 'stretch',
            gap: 10,
            paddingBottom: 4,
            paddingRight: 4,
            paddingTop: 4,
          }}
          showsHorizontalScrollIndicator={false}
          style={Platform.OS === 'web' ? { overflow: 'visible' as const } : undefined}
        >
          {sessionWorkouts.map((workout) => (
            <SavedWorkoutCard
              key={workout.id}
              hasUnfinishedSession={hasUnfinishedSession || isStarting}
              isDeleting={deletingRoutineId === workout.id}
              onDelete={() => void handleDelete(workout.id)}
              onEdit={() => router.push(`/routines/${workout.id}/edit`)}
              onStart={() => void handleStart(workout.id)}
              unit={unit}
              workout={workout}
              workouts={workouts}
            />
          ))}
          <AddWorkoutCard />
        </ScrollView>
      ) : null}
    </View>
  );
}
