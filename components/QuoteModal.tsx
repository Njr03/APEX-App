import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { fonts } from '@/constants/theme';
import { useQuoteStore } from '@/stores/quoteStore';

const CARD_BG = '#0d0d1b';
const QUOTE_TEXT = '#e8e6f0';
const AUTHOR_TEXT = 'rgba(232, 230, 240, 0.50)';
const ACCENT = '#c8ff5a';
const ACCENT_DIVIDER = 'rgba(200, 255, 90, 0.15)';
const BACKDROP = 'rgba(0, 0, 0, 0.88)';

export function QuoteModal() {
  const { width: windowWidth } = useWindowDimensions();
  const isVisible = useQuoteStore((state) => state.isVisible);
  const currentQuote = useQuoteStore((state) => state.currentQuote);
  const closeQuote = useQuoteStore((state) => state.closeQuote);
  const nextQuote = useQuoteStore((state) => state.nextQuote);

  const [mounted, setMounted] = useState(isVisible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.93)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const isAnimatingQuote = useRef(false);

  const cardWidth = Math.min(windowWidth * 0.88, 480);

  useEffect(() => {
    if (isVisible) {
      overlayOpacity.setValue(0);
      cardScale.setValue(0.93);
      setMounted(true);

      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      return;
    }

    if (!mounted) return;

    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.93,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [cardScale, isVisible, mounted, overlayOpacity]);

  const handleNextQuote = () => {
    if (isAnimatingQuote.current) return;

    isAnimatingQuote.current = true;

    Animated.timing(textOpacity, {
      toValue: 0,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        isAnimatingQuote.current = false;
        return;
      }

      nextQuote();

      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 140,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        isAnimatingQuote.current = false;
      });
    });
  };

  if (!mounted) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={closeQuote} transparent visible={mounted}>
      <View style={styles.root}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
        >
          {Platform.OS === 'web' ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.webBackdrop,
                { backgroundColor: BACKDROP },
              ]}
            />
          ) : (
            <>
              <BlurView intensity={18} style={StyleSheet.absoluteFill} tint="dark" />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: BACKDROP }]} />
            </>
          )}
        </Animated.View>

        <Pressable
          accessibilityLabel="Close quote"
          accessibilityRole="button"
          onPress={closeQuote}
          style={StyleSheet.absoluteFill}
        />

        <View pointerEvents="box-none" style={styles.centerStage}>
          <Animated.View
            pointerEvents="auto"
            style={[
              styles.card,
              {
                opacity: overlayOpacity,
                transform: [{ scale: cardScale }],
                width: cardWidth,
              },
            ]}
          >
            <Text pointerEvents="none" style={styles.decorativeQuote}>
              "
            </Text>

            <Animated.View style={{ marginTop: 32, opacity: textOpacity }}>
              <Text style={[styles.quoteText, { minHeight: 80 }]}>{currentQuote.quote}</Text>
              <Text style={styles.authorText}>— {currentQuote.author}</Text>
            </Animated.View>

            <View style={styles.divider} />

            <View style={styles.buttonRow}>
              <Pressable
                accessibilityRole="button"
                onPress={closeQuote}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.closeButtonPressed,
                ]}
              >
                <Text style={styles.closeButtonLabel}>Close</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleNextQuote}
                style={({ pressed }) => [
                  styles.newQuoteButton,
                  pressed && styles.newQuoteButtonPressed,
                ]}
              >
                <Text style={styles.newQuoteButtonLabel}>New Quote →</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  webBackdrop: {
    backdropFilter: 'blur(10px)',
  } as object,
  centerStage: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: CARD_BG,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 32,
    paddingHorizontal: 36,
    paddingTop: 44,
    shadowColor: '#000000',
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 64,
    elevation: 24,
  },
  decorativeQuote: {
    color: 'rgba(200, 255, 90, 0.12)',
    fontFamily: fonts.brand,
    fontSize: 100,
    fontWeight: '800',
    left: 24,
    lineHeight: 100,
    position: 'absolute',
    top: -10,
    zIndex: 0,
  },
  quoteText: {
    color: QUOTE_TEXT,
    fontFamily: fonts.brand,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 33,
    textAlign: 'center',
    textTransform: 'none',
    zIndex: 1,
  },
  authorText: {
    color: AUTHOR_TEXT,
    fontFamily: fonts.jetbrainsMono,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 18,
    textAlign: 'center',
    textTransform: 'none',
    zIndex: 1,
  },
  divider: {
    backgroundColor: ACCENT_DIVIDER,
    height: 1,
    marginBottom: 24,
    marginTop: 28,
    width: '100%',
  },
  buttonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    borderColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  closeButtonPressed: {
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  closeButtonLabel: {
    color: 'rgba(232, 230, 240, 0.55)',
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'none',
  },
  newQuoteButton: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  newQuoteButtonPressed: {
    opacity: 0.85,
  },
  newQuoteButtonLabel: {
    color: '#07070f',
    fontFamily: fonts.brand,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'none',
  },
});
