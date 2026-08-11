import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { useExercises, useProfile, useWorkoutHistory } from '@/hooks/queries';
import { colors, fonts } from '@/constants/theme';
import {
  getSplitTemplate,
  type SplitTemplateExercise,
} from '@/lib/training/splitTemplates';
import {
  getSplitWorkoutName,
  SPLIT_DEFINITIONS,
  type TrainingSplit,
} from '@/lib/training/splits';
import { formatSetRepsWeight } from '@/lib/workout/formatSessionVolume';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import {
  isSplitCompletedThisWeek,
  WEEKLY_COMPLETION_BLOCKED_MESSAGE,
} from '@/lib/workout/weeklyCompletion';
import { useStartWorkoutSession } from '@/hooks/useStartWorkoutSession';

function resolveSplit(split?: string): TrainingSplit {
  if (split === 'A' || split === 'B' || split === 'L') return split;
  return 'A';
}

type PlanDraft = {
  sets: string;
  reps: string;
  weightKg: string;
};

function exerciseToDraft(item: SplitTemplateExercise): PlanDraft {
  return {
    sets: String(item.sets),
    reps: String(item.reps),
    weightKg: String(item.weightKg),
  };
}

function draftToExercise(
  item: SplitTemplateExercise,
  draft: PlanDraft | undefined,
): SplitTemplateExercise {
  if (!draft) return item;

  const sets = Number.parseInt(draft.sets, 10);
  const reps = Number.parseInt(draft.reps, 10);
  const weightKg = Number.parseFloat(draft.weightKg);

  return {
    ...item,
    sets: Number.isNaN(sets) || sets < 1 ? item.sets : sets,
    reps: Number.isNaN(reps) || reps < 1 ? item.reps : reps,
    weightKg:
      Number.isNaN(weightKg) || weightKg < 0 ? item.weightKg : weightKg,
  };
}

export default function WorkoutConfirmScreen() {
  const { split: splitParam } = useLocalSearchParams<{ split?: string }>();
  const split = resolveSplit(splitParam);
  const definition = SPLIT_DEFINITIONS[split];
  const { data: exercises, isLoading, isError, error, refetch } = useExercises();
  const { data: profile } = useProfile();
  const { data: workoutHistory } = useWorkoutHistory();
  const { startFromPlan, isStarting } = useStartWorkoutSession();
  const [startError, setStartError] = useState<string | null>(null);
  const unit = resolveUnitPreference(profile?.unit_preference);

  const splitCompletedThisWeek = useMemo(
    () =>
      workoutHistory ? isSplitCompletedThisWeek(split, workoutHistory) : false,
    [split, workoutHistory],
  );

  const [planExercises, setPlanExercises] = useState<SplitTemplateExercise[]>(
    () => getSplitTemplate(split).exercises,
  );
  const [drafts, setDrafts] = useState<PlanDraft[]>(() =>
    getSplitTemplate(split).exercises.map(exerciseToDraft),
  );

  useEffect(() => {
    const exercises = getSplitTemplate(split).exercises;
    setPlanExercises(exercises);
    setDrafts(exercises.map(exerciseToDraft));
  }, [split]);

  const resolvedExercises = useMemo(() => {
    if (!exercises) return [];

    return planExercises.map((item) => {
      const exercise = exercises.find((entry) => entry.name === item.exerciseName);
      return {
        ...item,
        exerciseId: exercise?.id ?? null,
        muscleGroup: exercise?.muscle_group ?? null,
      };
    });
  }, [exercises, planExercises]);

  const missingExercises = resolvedExercises.filter((item) => !item.exerciseId);

  const updateDraft = (
    index: number,
    field: keyof PlanDraft,
    value: string,
  ) => {
    setDrafts((current) => {
      const nextDrafts = current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, [field]: value } : draft,
      );

      setPlanExercises((plan) =>
        plan.map((item, itemIndex) =>
          itemIndex === index
            ? draftToExercise(item, nextDrafts[index])
            : item,
        ),
      );

      return nextDrafts;
    });
  };

  const committedExercises = useMemo(
    () =>
      planExercises.map((item, index) =>
        draftToExercise(item, drafts[index]),
      ),
    [drafts, planExercises],
  );

  const handleConfirm = async () => {
    if (missingExercises.length > 0) return;

    setStartError(null);

    try {
      await startFromPlan({
        split,
        exercises: resolvedExercises.map((item, index) => {
          const committed = committedExercises[index] ?? item;

          return {
            exerciseName: item.exerciseName,
            exerciseId: item.exerciseId ?? undefined,
            sets: committed.sets,
            reps: committed.reps,
            weightKg: committed.weightKg,
          };
        }),
      });

      router.replace('/workout/active');
    } catch (err) {
      setStartError(getSupabaseErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <Screen className="items-center justify-center">
        <ActivityIndicator color={colors.accent} size="large" />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <QueryError message={error?.message ?? 'Failed to load exercises'} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        <View>
          <AppText
            style={{ color: definition.color, fontFamily: fonts.jetbrainsMono, fontSize: 10, letterSpacing: 2 }}
          >
            {definition.eyebrow}
          </AppText>
          <AppText className="mt-1 text-2xl" variant="display">
            Confirm Today&apos;s Workout
          </AppText>
          <AppText className="mt-2" variant="muted">
            Review {getSplitWorkoutName(split)} before starting your timer.
          </AppText>
        </View>

        <AppText variant="display">Exercises</AppText>

        {missingExercises.length > 0 ? (
          <Card>
            <AppText className="text-accent3" variant="body">
              Some template exercises are missing from your library. Seed exercises or add them first.
            </AppText>
          </Card>
        ) : null}

        {resolvedExercises.map((item, index) => {
          const draft =
            drafts[index] ?? exerciseToDraft(planExercises[index] ?? item);
          const committed = committedExercises[index] ?? planExercises[index] ?? item;

          return (
            <Card key={`${item.exerciseName}-${index}`} className="gap-3">
              <View>
                <AppText variant="display">{item.exerciseName}</AppText>
                {item.muscleGroup ? (
                  <AppText className="mt-1 capitalize" variant="muted">
                    {item.muscleGroup.replace('_', ' ')}
                  </AppText>
                ) : null}
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-1">
                  <AppText variant="muted">Sets</AppText>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateDraft(index, 'sets', value)}
                    style={{
                      backgroundColor: colors.surface2,
                      borderColor: colors.border,
                      borderRadius: 8,
                      borderWidth: 1,
                      color: colors.text,
                      fontFamily: fonts.jetbrainsMono,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                    }}
                    value={draft.sets}
                  />
                </View>
                <View className="flex-1 gap-1">
                  <AppText variant="muted">Reps</AppText>
                  <TextInput
                    keyboardType="number-pad"
                    onChangeText={(value) => updateDraft(index, 'reps', value)}
                    style={{
                      backgroundColor: colors.surface2,
                      borderColor: colors.border,
                      borderRadius: 8,
                      borderWidth: 1,
                      color: colors.text,
                      fontFamily: fonts.jetbrainsMono,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                    }}
                    value={draft.reps}
                  />
                </View>
                <View className="flex-1 gap-1">
                  <AppText variant="muted">Weight (kg)</AppText>
                  <TextInput
                    keyboardType="decimal-pad"
                    onChangeText={(value) =>
                      updateDraft(index, 'weightKg', value)
                    }
                    style={{
                      backgroundColor: colors.surface2,
                      borderColor: colors.border,
                      borderRadius: 8,
                      borderWidth: 1,
                      color: colors.text,
                      fontFamily: fonts.jetbrainsMono,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                    }}
                    value={draft.weightKg}
                  />
                </View>
              </View>

              <View className="gap-2">
                {Array.from({ length: committed.sets }, (_, setIndex) => (
                  <View
                    key={setIndex}
                    className="flex-row items-center justify-between rounded-lg px-3 py-2"
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                  >
                    <AppText variant="muted">Set {setIndex + 1}</AppText>
                    <AppText style={{ color: definition.color }} variant="mono">
                      {formatSetRepsWeight(1, committed.reps, committed.weightKg, unit)}
                    </AppText>
                  </View>
                ))}
              </View>
            </Card>
          );
        })}

        <Button
          disabled={missingExercises.length > 0 || isStarting || splitCompletedThisWeek}
          label="Confirm & Begin Workout"
          loading={isStarting}
          onPress={() => void handleConfirm()}
        />

        {splitCompletedThisWeek ? (
          <AppText variant="muted">{WEEKLY_COMPLETION_BLOCKED_MESSAGE}</AppText>
        ) : null}

        {startError ? (
          <AppText className="text-accent3" variant="body">
            {startError}
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
