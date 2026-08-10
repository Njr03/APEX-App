import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';

import { ExercisePickerModal } from '@/components/workout/ExercisePickerModal';
import {
  RoutineExerciseRow,
  type RoutineBuilderItem,
} from '@/components/routines/RoutineExerciseList';
import { AppText } from '@/components/ui/AppText';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { FilterSectionLabel } from '@/components/ui/FilterSectionLabel';
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
    },
  });

  useEffect(() => {
    if (!existingRoutine) return;

    reset({
      name: existingRoutine.name,
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

  const listHeader = (
    <View className="gap-4 pb-4">
      <BackButton className="mb-2" />
      <AppText className="text-3xl" variant="display">
        {isEditing ? 'Edit Workout' : 'Create Workout'}
      </AppText>

      {formError ? (
        <AppText className="text-accent3" variant="body">
          {formError}
        </AppText>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
          <View className="gap-2">
            <FilterSectionLabel>Workout name</FilterSectionLabel>
            <Input
              accessibilityLabel="Workout name"
              autoCapitalize="words"
              hasError={Boolean(error)}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Push Day"
              value={value ?? ''}
            />
            {error ? (
              <AppText className="text-sm text-accent3" variant="body">
                {error.message}
              </AppText>
            ) : null}
          </View>
        )}
      />

      <View className="gap-3">
        <FilterSectionLabel>Exercises</FilterSectionLabel>
        <AppText variant="muted">
          Add exercises from the library to build your workout.
        </AppText>
        <Button
          label="Add Exercise"
          onPress={() => setPickerVisible(true)}
          variant="secondary"
        />
      </View>
    </View>
  );

  const listFooter = (
    <View className="gap-3 pt-2">
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
  );

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<RoutineBuilderItem>) => (
    <ScaleDecorator>
      <RoutineExerciseRow
        allItems={items}
        drag={drag}
        isActive={isActive}
        item={item}
        onChange={setItems}
        onRemove={(key) =>
          setItems((current) => current.filter((entry) => entry.key !== key))
        }
        unit={unit}
      />
    </ScaleDecorator>
  );

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
        <DraggableFlatList
          activationDistance={12}
          containerStyle={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
          data={items}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.key}
          ListFooterComponent={listFooter}
          ListHeaderComponent={listHeader}
          nestedScrollEnabled
          onDragEnd={({ data }) => setItems(data)}
          renderItem={renderItem}
          scrollEventThrottle={16}
        />
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
