import { createElement, useRef } from 'react';
import {
  Platform,
  View,
  type LayoutChangeEvent,
} from 'react-native';

const TRACK_COLOR = 'rgba(255,255,255,0.06)';

interface CardScrollSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
}

function WebRangeSlider({ value, max, onChange, onChangeEnd }: CardScrollSliderProps) {
  return createElement('input', {
    'aria-label': 'Scroll cards',
    className: 'card-scroll-range',
    max,
    min: 0,
    onChange: (event: Event) => {
      const target = event.target as HTMLInputElement;
      onChangeEnd?.(Number(target.value));
    },
    onInput: (event: Event) => {
      const target = event.target as HTMLInputElement;
      onChange(Number(target.value));
    },
    step: 'any',
    type: 'range',
    value,
  });
}

export function CardScrollSlider({
  value,
  max,
  onChange,
  onChangeEnd,
}: CardScrollSliderProps) {
  const trackWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  const onChangeEndRef = useRef(onChangeEnd);
  const maxRef = useRef(max);

  onChangeRef.current = onChange;
  onChangeEndRef.current = onChangeEnd;
  maxRef.current = max;

  const setValueFromLocationX = (locationX: number, snap: boolean) => {
    const trackWidth = trackWidthRef.current;
    const currentMax = maxRef.current;
    if (trackWidth <= 0 || currentMax <= 0) return;

    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    const nextValue = snap ? Math.round(ratio * currentMax) : ratio * currentMax;
    onChangeRef.current(nextValue);
    if (snap) {
      onChangeEndRef.current?.(nextValue);
    }
  };

  if (max <= 0) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={{ paddingTop: 6, width: '100%' }}>
        <WebRangeSlider
          max={max}
          onChange={onChange}
          onChangeEnd={onChangeEnd}
          value={value}
        />
      </View>
    );
  }

  return (
    <View style={{ paddingTop: 6, width: '100%' }}>
      <View
        accessibilityLabel="Scroll cards"
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max, now: Math.round(value) }}
        onLayout={(event: LayoutChangeEvent) => {
          trackWidthRef.current = event.nativeEvent.layout.width;
        }}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          setValueFromLocationX(event.nativeEvent.locationX, false);
        }}
        onResponderMove={(event) => {
          setValueFromLocationX(event.nativeEvent.locationX, false);
        }}
        onResponderRelease={(event) => {
          setValueFromLocationX(event.nativeEvent.locationX, true);
        }}
        onStartShouldSetResponder={() => true}
        style={{
          height: 16,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            backgroundColor: TRACK_COLOR,
            borderRadius: 999,
            height: 2,
            width: '100%',
          }}
        />
      </View>
    </View>
  );
}
