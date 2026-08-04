import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import { ExercisePickerModal } from '@/components/workout/ExercisePickerModal';
import {
  RoutineExerciseList,
  type RoutineBuilderItem,
} from '@/components/routines/RoutineExerciseList';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import {
  useCreateRoutine,
  useProfile,
  useRoutine,
  useUpdateRoutine,
  useUpsertRoutineExercises,
} from '@/hooks/queries';
import { colors } from '@/constants/theme';
import type { Exercise, RoutineWithExercises } from '@/lib/supabase';
import { resolveUnitPreference } from '@/lib/profile/unitPreference';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { displayToKg } from '@/lib/units';
import {
  createRoutineSchema,
  type CreateRoutineInput,
} from '@/lib/validations/training';

interface RoutineBuilderProps {
  routineId?: string;
}

function toBuilderItems(
  routine: RoutineWithExercises,
  unit: 'kg' | 'lb',
): RoutineBuilderItem[] {
  return (routine.routine_exercises ?? []).map((re) => ({
    key: re.id,
    exercise_id: re.exercise_id,
    exercise: re.exercise,
    target_sets: re.target_sets != null ? String(re.target_sets) : '',
    target_reps: re.target_reps != null ? String(re.target_reps) : '',
    target_weight:
      re.target_weight != null
        ? String(
            unit === 'lb'
              ? Math.round(re.target_weight * 2.20462 * 10) / 10
              : re.target_weight,
          )
        : '',
  }));
}

export function RoutineBuilder({ routineId }: RoutineBuilderProps) {
  const isEditing = Boolean(routineId);
  const { data: profile } = useProfile();
  const { data: existingRoutine, isLoading } = useRoutine(routineId);
  const createRoutine = useCreateRoutine();
  const updateRoutine = useUpdateRoutine();
  const upsertExercises = useUpsertRoutineExercises();

  const unit = resolveUnitPreference(profile?.unit_preference);
  const [items, setItems] = useState<RoutineBuilderItem[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<
    CreateRoutineInput
  >({
    resolver: zodResolver(createRoutineSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!existingRoutine) return;

    reset({
      name: existingRoutine.name,
      description: existingRoutine.description ?? '',
    });
    setItems(toBuilderItems(existingRoutine, unit));
  }, [existingRoutine, reset, unit]);

  const handleAddExercise = (exercise: Exercise) => {
    setItems((current) => [
      ...current,
      {
        key: `${exercise.id}-${Date.now()}`,
        exercise_id: exercise.id,
        exercise,
        target_sets: '3',
        target_reps: '8',
        target_weight: '',
      },
    ]);
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    if (items.length === 0) {
      setFormError('Add at least one exercise to your workout.');
      return;
    }

    try {
      const routine = isEditing
        ? await updateRoutine.mutateAsync({ id: routineId!, ...values })
        : await createRoutine.mutateAsync(values);

      await upsertExercises.mutateAsync({
        routineId: routine.id,
        exercises: items.map((item, index) => ({
          exercise_id: item.exercise_id,
          order_index: index,
          target_sets: item.target_sets
            ? parseInt(item.target_sets, 10)
            : null,
          target_reps: item.target_reps
            ? parseInt(item.target_reps, 10)
            : null,
          target_weight: item.target_weight
            ? displayToKg(item.target_weight, unit)
            : null,
        })),
      });

      router.replace(isEditing ? `/routines/${routine.id}` : '/(tabs)/workouts');
    } catch (error) {
      setFormError(getSupabaseErrorMessage(error));
    }
  });

  if (isEditing && isLoading) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-4 p-5 pb-10"
          keyboardShouldPersistTaps="handled"
        >
          <BackButton className="mb-2" />
          <AppText className="text-3xl" variant="display">
            {isEditing ? 'Edit Workout' : 'Create Workout'}
          </AppText>

          {formError ? (
            <AppText className="text-accent3" variant="body">
              {formError}
            </AppText>
          ) : null}

          <FormField
            autoCapitalize="words"
            control={control}
            label="Workout name"
            name="name"
            placeholder="Push Day"
          />

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <View className="gap-2">
                <AppText className="text-sm" variant="body">
                  Description (optional)
                </AppText>
                <Input
                  multiline
                  numberOfLines={3}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="Focus, notes, or goals…"
                  value={value ?? ''}
                />
              </View>
            )}
          />

          <View className="gap-3">
            <AppText variant="display">Exercises</AppText>
            <AppText variant="muted">
              Add exercises from the library to build your workout.
            </AppText>
            <Button
              label="Add Exercise"
              onPress={() => setPickerVisible(true)}
              variant="secondary"
            />
            <RoutineExerciseList
              items={items}
              onChange={setItems}
              onRemove={(key) =>
                setItems((current) => current.filter((item) => item.key !== key))
              }
              unit={unit}
            />
            <Button
              label={isEditing ? 'Save Workout' : 'Create Workout'}
              loading={
                isSubmitting ||
                createRoutine.isPending ||
                updateRoutine.isPending ||
                upsertExercises.isPending
              }
              onPress={onSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ExercisePickerModal
        excludeExerciseIds={items.map((item) => item.exercise_id)}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
        visible={pickerVisible}
      />
    </Screen>
  );
}
