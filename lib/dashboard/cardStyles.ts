import { Platform, type ViewStyle } from 'react-native';

/** Shared dashboard card hover outline — matches theme accent (#c8ff5a). */
export const DASHBOARD_HOVER_BORDER = 'rgba(200,255,90,0.4)';

/** Light fill for compact dashboard tiles (stat tiles, PR cards). */
export const DASHBOARD_TILE_BG = '#141427';

/** Subtle resting border for compact dashboard tiles. */
export const DASHBOARD_TILE_BORDER = 'rgba(255,255,255,0.06)';

export const DASHBOARD_WORKOUT_CARD_RADIUS = 16;

/** Clips child layers (e.g. top-left gradients) to rounded corners on web and native. */
export function dashboardCardFrameStyle(borderRadius: number): ViewStyle {
  return {
    borderRadius,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { isolation: 'isolate' as const } : {}),
  };
}

export function dashboardHoverStyle(hovered: boolean) {
  return {
    borderColor: hovered ? DASHBOARD_HOVER_BORDER : DASHBOARD_TILE_BORDER,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: hovered ? '0 0 32px rgba(200,255,90,0.12)' : 'none',
        }
      : {
          transform: [{ translateY: hovered ? -2 : 0 }] as const,
        }),
  };
}

export const dashboardTileHoverHandlers = (
  setHovered: (hovered: boolean) => void,
  onPress?: () => void,
) => ({
  onHoverIn: () => setHovered(true),
  onHoverOut: () => setHovered(false),
  onBlur: () => setHovered(false),
  onPress: () => {
    setHovered(false);
    onPress?.();
  },
});
