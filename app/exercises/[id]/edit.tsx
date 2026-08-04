import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';

import { CustomExerciseForm } from '@/components/exercises/CustomExerciseForm';
import { AppText } from '@/components/ui/AppText';
import { BackButton, navigateBack } from '@/components/ui/BackButton';
import { Screen } from '@/components/ui/Screen';
import { useExercise, useUpdateExercise } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import type {
  EquipmentType,
  ExerciseType,
  MuscleGroup,
} from '@/lib/constants/training';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import type { CreateExerciseInput } from '@/lib/validations/training';

export default function EditExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: exercise, isLoading, isError, error } = useExercise(id);
  const updateExercise = useUpdateExercise();
  const [formError, setFormError] = useState<string | null>(null);
  const [defaultValues, setDefaultValues] = useState<CreateExerciseInput | null>(
    null,
  );

  useEffect(() => {
    if (!exercise || !exercise.is_custom) return;

    setDefaultValues({
      name: exercise.name,
      muscle_group: exercise.muscle_group as MuscleGroup,
      equipment: (exercise.equipment as EquipmentType | null) ?? 'other',
      exercise_type: (exercise.exercise_type as ExerciseType | null) ?? 'compound',
      instructions: exercise.instructions ?? '',
    });
  }, [exercise]);

  const handleSubmit = async (values: CreateExerciseInput) => {
    if (!id) return;

    setFormError(null);

    try {
      await updateExercise.mutateAsync({ id, ...values });
      router.replace(`/exercises/${id}`);
    } catch (err) {
      setFormError(getSupabaseErrorMessage(err));
    }
  };

  if (isLoading || (exercise?.is_custom && !defaultValues)) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </Screen>
    );
  }

  if (isError || !exercise) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <AppText className="text-accent3" variant="body">
          {getSupabaseErrorMessage(error)}
        </AppText>
      </Screen>
    );
  }

  if (!exercise.is_custom) {
    return (
      <Screen className="px-5 pt-5">
        <BackButton className="mb-4" />
        <AppText variant="body">Only custom exercises can be edited.</AppText>
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
            Edit Custom Exercise
          </AppText>

          <CustomExerciseForm
            defaultValues={defaultValues!}
            formError={formError}
            isSubmitting={updateExercise.isPending}
            onCancel={() => navigateBack()}
            onSubmit={handleSubmit}
            submitLabel="Save Changes"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
