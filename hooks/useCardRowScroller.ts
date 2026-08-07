import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import {
  scrollHorizontalTo,
  type HorizontalScrollTarget,
} from '@/lib/ui/horizontalScroll';

interface UseCardRowScrollerOptions {
  cardStep: number;
  maxScrollIndex: number;
  scrollRef?: RefObject<HorizontalScrollTarget | null>;
}

export function useCardRowScroller({
  cardStep,
  maxScrollIndex,
  scrollRef: externalScrollRef,
}: UseCardRowScrollerOptions) {
  const internalScrollRef = useRef<HorizontalScrollTarget>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const [scrollOffset, setScrollOffset] = useState(0);
  const isSliderScrolling = useRef(false);

  const snapOffsets = useMemo(
    () =>
      cardStep > 0
        ? Array.from({ length: maxScrollIndex + 1 }, (_, index) => index * cardStep)
        : [],
    [cardStep, maxScrollIndex],
  );

  useEffect(() => {
    setScrollOffset((current) => {
      const next = Math.min(current, maxScrollIndex);
      if (next !== current && cardStep > 0) {
        scrollHorizontalTo(scrollRef, next * cardStep, true);
      }
      return next;
    });
  }, [cardStep, maxScrollIndex]);

  const scrollToOffset = useCallback(
    (offset: number, animated: boolean) => {
      if (cardStep <= 0) return;

      const clamped = Math.max(0, Math.min(maxScrollIndex, offset));
      setScrollOffset(clamped);
      scrollHorizontalTo(scrollRef, clamped * cardStep, animated);
    },
    [cardStep, maxScrollIndex],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isSliderScrolling.current || cardStep <= 0) return;

      const nextOffset = event.nativeEvent.contentOffset.x / cardStep;
      setScrollOffset(Math.max(0, Math.min(maxScrollIndex, nextOffset)));
    },
    [cardStep, maxScrollIndex],
  );

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isSliderScrolling.current || cardStep <= 0) return;

      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / cardStep);
      scrollToOffset(nextIndex, true);
    },
    [cardStep, scrollToOffset],
  );

  const handleSliderChange = useCallback(
    (value: number) => {
      isSliderScrolling.current = true;
      const clamped = Math.max(0, Math.min(maxScrollIndex, value));
      setScrollOffset(clamped);
      scrollHorizontalTo(scrollRef, clamped * cardStep, false);
    },
    [cardStep, maxScrollIndex],
  );

  const handleSliderEnd = useCallback(
    (value: number) => {
      isSliderScrolling.current = false;
      scrollToOffset(Math.round(value), true);
    },
    [scrollToOffset],
  );

  return {
    handleScroll,
    handleScrollEnd,
    handleSliderChange,
    handleSliderEnd,
    scrollOffset,
    scrollRef,
    snapOffsets,
  };
}
