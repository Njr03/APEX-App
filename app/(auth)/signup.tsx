import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AuthShell } from '@/components/auth/AuthShell';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import {
  signupSchema,
  type SignupFormValues,
} from '@/lib/validations/auth';
import { useAuth } from '@/providers/AuthProvider';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    try {
      const { needsEmailVerification } = await signUp({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
        username: values.username,
      });

      if (needsEmailVerification) {
        router.replace({
          pathname: '/(auth)/verify-email',
          params: { email: values.email },
        });
        return;
      }

      router.replace('/(tabs)');
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  });

  return (
    <AuthShell
      subtitle="Create an account with us to begin your journey."
      subtitleAlign="left"
      title="Join APEX"
    >
      <GoogleSignInButton />

      {formError ? <AuthErrorBanner message={formError} /> : null}

      <View className="gap-4">
        <FormField
          autoCapitalize="words"
          autoComplete="name"
          control={control}
          label="Display name"
          name="displayName"
          placeholder="Your name"
          textContentType="name"
        />
        <FormField
          autoCapitalize="none"
          autoComplete="username"
          control={control}
          label="Username"
          name="username"
          placeholder="apex_lifter"
          textContentType="username"
        />
        <AppText className="-mt-2 text-xs" variant="muted">
          Log in with this username or your email.
        </AppText>
        <FormField
          autoComplete="email"
          control={control}
          keyboardType="email-address"
          label="Email"
          name="email"
          placeholder="you@example.com"
          textContentType="emailAddress"
        />
        <FormField
          autoComplete="password-new"
          control={control}
          label="Password"
          name="password"
          placeholder="At least 8 characters"
          secureTextEntry
          textContentType="newPassword"
        />
        <FormField
          autoComplete="password-new"
          control={control}
          label="Confirm password"
          name="confirmPassword"
          placeholder="Repeat your password"
          secureTextEntry
          textContentType="newPassword"
        />
      </View>

      <Button
        className="mt-6"
        disabled={isSubmitting}
        label="Sign Up"
        loading={isSubmitting}
        onPress={onSubmit}
      />

      <Link asChild href="/(auth)/login">
        <Button className="mt-3" label="Back to Log In" variant="ghost" />
      </Link>
    </AuthShell>
  );
}
