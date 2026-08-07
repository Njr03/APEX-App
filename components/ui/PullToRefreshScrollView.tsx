import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from 'react-native';

import { colors } from '@/constants/theme';

const PULL_THRESHOLD = 72;
const MAX_PULL = 112;
const REFRESH_INDICATOR_HEIGHT = 44;

export type PullToRefreshScrollViewProps = ScrollViewProps & {
  onRefresh: () => void | Promise<void>;
  refreshing: boolean;
};

function WebPullToRefreshScrollView({
  children,
  contentContainerClassName,
  contentContainerStyle,
  onRefresh,
  onScroll,
  onTouchEnd,
  onTouchMove,
  onTouchStart,
  refreshing,
  scrollRef,
  style,
  ...props
}: PullToRefreshScrollViewProps & {
  children: ReactNode;
  scrollRef: React.RefObject<ScrollView | null>;
}) {
  const scrollY = useRef(0);
  const touchStartY = useRef(0);
  const pullDistanceRef = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);

  const updatePullDistance = useCallback((value: number) => {
    pullDistanceRef.current = value;
    setPullDistance(value);
  }, []);

  const handleScroll = useCallback(
    (event: Parameters<NonNullable<ScrollViewProps['onScroll']>>[0]) => {
      scrollY.current = event.nativeEvent.contentOffset.y;
      onScroll?.(event);
    },
    [onScroll],
  );

  const handleTouchStart = useCallback(
    (event: Parameters<NonNullable<ScrollViewProps['onTouchStart']>>[0]) => {
      touchStartY.current = event.nativeEvent.touches[0]?.pageY ?? 0;
      onTouchStart?.(event);
    },
    [onTouchStart],
  );

  const handleTouchMove = useCallback(
    (event: Parameters<NonNullable<ScrollViewProps['onTouchMove']>>[0]) => {
      if (refreshing) return;

      const pageY = event.nativeEvent.touches[0]?.pageY ?? 0;
      const delta = pageY - touchStartY.current;

      if (scrollY.current <= 0 && delta > 0) {
        updatePullDistance(Math.min(delta * 0.5, MAX_PULL));
      } else if (pullDistanceRef.current > 0 && delta <= 0) {
        updatePullDistance(0);
      }

      onTouchMove?.(event);
    },
    [onTouchMove, refreshing, updatePullDistance],
  );

  const handleTouchEnd = useCallback(
    async (event: Parameters<NonNullable<ScrollViewProps['onTouchEnd']>>[0]) => {
      const shouldRefresh =
        !refreshing && pullDistanceRef.current >= PULL_THRESHOLD;

      if (shouldRefresh) {
        updatePullDistance(REFRESH_INDICATOR_HEIGHT);
        try {
          await onRefresh();
        } finally {
          updatePullDistance(0);
        }
      } else {
        updatePullDistance(0);
      }

      onTouchEnd?.(event);
    },
    [onRefresh, onTouchEnd, refreshing, updatePullDistance],
  );

  const indicatorHeight = refreshing ? REFRESH_INDICATOR_HEIGHT : pullDistance;
  const showSpinner =
    refreshing || pullDistance >= PULL_THRESHOLD * 0.85 || pullDistance > 16;

  return (
    <ScrollView
      ref={scrollRef}
      {...props}
      contentContainerClassName={contentContainerClassName}
      contentContainerStyle={contentContainerStyle}
      onScroll={handleScroll}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      scrollEventThrottle={16}
      style={[styles.webScroll, style]}
    >
      <View style={[styles.indicator, { height: indicatorHeight }]}>
        {showSpinner ? (
          <ActivityIndicator animating color={colors.accent} size="small" />
        ) : null}
      </View>
      {children}
    </ScrollView>
  );
}

export const PullToRefreshScrollView = forwardRef<
  ScrollView,
  PullToRefreshScrollViewProps
>(function PullToRefreshScrollView(
  { children, onRefresh, refreshing, ...props },
  ref,
) {
  const scrollRef = useRef<ScrollView>(null);

  useImperativeHandle(ref, () => scrollRef.current as ScrollView);

  if (Platform.OS === 'web') {
    return (
      <WebPullToRefreshScrollView
        onRefresh={onRefresh}
        refreshing={refreshing}
        scrollRef={scrollRef}
        {...props}
      >
        {children}
      </WebPullToRefreshScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      {...props}
      refreshControl={
        <RefreshControl
          colors={[colors.accent]}
          onRefresh={onRefresh}
          refreshing={refreshing}
          tintColor={colors.accent}
        />
      }
    >
      {children}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  indicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    overflow: 'hidden',
  },
  webScroll: {
    flex: 1,
    overscrollBehavior: 'contain',
  },
});
