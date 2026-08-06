import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExerciseCard } from '@/components/workout/ExerciseCard';
import { ExercisePickerModal } from '@/components/workout/ExercisePickerModal';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { useBootstrapActiveWorkout } from '@/hooks/useBootstrapActiveWorkout';
import { useFinishWorkout } from '@/hooks/useFinishWorkout';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';
import {
  useAddWorkoutExercise,
  useCreateSet,
  useProfile,
} from '@/hooks/queries';
import { colors } from '@/constants/theme';
import {
  inferSplitFromWorkoutName,
  SPLIT_DEFINITIONS,
} from '@/lib/training/splits';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import type { Exercise } from '@/lib/supabase';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

export default function ActiveWorkoutScreen() {
  const { isCompact } = useLayoutBreakpoint();
  const insets = useSafeAreaInsets();
  const {
    workout,
    isLoading,
    isError,
    error,
    refetch,
    retry,
  } = useBootstrapActiveWorkout();
  const { data: profile } = useProfile();
  const finishWorkout = useFinishWorkout();
  const activeSplit = useWorkoutSessionStore((s) => s.activeSplit);
  const addExercise = useAddWorkoutExercise();
  const createSet = useCreateSet();
  const resetSession = useWorkoutSessionStore((s) => s.resetSession);
  const setExerciseExpanded = useWorkoutSessionStore(
    (s) => s.setExerciseExpanded,
  );

  const [pickerVisible, setPickerVisible] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);

  const unit = resolveUnitPreference(profile?.unit_preference);

  const handleAddExercise = async (exercise: Exercise) => {
    if (!workout) return;

    setIsAddingExercise(true);
    try {
      const orderIndex = workout.workout_exercises.length;
      const workoutExercise = await addExercise.mutateAsync({
        workoutId: workout.id,
        exerciseId: exercise.id,
        orderIndex,
      });

      await createSet.mutateAsync({
        workout_exercise_id: workoutExercise.id,
        set_number: 1,
      });

      setExerciseExpanded(workoutExercise.id, true);
      await refetch();
    } finally {
      setIsAddingExercise(false);
    }
  };

  const handleFinish = async () => {
    if (!workout) return;

    const result = await finishWorkout.mutateAsync({ workout });

    resetSession();
    router.replace({
      pathname: '/workout/[id]/summary',
      params: {
        id: result.workoutId,
        xp: String(result.xpEarned),
        prs: String(result.prCount),
        routineTarget: result.hitRoutineTarget ? '1' : '0',
      },
    });
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} size="large" />
        <AppText className="mt-4" variant="muted">
          Preparing workout…
        </AppText>
      </Screen>
    );
  }

  if (isError || !workout) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <QueryError
          message={getSupabaseErrorMessage(error)}
          onRetry={retry}
        />
      </Screen>
    );
  }

  const existingExerciseIds = workout.workout_exercises.map(
    (we) => we.exercise_id,
  );

  const resolvedSplit =
    activeSplit ?? inferSplitFromWorkoutName(workout.name);
  const splitColor = resolvedSplit
    ? SPLIT_DEFINITIONS[resolvedSplit].color
    : colors.accent;

  return (
    <Screen className="relative" edges={isCompact ? ['top', 'left', 'right'] : undefined}>
      <WorkoutHeader
        isFinishing={finishWorkout.isPending}
        name={workout.name}
        onFinish={handleFinish}
        showFinishButton={!isCompact}
        startedAt={workout.started_at}
        unit={unit}
        workoutExercises={workout.workout_exercises}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName={isCompact ? 'gap-3 p-5 pb-28' : 'gap-3 p-5 pb-32'}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {workout.workout_exercises.length > 0 ? (
          <AppText
            className="mb-1"
            style={{ color: 'rgba(240,237,232,0.5)', letterSpacing: 1.5 }}
            variant="mono"
          >
            SESSION PLAN
          </AppText>
        ) : null}

        {workout.workout_exercises.length === 0 ? (
          <View className="rounded-lg border border-border bg-surface px-4 py-6">
            <AppText className="text-center" variant="muted">
              No exercises yet. Add your first movement below.
            </AppText>
          </View>
        ) : (
          workout.workout_exercises.map((we) => (
            <ExerciseCard
              key={we.id}
              splitColor={splitColor}
              unit={unit}
              workoutExercise={we}
            />
          ))
        )}

        <Button
          label={
            workout.workout_exercises.length > 0
              ? 'Add Additional Exercise'
              : 'Add Exercise'
          }
          loading={isAddingExercise}
          onPress={() => setPickerVisible(true)}
          variant="secondary"
        />
      </ScrollView>

      {isCompact ? (
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-border bg-bg px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            label="Finish Workout"
            loading={finishWorkout.isPending}
            onPress={() => void handleFinish()}
          />
        </View>
      ) : null}

      <ExercisePickerModal
        excludeExerciseIds={existingExerciseIds}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
        visible={pickerVisible}
      />
    </Screen>
  );
}
