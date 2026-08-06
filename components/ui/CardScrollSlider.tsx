import { createElement, useRef } from 'react';
import {
  Platform,
  View,
  type LayoutChangeEvent,
} from 'react-native';

const TRACK_COLOR = 'rgba(255,255,255,0.08)';

interface CardScrollSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

function WebRangeSlider({ value, max, onChange }: CardScrollSliderProps) {
  return createElement('input', {
    'aria-label': 'Scroll cards',
    className: 'card-scroll-range',
    max,
    min: 0,
    onChange: (event: Event) => {
      const target = event.target as HTMLInputElement;
      onChange(Number(target.value));
    },
    onInput: (event: Event) => {
      const target = event.target as HTMLInputElement;
      onChange(Number(target.value));
    },
    step: 1,
    type: 'range',
    value,
  });
}

export function CardScrollSlider({ value, max, onChange }: CardScrollSliderProps) {
  const trackWidthRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValueFromLocationX = (locationX: number) => {
    const trackWidth = trackWidthRef.current;
    if (trackWidth <= 0 || max <= 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
    onChangeRef.current(Math.round(ratio * max));
  };

  if (max <= 0) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={{ paddingTop: 10, width: '100%' }}>
        <WebRangeSlider max={max} onChange={onChange} value={value} />
      </View>
    );
  }

  return (
    <View style={{ paddingTop: 10, width: '100%' }}>
      <View
        accessibilityLabel="Scroll cards"
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max, now: value }}
        onLayout={(event: LayoutChangeEvent) => {
          trackWidthRef.current = event.nativeEvent.layout.width;
        }}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => {
          setValueFromLocationX(event.nativeEvent.locationX);
        }}
        onResponderMove={(event) => {
          setValueFromLocationX(event.nativeEvent.locationX);
        }}
        onStartShouldSetResponder={() => true}
        style={{
          height: 24,
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            backgroundColor: TRACK_COLOR,
            borderRadius: 999,
            height: 4,
            width: '100%',
          }}
        />
      </View>
    </View>
  );
}
