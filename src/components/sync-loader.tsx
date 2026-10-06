import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

export function SyncLoader({ message = 'Fetching your notes…' }: { message?: string }) {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const barScale = useSharedValue(1);
  const dotOne = useSharedValue(0.35);
  const dotTwo = useSharedValue(0.35);
  const dotThree = useSharedValue(0.35);

  useEffect(() => {
    barScale.value = withRepeat(
      withSequence(
        withTiming(1.8, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    const pulse = withRepeat(
      withSequence(
        withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }),
        withTiming(0.35, { duration: 400, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    dotOne.value = pulse;
    dotTwo.value = withDelay(140, pulse);
    dotThree.value = withDelay(280, pulse);
  }, [barScale, dotOne, dotTwo, dotThree]);

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: barScale.value }],
  }));

  const dotOneStyle = useAnimatedStyle(() => ({
    opacity: dotOne.value,
    transform: [{ translateY: (1 - dotOne.value) * -6 }],
  }));
  const dotTwoStyle = useAnimatedStyle(() => ({
    opacity: dotTwo.value,
    transform: [{ translateY: (1 - dotTwo.value) * -6 }],
  }));
  const dotThreeStyle = useAnimatedStyle(() => ({
    opacity: dotThree.value,
    transform: [{ translateY: (1 - dotThree.value) * -6 }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Animated.View style={[styles.markLine, styles.markLineLong, barStyle]} />
        <View style={[styles.markLine, styles.markLineShort]} />
        <Animated.View style={[styles.markLine, styles.markLineLong, barStyle]} />
      </View>
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, dotOneStyle]} />
        <Animated.View style={[styles.dot, dotTwoStyle]} />
        <Animated.View style={[styles.dot, dotThreeStyle]} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 48,
  },
  mark: {
    gap: 5,
    alignItems: 'center',
  },
  markLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.pine,
  },
  markLineLong: {
    width: 34,
  },
  markLineShort: {
    width: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.clay,
  },
  message: {
    color: theme.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
