import { type ReactNode, useState } from 'react';
import {
  Platform,
  Pressable,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { dashboardHoverStyle, dashboardTileHoverHandlers } from '@/lib/dashboard/cardStyles';

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
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      accessibilityHint={onPress ? 'Opens a short summary' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      className={Platform.OS === 'web' ? 'dashboard-tile' : undefined}
      {...dashboardTileHoverHandlers(setHovered, onPress)}
      style={[
        style,
        dashboardHoverStyle(hovered),
        onPress && Platform.OS === 'web' ? { cursor: 'pointer' as const } : null,
      ]}
    >
      {children}
    </Pressable>
  );
}
