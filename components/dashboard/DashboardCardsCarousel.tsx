import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Platform, View, type LayoutChangeEvent } from 'react-native';

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

  const scrollToIndex = useCallback(
    (index: number) => {
      setScrollIndex(Math.max(0, Math.min(maxScrollIndex, index)));
    },
    [maxScrollIndex],
  );

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => {
        setViewportWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={{ overflow: 'hidden', width: '100%' }}>
        <View
          className={Platform.OS === 'web' ? 'card-row-slider' : undefined}
          style={{
            alignItems: 'stretch',
            flexDirection: 'row',
            transform: [{ translateX: -scrollIndex * cardStep }],
          }}
        >
          {items.map((item, index) => (
            <View
              key={item.key}
              style={{
                flexShrink: 0,
                marginRight: index < items.length - 1 ? CARD_GAP : 0,
                width: cardWidth > 0 ? cardWidth : undefined,
              }}
            >
              {item.node}
            </View>
          ))}
        </View>
      </View>

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
