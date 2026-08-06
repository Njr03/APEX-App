import { Download, Smartphone } from 'lucide-react-native';
import { View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { colors } from '@/constants/theme';

export function PwaInstallCard() {
  const { canInstall, install, isInstalled, isIosSafari, isWeb } =
    usePwaInstall();

  if (!isWeb || isInstalled) return null;

  if (isIosSafari) {
    return (
      <Card className="gap-3 border-accent/20 bg-surface2">
        <View className="flex-row items-center gap-2">
          <Smartphone color={colors.accent} size={18} />
          <AppText className="font-semibold" variant="body">
            Install APEX on your iPhone
          </AppText>
        </View>
        <AppText variant="muted">
          Tap Share in Safari, then Add to Home Screen for a full-screen app
          experience.
        </AppText>
      </Card>
    );
  }

  if (!canInstall) return null;

  return (
    <Card className="gap-3 border-accent/20 bg-surface2">
      <View className="flex-row items-center gap-2">
        <Download color={colors.accent} size={18} />
        <AppText className="font-semibold" variant="body">
          Install APEX
        </AppText>
      </View>
      <AppText variant="muted">
        Add APEX to your home screen for quick access and a native app feel.
      </AppText>
      <Button label="Install App" onPress={() => void install()} />
    </Card>
  );
}
