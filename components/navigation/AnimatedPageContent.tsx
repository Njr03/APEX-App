import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useNavigationStore } from '@/stores/navigationStore';

interface AnimatedPageContentProps extends ViewProps {
  children: ReactNode;
}

export function AnimatedPageContent({
  children,
  className,
  style,
  ...props
}: AnimatedPageContentProps) {
  const activePage = useNavigationStore((state) => state.activePage);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = 0;
    translateY.value = 10;
    opacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [activePage, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className={`flex-1 ${className ?? ''}`} style={[styles.container, style]} {...props}>
      <Animated.View style={[styles.content, animatedStyle]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
