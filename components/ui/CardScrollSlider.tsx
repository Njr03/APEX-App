import { useState } from 'react';
import {
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import { colors } from '@/constants/theme';

const TRACK_COLOR = 'rgba(255,255,255,0.08)';

interface CardScrollSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
}

export function CardScrollSlider({ value, max, onChange }: CardScrollSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = max > 0 ? value / max : 0;

  const setValueFromX = (x: number) => {
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
          setTrackWidth(event.nativeEvent.layout.width);
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
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              backgroundColor: colors.accent,
              borderRadius: 999,
              height: 4,
              width: trackWidth > 0 ? Math.max(12, progress * trackWidth) : 0,
            }}
          />
        </View>
      </Pressable>
    </View>
  );
}
