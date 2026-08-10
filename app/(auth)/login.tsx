import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AppText } from '@/components/ui/AppText';
import { APEX_LOGO_BACKGROUND } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import {
  getAuthErrorMessage,
  INVALID_LOGIN_CREDENTIALS_MESSAGE,
  isInvalidLoginCredentialsError,
} from '@/lib/auth/errors';
import {
  loginSchema,
  type LoginFormValues,
} from '@/lib/validations/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showCredentialHelp, setShowCredentialHelp] = useState(false);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setShowCredentialHelp(false);

    try {
      await signIn(values.identifier, values.password);
      router.replace('/(tabs)');
    } catch (error) {
      if (isInvalidLoginCredentialsError(error)) {
        setShowCredentialHelp(true);
        return;
      }

      setFormError(getAuthErrorMessage(error));
    }
  });

  return (
    <AuthShell
      backgroundColor={APEX_LOGO_BACKGROUND}
      loginHero
      subtitle="HEALTH"
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
          textContentType="username"
        />
        <FormField
          autoComplete="password"
          control={control}
          label="Password"
          name="password"
          secureTextEntry
          textContentType="password"
        />

        {showCredentialHelp ? (
          <View className="gap-2">
            <AppText className="text-sm text-accent3" variant="body">
              {INVALID_LOGIN_CREDENTIALS_MESSAGE}
            </AppText>

            <Link asChild href="/(auth)/signup">
              <Button label="Create Account" variant="secondary" />
            </Link>

            <Link asChild href="/(auth)/forgot-password">
              <Button label="Forgot Password" variant="ghost" />
            </Link>
          </View>
        ) : null}
      </View>

      <Button
        className="mt-4"
        disabled={isSubmitting}
        label="Log In"
        loading={isSubmitting}
        onPress={onSubmit}
      />
    </AuthShell>
  );
}
