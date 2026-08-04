import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

import { CustomExerciseForm } from '@/components/exercises/CustomExerciseForm';
import { AppText } from '@/components/ui/AppText';
import { BackButton, navigateBack } from '@/components/ui/BackButton';
import { Screen } from '@/components/ui/Screen';
import { useCreateExercise } from '@/hooks/queries';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import type { CreateExerciseInput } from '@/lib/validations/training';

const DEFAULT_VALUES: CreateExerciseInput = {
  name: '',
  muscle_group: 'chest',
  equipment: 'barbell',
  exercise_type: 'compound',
  instructions: '',
};

export default function NewExerciseScreen() {
  const createExercise = useCreateExercise();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (values: CreateExerciseInput) => {
    setFormError(null);

    try {
      const exercise = await createExercise.mutateAsync(values);
      router.replace(`/exercises/${exercise.id}`);
    } catch (error) {
      setFormError(getSupabaseErrorMessage(error));
    }
  };

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
            Add Custom Exercise
          </AppText>

          <CustomExerciseForm
            defaultValues={DEFAULT_VALUES}
            formError={formError}
            isSubmitting={createExercise.isPending}
            onCancel={() => navigateBack()}
            onSubmit={handleSubmit}
            submitLabel="Save Exercise"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
