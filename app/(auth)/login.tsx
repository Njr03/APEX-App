import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { APEX_LOGO_BACKGROUND } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { getAuthErrorMessage, isInvalidLoginCredentialsError } from '@/lib/auth/errors';
import {
  loginSchema,
  type LoginFormValues,
} from '@/lib/validations/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setShowForgotPassword(false);

    try {
      await signIn(values.identifier, values.password);
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      setShowForgotPassword(isInvalidLoginCredentialsError(error));
    }
  });

  return (
    <AuthShell
      backgroundColor={APEX_LOGO_BACKGROUND}
      subtitle="HEALTH"
      subtitleAlign="center"
      subtitleStretch
      subtitleTone="accent"
      title="APEX"
    >
      <GoogleSignInButton />

      {formError ? <AuthErrorBanner message={formError} /> : null}

      <View className="gap-3">
        <FormField
          autoCapitalize="none"
          autoComplete="username"
          control={control}
          label="Username or email"
          name="identifier"
          placeholder="username or you@example.com"
          textContentType="username"
        />
        <FormField
          autoComplete="password"
          control={control}
          label="Password"
          name="password"
          placeholder="••••••••"
          secureTextEntry
          textContentType="password"
        />

        {showForgotPassword ? (
          <Link asChild href="/(auth)/forgot-password">
            <Button label="Forgot Password" variant="ghost" />
          </Link>
        ) : null}
      </View>

      <Button
        className="mt-4"
        disabled={isSubmitting}
        label="Log In"
        loading={isSubmitting}
        onPress={onSubmit}
      />

      <Link asChild href="/(auth)/signup">
        <Button className="mt-2" label="Create Account" variant="secondary" />
      </Link>
    </AuthShell>
  );
}
