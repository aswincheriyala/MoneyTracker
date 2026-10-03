import { MoneyTheme } from '@/constants/money-theme';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function AuthCallbackScreen() {
  return (
    <View style={styles.screen}>
      <ActivityIndicator color={MoneyTheme.pine} />
      <Text style={styles.message}>Completing sign-in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: MoneyTheme.canvas,
  },
  message: {
    color: MoneyTheme.ink,
    fontFamily: 'serif',
    fontSize: 17,
  },
});
