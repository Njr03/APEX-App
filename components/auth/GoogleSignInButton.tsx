import { useState } from 'react';
import { View } from 'react-native';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { signInWithGoogle } from '@/lib/auth/googleSignIn';

interface GoogleSignInButtonProps {
  className?: string;
}

export function GoogleSignInButton({ className }: GoogleSignInButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setError(null);
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={className}>
      {error ? <AuthErrorBanner message={error} /> : null}
      <Button
        accessibilityLabel="Continue with Google"
        label="Continue with Google"
        loading={loading}
        onPress={() => void handlePress()}
        variant="secondary"
      />
      <View className="my-4 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <AppText variant="muted">or</AppText>
        <View className="h-px flex-1 bg-border" />
      </View>
    </View>
  );
}
