import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={theme.pine} />
      <Text style={styles.message}>Completing sign-in…</Text>
    </View>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: theme.canvas,
  },
  message: {
    color: theme.ink,
    fontFamily: 'serif',
    fontSize: 17,
  },
});
