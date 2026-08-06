import type { ReactNode, RefObject } from 'react';
import { Platform, ScrollView, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface SwipeableCardRowProps {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  scrollRef: RefObject<ScrollView | null>;
  snapOffsets: number[];
}

export function SwipeableCardRow({
  children,
  containerStyle,
  contentContainerStyle,
  onLayout,
  onScroll,
  onScrollEnd,
  scrollRef,
  snapOffsets,
}: SwipeableCardRowProps) {
  return (
    <View onLayout={onLayout} style={[{ width: '100%' }, containerStyle]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        className={Platform.OS === 'web' ? 'card-scroll-row' : undefined}
        contentContainerStyle={[{ alignItems: 'stretch' }, contentContainerStyle]}
        decelerationRate="fast"
        directionalLockEnabled
        onMomentumScrollEnd={onScrollEnd}
        onScroll={onScroll}
        onScrollEndDrag={onScrollEnd}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToOffsets={snapOffsets.length > 0 ? snapOffsets : undefined}
        style={Platform.OS === 'web' ? { overflow: 'scroll' as const } : undefined}
      >
        {children}
      </ScrollView>
    </View>
  );
}
