import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useState } from 'react';

import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { PwaInstallCard } from '@/components/pwa/PwaInstallCard';
import { AppText } from '@/components/ui/AppText';
import { TabPageHeading } from '@/components/ui/TabPageHeading';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QueryError } from '@/components/ui/QueryState';
import { Screen } from '@/components/ui/Screen';
import { useProfile } from '@/hooks/queries';
import { colors } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth/errors';
import { getSupabaseErrorMessage } from '@/lib/supabase/errors';
import { useAuth } from '@/providers/AuthProvider';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfile();
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (err) {
      setSignOutError(getAuthErrorMessage(err));
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 p-5 pb-10"
      >
        <View className="flex-row items-center justify-between">
          <TabPageHeading title="User profile" />
          <Pressable
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            className="rounded-full bg-accent p-2 active:opacity-80"
            onPress={() => router.push('/profile/settings')}
          >
            <Settings color={colors.bg} size={20} />
          </Pressable>
        </View>

        <View className="rounded-lg border border-border bg-surface px-4 py-3">
          <AppText variant="muted">Signed in as</AppText>
          <AppText className="mt-1" variant="mono">
            {user?.email ?? '—'}
          </AppText>
        </View>

        {isLoading ? <ActivityIndicator color={colors.accent} /> : null}

        {isError ? (
          <QueryError
            message={getSupabaseErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : null}

        {profile ? (
          <Card className="gap-4">
            <View>
              <AppText variant="muted">Display name</AppText>
              <AppText className="mt-1" variant="display">
                {profile.display_name ?? 'Athlete'}
              </AppText>
            </View>
          </Card>
        ) : null}

        {!isLoading && !isError && !profile ? (
          <QueryError
            message="Profile not found."
            onRetry={() => void refetch()}
          />
        ) : null}

        <PwaInstallCard />

        {signOutError ? <AuthErrorBanner message={signOutError} /> : null}

        <Button
          label="Log Out"
          loading={isSigningOut}
          onPress={handleSignOut}
          variant="secondary"
        />
      </ScrollView>
    </Screen>
  );
}
