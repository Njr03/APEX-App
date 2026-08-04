import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { OptionPicker } from '@/components/ui/OptionPicker';
import {
  EQUIPMENT_TYPES,
  EXERCISE_TYPES,
  MUSCLE_GROUPS,
} from '@/lib/constants/training';
import {
  createExerciseSchema,
  type CreateExerciseInput,
} from '@/lib/validations/training';

interface CustomExerciseFormProps {
  defaultValues: CreateExerciseInput;
  formError?: string | null;
  isSubmitting?: boolean;
  onCancel?: () => void;
  onSubmit: (values: CreateExerciseInput) => Promise<void>;
  submitLabel: string;
}

export function CustomExerciseForm({
  defaultValues,
  formError,
  isSubmitting = false,
  onCancel,
  onSubmit,
  submitLabel,
}: CustomExerciseFormProps) {
  const { control, handleSubmit } = useForm<CreateExerciseInput>({
    defaultValues,
    resolver: zodResolver(createExerciseSchema),
  });

  return (
    <View className="gap-4">
      {formError ? (
        <AppText className="text-accent3" variant="body">
          {formError}
        </AppText>
      ) : null}

      <FormField
        autoCapitalize="words"
        control={control}
        label="Exercise name"
        name="name"
        placeholder="e.g. Single-arm row"
      />

      <Controller
        control={control}
        name="muscle_group"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <OptionPicker
            error={error?.message}
            label="Muscle group"
            onChange={onChange}
            options={MUSCLE_GROUPS}
            value={value}
          />
        )}
      />

      <Controller
        control={control}
        name="equipment"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <OptionPicker
            error={error?.message}
            label="Equipment"
            onChange={onChange}
            options={EQUIPMENT_TYPES}
            value={value ?? 'other'}
          />
        )}
      />

      <Controller
        control={control}
        name="exercise_type"
        render={({ field: { value, onChange }, fieldState: { error } }) => (
          <OptionPicker
            error={error?.message}
            label="Type"
            onChange={onChange}
            options={EXERCISE_TYPES}
            value={value ?? 'compound'}
          />
        )}
      />

      <Controller
        control={control}
        name="instructions"
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="gap-2">
            <AppText className="text-sm" variant="body">
              Instructions (optional)
            </AppText>
            <Input
              multiline
              numberOfLines={4}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Form cues, setup, tempo…"
              value={value ?? ''}
            />
          </View>
        )}
      />

      <Button
        label={submitLabel}
        loading={isSubmitting}
        onPress={handleSubmit((values) => onSubmit(values))}
      />
      {onCancel ? (
        <Button label="Cancel" onPress={onCancel} variant="ghost" />
      ) : null}
    </View>
  );
}
