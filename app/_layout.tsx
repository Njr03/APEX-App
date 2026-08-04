import '../global.css';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useAppFonts } from '@/hooks/useAppFonts';
import { AuthNavigationHandler } from '@/components/auth/AuthNavigationHandler';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { colors } from '@/constants/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useAppFonts();

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </QueryProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <StatusBar style="light" />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  const isAuthenticated = Boolean(session);

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="light" />
      <AuthNavigationHandler />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="workout/confirm"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="workout/active"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen name="workout/[id]/summary" />
          <Stack.Screen name="exercises/[id]/index" />
          <Stack.Screen name="exercises/[id]/edit" />
          <Stack.Screen name="exercises/new" />
          <Stack.Screen name="routines/index" />
          <Stack.Screen name="routines/new" />
          <Stack.Screen name="routines/[id]/index" />
          <Stack.Screen name="routines/[id]/edit" />
          <Stack.Screen name="history/index" />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen name="splits/[split]" />
          <Stack.Screen name="profile/settings" />
          <Stack.Screen name="reset-password" />
        </Stack.Protected>

        <Stack.Screen name="index" />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </View>
  );
}
