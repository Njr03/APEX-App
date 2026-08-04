import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';

interface AuthErrorBannerProps {
  message: string;
}

export function AuthErrorBanner({ message }: AuthErrorBannerProps) {
  return (
    <View className="mb-4 rounded-lg border border-accent3/40 bg-accent3/10 px-4 py-3">
      <AppText className="text-sm text-accent3" variant="body">
        {message}
      </AppText>
    </View>
  );
}
