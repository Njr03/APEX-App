import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { fonts } from '@/constants/theme';
import { useWorkoutSessionStore } from '@/stores/workoutSessionStore';

const CARD_BG = '#0d0d1b';
const BORDER = 'rgba(255,255,255,0.11)';
const MUTED = 'rgba(240,237,232,0.5)';
const LIME = '#c8ff5a';
const RING_RADIUS = 19;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function RestTimerBanner() {
  const restEndsAt = useWorkoutSessionStore((s) => s.restEndsAt);
  const restTotalSeconds = useWorkoutSessionStore((s) => s.restTotalSeconds);
  const clearRestTimer = useWorkoutSessionStore((s) => s.clearRestTimer);

  const [remaining, setRemaining] = useState(0);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => {
    clearPendingTimeout();

    if (!restEndsAt) {
      setVisible(false);
      setRemaining(0);
      return;
    }

    setVisible(true);

    const tick = () => {
      const left = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRemaining(left);

      if (left <= 0) {
        clearRestTimer();
        setVisible(false);
        return;
      }

      timeoutRef.current = setTimeout(tick, 1000);
    };

    tick();

    return () => {
      clearPendingTimeout();
    };
  }, [restEndsAt, clearRestTimer]);

  const handleSkip = () => {
    clearPendingTimeout();
    clearRestTimer();
    setVisible(false);
    setRemaining(0);
  };

  if (!visible || !restEndsAt || remaining <= 0) {
    return null;
  }

  const totalSeconds = Math.max(restTotalSeconds, 1);
  const progress = remaining / totalSeconds;
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <View
      className={Platform.OS === 'web' ? 'rest-timer-toast' : undefined}
      style={{
        backgroundColor: CARD_BG,
        borderColor: BORDER,
        borderRadius: 14,
        borderWidth: 1,
        bottom: 24,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        flexDirection: 'row',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        position: 'absolute',
        right: 24,
        zIndex: 50,
      }}
    >
      <View style={{ height: 44, position: 'relative', width: 44 }}>
        <Svg height={44} width={44}>
          <Circle
            cx={22}
            cy={22}
            fill="none"
            r={RING_RADIUS}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={3}
          />
          <Circle
            cx={22}
            cy={22}
            fill="none"
            r={RING_RADIUS}
            stroke={LIME}
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            strokeWidth={3}
            transform="rotate(-90 22 22)"
          />
        </Svg>
        <View
          style={{
            alignItems: 'center',
            bottom: 0,
            justifyContent: 'center',
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        >
          <Text
            style={{
              color: LIME,
              fontFamily: fonts.jetbrainsMono,
              fontSize: 13,
              fontWeight: '600',
            }}
          >
            {remaining}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text
          style={{
            color: '#f0ede8',
            fontFamily: fonts.bodySemiBold,
            fontSize: 11,
          }}
        >
          Rest Timer
        </Text>
        <Text
          style={{
            color: MUTED,
            fontFamily: fonts.body,
            fontSize: 10,
            marginTop: 2,
          }}
        >
          Next set in {remaining}s
        </Text>
      </View>

      <Pressable
        accessibilityLabel="Skip rest timer"
        accessibilityRole="button"
        onPress={handleSkip}
        style={{
          alignSelf: 'center',
          borderColor: 'rgba(255,255,255,0.11)',
          borderRadius: 6,
          borderWidth: 1,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text
          style={{
            color: MUTED,
            fontFamily: fonts.body,
            fontSize: 10,
          }}
        >
          Skip
        </Text>
      </Pressable>
    </View>
  );
}
