import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

type AnimatedModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  maxHeight?: number | `${number}%`;
};

const SPRING_CONFIG = { damping: 20, stiffness: 260, mass: 0.6 };

export function AnimatedModal({ visible, onClose, children, maxHeight = '85%' }: AnimatedModalProps) {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [isRendered, setIsRendered] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);
  const keyboardHeight = useSharedValue(0);

  if (visible && !isRendered) {
    setIsRendered(true);
  }

  useEffect(() => {
    if (visible) {
      progress.value = withSpring(1, SPRING_CONFIG);
    } else {
      progress.value = withTiming(0, { duration: 180 }, (finished) => {
        'worklet';
        if (finished) scheduleOnRN(setIsRendered, false);
      });
    }
  }, [visible, progress]);

  useEffect(() => {
    if (!visible) return;
    if (Platform.OS === 'ios') {
      const showSub = Keyboard.addListener('keyboardWillShow', (event) => {
        keyboardHeight.value = withTiming(event.endCoordinates.height, { duration: event.duration || 250 });
      });
      const hideSub = Keyboard.addListener('keyboardWillHide', (event) => {
        keyboardHeight.value = withTiming(0, { duration: event.duration || 250 });
      });
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardHeight.value = withTiming(event.endCoordinates.height, { duration: 200 });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeight.value = withTiming(0, { duration: 200 });
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible, keyboardHeight]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 40 },
      { scale: 0.96 + progress.value * 0.04 },
    ],
  }));

  const keyboardStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value,
  }));

  if (!isRendered) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Dismiss" />
        <Animated.View style={[styles.keyboardContainer, keyboardStyle]} pointerEvents="box-none">
          <Animated.View style={[styles.card, { maxHeight }, cardStyle]}>
            {children}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.overlay,
  },
  keyboardContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 20,
    gap: 14,
  },
});
