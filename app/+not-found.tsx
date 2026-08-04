import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Screen className="items-center justify-center px-6">
        <AppText className="text-2xl" variant="display">
          Page not found
        </AppText>
        <AppText className="mt-2 text-center" variant="muted">
          This screen doesn&apos;t exist.
        </AppText>
        <View className="mt-6 w-full">
          <Link asChild href="/">
            <Button label="Go Home" />
          </Link>
        </View>
      </Screen>
    </>
  );
}
