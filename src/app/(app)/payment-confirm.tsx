import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';
import { formatCurrency } from '@/lib/finance';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaymentConfirmScreen() {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { entryId } = useLocalSearchParams<{ entryId: string; returnTo?: string }>();
  const { entries, togglePaidStatus } = useAppData();
  const entry = entries.find((item) => item.id === entryId);
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmPayment = async (didComplete: boolean) => {
    if (!entry) return;
    try {
      setIsSubmitting(true);
      await togglePaidStatus(entry.id, didComplete, didComplete ? reference.trim() || undefined : undefined);
      router.back();
    } catch (error) {
      Alert.alert('Unable to update payment status', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Entry not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Text style={styles.title}>Did you complete this payment?</Text>
        <Text style={styles.amount}>{formatCurrency(entry.amountPaise)}</Text>
        <Text style={styles.detail}>{entry.title}</Text>
        <TextInput
          value={reference}
          onChangeText={setReference}
          placeholder="UTR or transaction reference (optional)"
          placeholderTextColor={theme.quiet}
          style={styles.input}
        />

        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={() => confirmPayment(false)} disabled={isSubmitting}>
            <Text style={styles.secondaryText}>No, keep pending</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => confirmPayment(true)} disabled={isSubmitting}>
            <Text style={styles.primaryText}>{isSubmitting ? 'Saving…' : 'Yes, payment completed'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.canvas,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.canvas,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'serif',
    color: theme.ink,
  },
  amount: {
    fontSize: 30,
    fontWeight: '700',
    fontFamily: 'serif',
    color: theme.pine,
  },
  detail: {
    color: theme.muted,
    fontSize: 16,
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
    fontSize: 15,
    color: theme.ink,
  },
  buttonRow: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 10,
    marginTop: 8,
  },
  primaryButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: theme.pine,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: theme.surface,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    flexShrink: 1,
  },
  secondaryButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: theme.surface,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.line,
  },
  secondaryText: {
    color: theme.ink,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    flexShrink: 1,
  },
});
