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
import { X } from 'lucide-react-native';

import { fonts } from '@/constants/theme';
import { useQuoteStore } from '@/stores/quoteStore';

const CARD_BG = '#0d0d1b';
const QUOTE_TEXT = '#e8e6f0';
const AUTHOR_TEXT = 'rgba(232, 230, 240, 0.50)';
const BACKDROP = 'rgba(0, 0, 0, 0.88)';

export function QuoteModal() {
  const { width: windowWidth } = useWindowDimensions();
  const isVisible = useQuoteStore((state) => state.isVisible);
  const currentQuote = useQuoteStore((state) => state.currentQuote);
  const closeQuote = useQuoteStore((state) => state.closeQuote);

  const [mounted, setMounted] = useState(isVisible);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.93)).current;

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
          <View
            style={[
              StyleSheet.absoluteFill,
              Platform.OS === 'web' ? styles.webBackdrop : null,
              { backgroundColor: BACKDROP },
            ]}
          />
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
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={closeQuote}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.closeButtonPressed,
              ]}
            >
              <X color="rgba(232, 230, 240, 0.55)" size={18} strokeWidth={2} />
            </Pressable>

            <Text pointerEvents="none" style={styles.decorativeQuote}>
              "
            </Text>

            <View style={{ marginTop: 32 }}>
              <Text style={[styles.quoteText, { minHeight: 80 }]}>{currentQuote.quote}</Text>
              <Text style={styles.authorText}>— {currentQuote.author}</Text>
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
    paddingBottom: 36,
    paddingHorizontal: 36,
    paddingTop: 44,
    shadowColor: '#000000',
    shadowOffset: { height: 24, width: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 64,
    elevation: 24,
  },
  closeButton: {
    alignItems: 'center',
    borderColor: 'rgba(255, 255, 255, 0.11)',
    borderRadius: 10,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    top: 16,
    width: 32,
    zIndex: 2,
  },
  closeButtonPressed: {
    borderColor: 'rgba(255, 255, 255, 0.22)',
    opacity: 0.85,
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
});
