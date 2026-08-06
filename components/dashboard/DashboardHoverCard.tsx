import { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  dashboardPressStyle,
  dashboardTileWebClassName,
  useDashboardTilePress,
} from '@/lib/dashboard/cardStyles';

interface DashboardHoverCardProps {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function DashboardHoverCard({
  children,
  onPress,
  accessibilityLabel,
  style,
}: DashboardHoverCardProps) {
  const { pressed, handlers } = useDashboardTilePress(onPress);

  return (
    <Pressable
      accessibilityHint={onPress ? 'Opens a short summary' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      className={dashboardTileWebClassName()}
      {...handlers}
      style={[
        style,
        dashboardPressStyle(pressed),
        onPress && Platform.OS === 'web' ? { cursor: 'pointer' as const } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}
