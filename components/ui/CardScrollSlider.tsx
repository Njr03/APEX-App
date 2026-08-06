import { useRef } from 'react';
import {
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
} from 'react-native';

const TRACK_COLOR = 'rgba(255,255,255,0.08)';

interface CardScrollSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function CardScrollSlider({ value, max, onChange }: CardScrollSliderProps) {
  const trackWidthRef = useRef(0);

  const setValueFromX = (x: number) => {
    const trackWidth = trackWidthRef.current;
    if (trackWidth <= 0 || max <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / trackWidth));
    onChange(Math.round(ratio * max));
  };

  if (max <= 0) {
    return null;
  }

  return (
    <View style={{ paddingTop: 10 }}>
      <Pressable
        accessibilityLabel="Scroll cards"
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max, now: value }}
        onLayout={(event: LayoutChangeEvent) => {
          trackWidthRef.current = event.nativeEvent.layout.width;
        }}
        onPress={(event) => setValueFromX(event.nativeEvent.locationX)}
        style={{
          height: 20,
          justifyContent: 'center',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' as const } : {}),
        }}
      >
        <View
          style={{
            backgroundColor: TRACK_COLOR,
            borderRadius: 999,
            height: 4,
          }}
        />
      </Pressable>
    </View>
  );
}
