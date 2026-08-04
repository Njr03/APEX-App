import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '@/lib/validations/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } =
    useForm<ForgotPasswordFormValues>({
      resolver: zodResolver(forgotPasswordSchema),
      defaultValues: { email: '' },
    });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSuccessMessage(null);

    try {
      await resetPassword(values.email);
      setSuccessMessage(
        'If an account exists for that email, a reset link is on its way.',
      );
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });

  return (
    <AuthShell
      subtitle="We'll email you a link to reset your password."
      title="Reset Password"
    >
      {formError ? <AuthErrorBanner message={formError} /> : null}

      {successMessage ? (
        <View className="mb-4 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3">
          <AppText className="text-sm text-accent" variant="body">
            {successMessage}
          </AppText>
        </View>
      ) : null}

      <View className="gap-4">
        <FormField
          autoComplete="email"
          control={control}
          keyboardType="email-address"
          label="Email"
          name="email"
          placeholder="you@example.com"
          textContentType="emailAddress"
        />
      </View>

      <Button
        className="mt-6"
        disabled={isSubmitting}
        label="Send Reset Link"
        loading={isSubmitting}
        onPress={onSubmit}
      />

      <Link asChild href="/(auth)/login">
        <Button className="mt-3" label="Back to Log In" variant="ghost" />
      </Link>
    </AuthShell>
  );
}
