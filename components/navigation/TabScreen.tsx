import { Screen, type ScreenProps } from '@/components/ui/Screen';
import { APEX_LOGO_BACKGROUND } from '@/constants/theme';

export function TabScreen(props: ScreenProps) {
  return <Screen backgroundColor={APEX_LOGO_BACKGROUND} {...props} />;
}
