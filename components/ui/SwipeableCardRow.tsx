import type { ReactNode } from 'react';
import { View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

interface SwipeableCardRowProps {
  animatedRowStyle: AnimatedStyle<ViewStyle>;
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  panGesture: ReturnType<typeof Gesture.Pan>;
  rowStyle?: StyleProp<ViewStyle>;
}

export function SwipeableCardRow({
  animatedRowStyle,
  children,
  containerStyle,
  onLayout,
  panGesture,
  rowStyle,
}: SwipeableCardRowProps) {
  return (
    <View onLayout={onLayout} style={[{ overflow: 'hidden', width: '100%' }, containerStyle]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            {
              alignItems: 'stretch',
              flexDirection: 'row',
            },
            rowStyle,
            animatedRowStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
