import { useEffect, useMemo, useState } from 'react';
import { Platform, type ViewStyle } from 'react-native';

/** Shared dashboard card hover outline — matches theme accent (#c8ff5a). */
export const DASHBOARD_HOVER_BORDER = 'rgba(200,255,90,0.4)';

/** Light fill for compact dashboard tiles (stat tiles, PR cards). */
export const DASHBOARD_TILE_BG = '#141427';

/** Subtle resting border for compact dashboard tiles. */
export const DASHBOARD_TILE_BORDER = 'rgba(255,255,255,0.06)';

export const DASHBOARD_WORKOUT_CARD_RADIUS = 16;

export const DASHBOARD_TILE_WEB_CLASS = 'dashboard-tile';

const PRESS_RING_WEB =
  '0 0 0 1px rgba(200,255,90,0.4), 0 0 32px rgba(200,255,90,0.12)';

const pressResetListeners = new Set<() => void>();

export function registerDashboardTilePressReset(listener: () => void) {
  pressResetListeners.add(listener);
  return () => {
    pressResetListeners.delete(listener);
  };
}

export function resetAllDashboardTilePressStates() {
  pressResetListeners.forEach((listener) => listener());
  blurActiveElement();
}

export function blurActiveElement() {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    (document.activeElement as HTMLElement | null)?.blur?.();
  }
}

export function wrapDashboardModalClose(onClose: () => void) {
  return () => {
    resetAllDashboardTilePressStates();
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

/** Press feedback — ring shadow on web, border lift on native. Never uses CSS :active. */
export function dashboardPressStyle(pressed: boolean) {
  if (Platform.OS === 'web') {
    return {
      boxShadow: pressed ? PRESS_RING_WEB : 'none',
    };
  }

  return {
    borderColor: pressed ? DASHBOARD_HOVER_BORDER : DASHBOARD_TILE_BORDER,
    transform: [{ translateY: pressed ? -2 : 0 }] as const,
  };
}

/** @deprecated Use dashboardPressStyle */
export const dashboardHoverStyle = dashboardPressStyle;

export const dashboardTilePressHandlers = (
  setPressed: (pressed: boolean) => void,
  onPress?: () => void,
) => ({
  onPressIn: () => setPressed(true),
  onPressOut: () => setPressed(false),
  onPress: () => {
    setPressed(false);
    blurActiveElement();
    onPress?.();
  },
  ...(Platform.OS === 'web'
    ? {
        onPointerUp: () => setPressed(false),
        onPointerLeave: () => setPressed(false),
        onPointerCancel: () => setPressed(false),
      }
    : {}),
});

/** @deprecated Use dashboardTilePressHandlers */
export const dashboardTileHoverHandlers = dashboardTilePressHandlers;

export function useDashboardTilePress(onPress?: () => void) {
  const [pressed, setPressed] = useState(false);

  useEffect(() => registerDashboardTilePressReset(() => setPressed(false)), []);

  const handlers = useMemo(
    () => dashboardTilePressHandlers(setPressed, onPress),
    [onPress],
  );

  return { pressed, handlers };
}

export function dashboardTileWebClassName(extra?: string) {
  if (Platform.OS !== 'web') {
    return extra;
  }

  return extra ? `${DASHBOARD_TILE_WEB_CLASS} ${extra}` : DASHBOARD_TILE_WEB_CLASS;
}
