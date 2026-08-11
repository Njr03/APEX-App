import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, View } from 'react-native';

import { ApexLogo } from '@/components/branding/ApexLogo';
import { getPlatformItem, setPlatformItem } from '@/lib/storage/platformStorage';
import { useQuoteStore } from '@/stores/quoteStore';

const QUOTE_HINT_KEY = 'apex_has_seen_quote';

interface ApexLogoQuoteTriggerProps {
  height?: number;
}

export function ApexLogoQuoteTrigger({ height = 65 }: ApexLogoQuoteTriggerProps) {
  const openQuote = useQuoteStore((state) => state.openQuote);
  const [showHint, setShowHint] = useState(false);
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    void getPlatformItem(QUOTE_HINT_KEY).then((value) => {
      setShowHint(value !== 'true');
    });
  }, []);

  useEffect(() => {
    if (!showHint) return;

    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseScale, {
            toValue: 1.5,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseScale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.2,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulseOpacity, pulseScale, showHint]);

  const handlePress = () => {
    void setPlatformItem(QUOTE_HINT_KEY, 'true');
    setShowHint(false);
    openQuote();
  };

  return (
    <Pressable
      accessibilityLabel="Tap for a motivational quote"
      accessibilityRole="button"
      hitSlop={{ bottom: 10, left: 10, right: 10, top: 10 }}
      onPress={handlePress}
      style={({ pressed }) => ({
        alignSelf: 'flex-start',
        opacity: pressed ? 0.72 : 1,
        transform: [{ scale: pressed ? 0.93 : 1 }],
      })}
    >
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {showHint ? (
          <Animated.View
            pointerEvents="none"
            style={{
              backgroundColor: 'rgba(200,255,90,0.20)',
              borderRadius: 999,
              height: height * 1.1,
              opacity: pulseOpacity,
              position: 'absolute',
              transform: [{ scale: pulseScale }],
              width: height * 1.1,
            }}
          />
        ) : null}
        <ApexLogo height={height} />
      </View>
    </Pressable>
  );
}
