import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { MoneyEntry } from '@/types/finance';

function getUpiParameters(entry: MoneyEntry, noteTitle: string) {
  const amount = (entry.amountPaise / 100).toFixed(2);
  const recipient = entry.recipientUpiId?.trim() ?? '';
  const description = `${noteTitle} - ${entry.title}`.slice(0, 250);
  const ref = entry.paymentReference ?? 'moneytracker';

  return {
    pa: encodeURIComponent(recipient),
    am: encodeURIComponent(amount),
    pn: encodeURIComponent(noteTitle),
    tn: encodeURIComponent(description),
    cu: 'INR',
    tr: encodeURIComponent(ref),
  };
}

export function buildUpiUri(entry: MoneyEntry, noteTitle: string) {
  const params = getUpiParameters(entry, noteTitle);
  const base = `upi://pay?pa=${params.pa}&am=${params.am}&pn=${params.pn}&tn=${params.tn}&cu=${params.cu}&tr=${params.tr}`;

  if (Platform.OS === 'android') {
    return `${base}&mode=02`;
  }

  return base;
}

export async function openUpiPayment(entry: MoneyEntry, noteTitle: string): Promise<boolean> {
  const recipient = entry.recipientUpiId?.trim();
  if (entry.amountPaise <= 0) return false;

  if (!recipient) {
    const appCandidates = Platform.OS === 'ios'
      ? ['gpay://', 'upi://pay', 'googlepay://', 'tez://']
      : ['upi://pay', 'gpay://', 'googlepay://', 'tez://'];

    for (const candidate of appCandidates) {
      try {
        await Linking.openURL(candidate);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  const amount = (entry.amountPaise / 100).toFixed(2);
  const displayName = noteTitle || 'Money Tracker';
  const fallbackUri = `upi://pay?pa=${encodeURIComponent(recipient)}&am=${encodeURIComponent(amount)}&pn=${encodeURIComponent(displayName)}&tn=${encodeURIComponent(entry.title)}&cu=INR`;
  const googlePayUri = `gpay://upi/pay?pa=${encodeURIComponent(recipient)}&am=${encodeURIComponent(amount)}&pn=${encodeURIComponent(displayName)}&tn=${encodeURIComponent(entry.title)}&cu=INR`;

  const candidates = Platform.OS === 'ios'
    ? [
      googlePayUri,
      buildUpiUri(entry, noteTitle),
      fallbackUri,
      `googlepay://upi/pay?pa=${encodeURIComponent(recipient)}&am=${encodeURIComponent(amount)}&pn=${encodeURIComponent(displayName)}&tn=${encodeURIComponent(entry.title)}&cu=INR`,
      `tez://upi/pay?pa=${encodeURIComponent(recipient)}&am=${encodeURIComponent(amount)}&pn=${encodeURIComponent(displayName)}&tn=${encodeURIComponent(entry.title)}&cu=INR`,
    ]
    : [
      buildUpiUri(entry, noteTitle),
      fallbackUri,
      googlePayUri,
      `googlepay://upi/pay?pa=${encodeURIComponent(recipient)}&am=${encodeURIComponent(amount)}&pn=${encodeURIComponent(displayName)}&tn=${encodeURIComponent(entry.title)}&cu=INR`,
      `tez://upi/pay?pa=${encodeURIComponent(recipient)}&am=${encodeURIComponent(amount)}&pn=${encodeURIComponent(displayName)}&tn=${encodeURIComponent(entry.title)}&cu=INR`,
    ];

  for (const candidate of candidates) {
    try {
      await Linking.openURL(candidate);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}
