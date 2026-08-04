import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from '@/lib/validations/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function ResetPasswordScreen() {
  const { session, updatePassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<ResetPasswordFormValues>({
      resolver: zodResolver(resetPasswordSchema),
      defaultValues: {
        password: '',
        confirmPassword: '',
      },
    });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    if (!session) {
      setFormError('Your reset link has expired. Request a new one.');
      return;
    }

    try {
      await updatePassword(values.password);
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });

  return (
    <AuthShell
      subtitle="Choose a new password for your account."
      title="Set new password"
    >
      {formError ? <AuthErrorBanner message={formError} /> : null}

      {!session ? (
        <AuthErrorBanner message="Open this screen from the link in your reset email." />
      ) : null}

      <View className="gap-4">
        <FormField
          autoComplete="password-new"
          control={control}
          label="New password"
          name="password"
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
        />
        <FormField
          autoComplete="password-new"
          control={control}
          label="Confirm new password"
          name="confirmPassword"
          placeholder="Repeat your password"
          secureTextEntry
          textContentType="newPassword"
        />
      </View>

      <Button
        className="mt-6"
        disabled={isSubmitting || !session}
        label="Update Password"
        loading={isSubmitting}
        onPress={onSubmit}
      />
    </AuthShell>
  );
}
