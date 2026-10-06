import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import { MoneyEntry } from '@/types/finance';

export type UpiApp = {
  id: string;
  name: string;
  packageName: string;
  /** base64 data-URI PNG icon (Android only) */
  icon?: string;
  /** iOS scheme used to probe + launch, without trailing :// */
  iosScheme?: string;
};

export const KNOWN_UPI_APPS: UpiApp[] = [
  { id: 'gpay', name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user', iosScheme: 'gpay' },
  { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app', iosScheme: 'phonepe' },
  { id: 'paytm', name: 'Paytm', packageName: 'net.one97.paytm', iosScheme: 'paytm' },
  { id: 'bhim', name: 'BHIM', packageName: 'in.org.npci.upiapp', iosScheme: 'bhim' },
  { id: 'amazonpay', name: 'Amazon Pay', packageName: 'in.amazon.mShop.android.shopping', iosScheme: 'amazonpay' },
];

/**
 * Returns which of the known UPI apps are installed.
 * Android: probed via package icons. iOS: probed via canOpenURL on each
 * app's scheme (requires LSApplicationQueriesSchemes entries).
 */
export async function detectInstalledUpiApps(): Promise<UpiApp[]> {
  if (Platform.OS === 'android') {
    const checks = await Promise.all(
      KNOWN_UPI_APPS.map(async (app): Promise<UpiApp | null> => {
        try {
          // Returns '' when the package is not installed.
          const icon = await IntentLauncher.getApplicationIconAsync(app.packageName);
          if (!icon) return null;
          return { ...app, icon };
        } catch {
          return null;
        }
      }),
    );
    return checks.filter((app): app is UpiApp => app !== null);
  }

  const checks = await Promise.all(
    KNOWN_UPI_APPS.map(async (app): Promise<UpiApp | null> => {
      if (!app.iosScheme) return null;
      try {
        return (await Linking.canOpenURL(`${app.iosScheme}://`)) ? app : null;
      } catch {
        return null;
      }
    }),
  );
  return checks.filter((app): app is UpiApp => app !== null);
}

/**
 * Builds a canonical UPI payment URI (NPCI spec). Any UPI-capable app
 * (GPay, PhonePe, Paytm, BHIM, bank apps) can register for the `upi://` scheme;
 * the OS decides which app handles it, showing a chooser when several are installed.
 */
export function buildUpiUri(entry: MoneyEntry, noteTitle: string): string {
  const recipient = entry.recipientUpiId?.trim();
  const payeeName = noteTitle || 'Money Tracker';
  const description = `${payeeName} - ${entry.title}`.slice(0, 80);
  const ref = (entry.paymentReference ?? entry.id).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 35);

  const params = [
    `pa=${encodeURIComponent(recipient ?? '')}`,
    `pn=${encodeURIComponent(payeeName)}`,
    `cu=INR`,
    `tn=${encodeURIComponent(description)}`,
    `tr=${encodeURIComponent(ref)}`,
  ];

  // Only include the amount when a recipient is set — without a payee the user
  // is expected to pick a contact and enter an amount in the UPI app itself.
  if (recipient) {
    params.push(`am=${encodeURIComponent((entry.amountPaise / 100).toFixed(2))}`);
  }

  if (Platform.OS === 'android') {
    params.push('mode=02');
  }

  return `upi://pay?${params.join('&')}`;
}

/**
 * Builds the iOS deep link for a specific app. Most apps accept a direct
 * scheme swap (phonepe://pay?…). GPay is the exception: it needs
 * gpay://upi/pay?… with mode=02 or it opens without pre-filling.
 */
function buildIosAppUri(entry: MoneyEntry, noteTitle: string, app: UpiApp): string | null {
  if (!app.iosScheme) return null;

  const generic = buildUpiUri(entry, noteTitle);
  const pathAndQuery = generic.slice('upi'.length); // "://pay?…"

  if (app.id === 'gpay') {
    const withMode = /[?&]mode=/.test(generic) ? pathAndQuery : `${pathAndQuery}&mode=02`;
    return `gpay://upi/pay${withMode.slice('://pay'.length)}`;
  }

  return `${app.iosScheme}${pathAndQuery}`;
}

/**
 * Launches a specific UPI app the user picked.
 * Android: package-scoped intent — bypasses the system default handler.
 * iOS: app-scheme deep link carrying the same UPI payload; falls back to
 * plain upi:// for apps without a known scheme.
 */
export async function openUpiPaymentWithApp(entry: MoneyEntry, noteTitle: string, app: UpiApp): Promise<boolean> {
  if (entry.amountPaise <= 0) return false;
  const uri = buildUpiUri(entry, noteTitle);

  if (Platform.OS === 'android') {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: uri,
        packageName: app.packageName,
      });
      return true;
    } catch {
      return false;
    }
  }

  const schemeUri = buildIosAppUri(entry, noteTitle, app);
  if (!schemeUri) return false;
  try {
    await Linking.openURL(schemeUri);
    return true;
  } catch {
    try {
      await Linking.openURL(uri);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Opens the system UPI payment flow for an entry. When the entry has no
 * recipient UPI ID, the UPI app opens empty so the user can choose a payee.
 * Returns true when a UPI-capable app was found and launched.
 */
export async function openUpiPayment(entry: MoneyEntry, noteTitle: string): Promise<boolean> {
  if (entry.amountPaise <= 0) return false;

  const uri = buildUpiUri(entry, noteTitle);

  try {
    if (await Linking.canOpenURL(uri)) {
      await Linking.openURL(uri);
      return true;
    }
  } catch {
    // fall through
  }

  // Last resort: try opening anyway — some devices answer canOpenURL=false
  // for upi:// despite having UPI apps installed.
  try {
    await Linking.openURL(uri);
    return true;
  } catch {
    return false;
  }
}
