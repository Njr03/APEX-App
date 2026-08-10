import { Stack } from 'expo-router';

import { APEX_LOGO_BACKGROUND } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: APEX_LOGO_BACKGROUND },
      }}
    >
      <Stack.Screen
        name="login"
        options={{ contentStyle: { backgroundColor: APEX_LOGO_BACKGROUND } }}
      />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" />
    </Stack>
  );
}
