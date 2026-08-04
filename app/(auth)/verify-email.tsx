import { Link, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { AuthShell } from '@/components/auth/AuthShell';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();

  return (
    <AuthShell
      subtitle="Confirm your email to activate your account, then sign in."
      title="Check your inbox"
    >
      <View className="rounded-lg border border-border bg-surface2 px-4 py-4">
        <AppText variant="muted">
          We sent a verification link to
        </AppText>
        <AppText className="mt-1" variant="mono">
          {email ?? 'your email address'}
        </AppText>
      </View>

      <AppText className="mt-4 text-center text-sm" variant="muted">
        Didn&apos;t get it? Check spam or wait a few minutes before trying again.
      </AppText>

      <Link asChild href="/(auth)/login">
        <Button className="mt-6" label="Back to Log In" />
      </Link>
    </AuthShell>
  );
}
