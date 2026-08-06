import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';

import { CardScrollSlider } from '@/components/ui/CardScrollSlider';
import { useLayoutBreakpoint } from '@/hooks/useLayoutBreakpoint';

const CARD_GAP = 12;

export interface DashboardCarouselItem {
  key: string;
  node: ReactNode;
}

interface DashboardCardsCarouselProps {
  items: DashboardCarouselItem[];
}

const DESKTOP_VISIBLE_CARD_COUNT = 3;
const MOBILE_VISIBLE_CARD_COUNT = 1;

export function DashboardCardsCarousel({ items }: DashboardCardsCarouselProps) {
  const { isCompact } = useLayoutBreakpoint();
  const visibleCardCount = isCompact
    ? MOBILE_VISIBLE_CARD_COUNT
    : DESKTOP_VISIBLE_CARD_COUNT;
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [scrollIndex, setScrollIndex] = useState(0);

  const maxScrollIndex = Math.max(0, items.length - visibleCardCount);
  const cardWidth =
    viewportWidth > 0
      ? (viewportWidth - CARD_GAP * (visibleCardCount - 1)) / visibleCardCount
      : 0;
  const cardStep = cardWidth + CARD_GAP;

  useEffect(() => {
    setScrollIndex((current) => Math.min(current, maxScrollIndex));
  }, [maxScrollIndex]);

  useEffect(() => {
    if (cardStep <= 0) return;
    scrollRef.current?.scrollTo({ x: scrollIndex * cardStep, animated: false });
  }, [cardStep]);

  const scrollToIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(maxScrollIndex, index));
    setScrollIndex(nextIndex);
    if (cardStep > 0) {
      scrollRef.current?.scrollTo({ x: nextIndex * cardStep, animated: true });
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (cardStep <= 0) return;
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / cardStep);
    setScrollIndex(Math.max(0, Math.min(maxScrollIndex, nextIndex)));
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        setViewportWidth(event.nativeEvent.layout.width);
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        contentContainerStyle={{ alignItems: 'stretch' }}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={cardStep > 0 ? cardStep : undefined}
      >
        {items.map((item, index) => (
          <View
            key={item.key}
            style={{
              alignSelf: 'stretch',
              marginRight: index < items.length - 1 ? CARD_GAP : 0,
              width: cardWidth > 0 ? cardWidth : undefined,
            }}
          >
            {item.node}
          </View>
        ))}
      </ScrollView>

      <CardScrollSlider
        max={maxScrollIndex}
        onChange={scrollToIndex}
        value={scrollIndex}
      />
    </View>
  );
}

interface DashboardCardsGridProps {
  items: DashboardCarouselItem[];
}

export function DashboardCardsGrid({ items }: DashboardCardsGridProps) {
  const { isCompact } = useLayoutBreakpoint();

  return (
    <View className={isCompact ? 'flex-col' : 'flex-row flex-wrap'} style={{ gap: CARD_GAP }}>
      {items.map((item) => (
        <View
          key={item.key}
          style={{
            alignSelf: 'stretch',
            flexBasis: isCompact ? '100%' : '30%',
            flexGrow: 1,
            minWidth: isCompact ? 0 : 180,
            width: isCompact ? '100%' : undefined,
          }}
        >
          {item.node}
        </View>
      ))}
    </View>
  );
}
