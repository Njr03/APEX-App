import { Platform, type ViewStyle } from 'react-native';

/** Shared dashboard card hover outline — matches theme accent (#c8ff5a). */
export const DASHBOARD_HOVER_BORDER = 'rgba(200,255,90,0.4)';

/** Light fill for compact dashboard tiles (stat tiles, PR cards). */
export const DASHBOARD_TILE_BG = '#141427';

/** Subtle resting border for compact dashboard tiles. */
export const DASHBOARD_TILE_BORDER = 'rgba(255,255,255,0.06)';

export const DASHBOARD_WORKOUT_CARD_RADIUS = 16;

export const DASHBOARD_TILE_WEB_CLASS = 'dashboard-tile';

export function wrapDashboardModalClose(onClose: () => void) {
  return () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }
    onClose();
  };
}

/** Clips child layers (e.g. top-left gradients) to rounded corners on web and native. */
export function dashboardCardFrameStyle(borderRadius: number): ViewStyle {
  return {
    borderRadius,
    overflow: 'hidden',
    ...(Platform.OS === 'web' ? { isolation: 'isolate' as const } : {}),
  };
}

export function dashboardHoverStyle(active: boolean) {
  return {
    borderColor: active ? DASHBOARD_HOVER_BORDER : DASHBOARD_TILE_BORDER,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: 'none',
        }
      : {
          transform: [{ translateY: active ? -2 : 0 }] as const,
        }),
  };
}

export const dashboardTileHoverHandlers = (
  setActive: (active: boolean) => void,
  onPress?: () => void,
) => ({
  onHoverIn: () => setActive(true),
  onHoverOut: () => setActive(false),
  onPressIn: () => setActive(true),
  onPressOut: () => setActive(false),
  onBlur: () => setActive(false),
  onPress: () => onPress?.(),
});

export function dashboardTileWebClassName(extra?: string) {
  if (Platform.OS !== 'web') {
    return extra;
  }

  return extra ? `${DASHBOARD_TILE_WEB_CLASS} ${extra}` : DASHBOARD_TILE_WEB_CLASS;
}
