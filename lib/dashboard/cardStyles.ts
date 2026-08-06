import { Platform, type ViewStyle } from 'react-native';

/** Shared dashboard card hover outline — matches theme accent (#c8ff5a). */
export const DASHBOARD_HOVER_BORDER = 'rgba(200,255,90,0.4)';

/** Light fill for compact dashboard tiles (stat tiles, PR cards). */
export const DASHBOARD_TILE_BG = '#141427';

/** Subtle resting border for compact dashboard tiles. */
export const DASHBOARD_TILE_BORDER = 'rgba(255,255,255,0.06)';

export const DASHBOARD_WORKOUT_CARD_RADIUS = 16;

export const DASHBOARD_TILE_WEB_CLASS = 'dashboard-tile';

let suppressHoverUntil = 0;
let suppressHoverTimeout: ReturnType<typeof setTimeout> | null = null;

/** Prevent hover/focus outlines from sticking after opening or closing tile modals on web. */
export function suppressDashboardTileHover(durationMs = 500) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return;
  }

  suppressHoverUntil = Date.now() + durationMs;
  document.body.classList.add('dashboard-tiles-hover-suppressed');
  (document.activeElement as HTMLElement | null)?.blur?.();

  if (suppressHoverTimeout) {
    clearTimeout(suppressHoverTimeout);
  }

  suppressHoverTimeout = setTimeout(() => {
    if (Date.now() >= suppressHoverUntil) {
      document.body.classList.remove('dashboard-tiles-hover-suppressed');
    }
    suppressHoverTimeout = null;
  }, durationMs);
}

export function wrapDashboardModalClose(onClose: () => void) {
  return () => {
    suppressDashboardTileHover();
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

export function dashboardHoverStyle(hovered: boolean) {
  const showHover = Platform.OS !== 'web' && hovered;

  return {
    borderColor: showHover ? DASHBOARD_HOVER_BORDER : DASHBOARD_TILE_BORDER,
    ...(Platform.OS === 'web'
      ? {
          boxShadow: 'none',
        }
      : {
          transform: [{ translateY: showHover ? -2 : 0 }] as const,
        }),
  };
}

export const dashboardTileHoverHandlers = (
  setHovered: (hovered: boolean) => void,
  onPress?: () => void,
) => {
  const handlePress = () => {
    suppressDashboardTileHover();
    onPress?.();
  };

  if (Platform.OS === 'web') {
    return { onPress: handlePress };
  }

  return {
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
    onBlur: () => setHovered(false),
    onPress: handlePress,
  };
};

export function dashboardTileWebClassName(extra?: string) {
  if (Platform.OS !== 'web') {
    return extra;
  }

  return extra ? `${DASHBOARD_TILE_WEB_CLASS} ${extra}` : DASHBOARD_TILE_WEB_CLASS;
}
