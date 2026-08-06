import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface UseCardRowScrollerOptions {
  cardStep: number;
  maxScrollIndex: number;
}

export function useCardRowScroller({ cardStep, maxScrollIndex }: UseCardRowScrollerOptions) {
  const [scrollOffset, setScrollOffset] = useState(0);
  const isDraggingSlider = useRef(false);
  const isDraggingRow = useRef(false);
  const translateX = useSharedValue(0);
  const scrollOffsetShared = useSharedValue(0);
  const dragStartIndex = useSharedValue(0);
  const maxIndexShared = useSharedValue(maxScrollIndex);
  const cardStepShared = useSharedValue(cardStep);

  useEffect(() => {
    maxIndexShared.value = maxScrollIndex;
    setScrollOffset((current) => Math.min(current, maxScrollIndex));
  }, [maxScrollIndex, maxIndexShared]);

  useEffect(() => {
    cardStepShared.value = cardStep;
    if (cardStep <= 0 || isDraggingSlider.current || isDraggingRow.current) return;

    translateX.value = withTiming(-scrollOffset * cardStep, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
  }, [cardStep, cardStepShared, scrollOffset, translateX]);

  const animateToIndex = useCallback(
    (index: number, duration = 280) => {
      const snapped = Math.max(0, Math.min(maxScrollIndex, index));
      setScrollOffset(snapped);
      scrollOffsetShared.value = snapped;
      translateX.value = withTiming(-snapped * cardStep, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    },
    [cardStep, maxScrollIndex, scrollOffsetShared, translateX],
  );

  const handleSliderChange = useCallback(
    (value: number) => {
      isDraggingSlider.current = true;
      const clamped = Math.max(0, Math.min(maxScrollIndex, value));
      setScrollOffset(clamped);
      scrollOffsetShared.value = clamped;
      translateX.value = -clamped * cardStep;
    },
    [cardStep, maxScrollIndex, scrollOffsetShared, translateX],
  );

  const handleSliderEnd = useCallback(
    (value: number) => {
      isDraggingSlider.current = false;
      animateToIndex(Math.round(value));
    },
    [animateToIndex],
  );

  const setScrollOffsetFromGesture = useCallback((value: number) => {
    setScrollOffset(value);
  }, []);

  const markRowDragStart = useCallback(() => {
    isDraggingRow.current = true;
  }, []);

  const markRowDragEnd = useCallback(() => {
    isDraggingRow.current = false;
  }, []);

  const snapFromGesture = useCallback(
    (projected: number) => {
      animateToIndex(Math.round(projected));
      isDraggingRow.current = false;
    },
    [animateToIndex],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-8, 8])
        .failOffsetY([-14, 14])
        .onBegin(() => {
          runOnJS(markRowDragStart)();
          dragStartIndex.value = scrollOffsetShared.value;
        })
        .onUpdate((event) => {
          const step = cardStepShared.value;
          if (step <= 0) return;

          const nextIndex = dragStartIndex.value - event.translationX / step;
          const clamped = Math.max(0, Math.min(maxIndexShared.value, nextIndex));
          scrollOffsetShared.value = clamped;
          translateX.value = -clamped * step;
          runOnJS(setScrollOffsetFromGesture)(clamped);
        })
        .onEnd((event) => {
          const step = cardStepShared.value;
          if (step <= 0) {
            runOnJS(markRowDragEnd)();
            return;
          }

          const projected =
            scrollOffsetShared.value - event.velocityX / (step * 18);
          runOnJS(snapFromGesture)(projected);
        })
        .onFinalize(() => {
          runOnJS(markRowDragEnd)();
        }),
    [
      cardStepShared,
      dragStartIndex,
      markRowDragEnd,
      markRowDragStart,
      maxIndexShared,
      scrollOffsetShared,
      setScrollOffsetFromGesture,
      snapFromGesture,
      translateX,
    ],
  );

  const animatedRowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return {
    animatedRowStyle,
    handleSliderChange,
    handleSliderEnd,
    panGesture,
    scrollOffset,
  };
}
