import type { ConfigPlugin } from '@expo/config-plugins';
import { withAndroidManifest } from '@expo/config-plugins';

const UPI_PACKAGES = [
  'com.google.android.apps.nbu.paisa.user', // Google Pay
  'com.phonepe.app', // PhonePe
  'net.one97.paytm', // Paytm
  'in.org.npci.upiapp', // BHIM
  'in.amazon.mShop.android.shopping', // Amazon Pay
];

/**
 * Adds <queries> entries so the app can detect and launch known UPI apps
 * on Android 11+ (package visibility rules).
 */
const withUpiAppQueries: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;

    manifest.queries = manifest.queries ?? [{}];
    const queries = manifest.queries[0];

    queries.package = queries.package ?? [];
    const existing = new Set(queries.package.map((entry) => entry.$?.['android:name']));
    for (const packageName of UPI_PACKAGES) {
      if (!existing.has(packageName)) {
        queries.package.push({ $: { 'android:name': packageName } });
      }
    }

    queries.intent = queries.intent ?? [];
    const hasUpiViewIntent = queries.intent.some((intent) =>
      intent['action']?.some((action) => action.$?.['android:name'] === 'android.intent.action.VIEW')
      && intent['data']?.some((data) => data.$?.['android:scheme'] === 'upi'),
    );
    if (!hasUpiViewIntent) {
      queries.intent.push({
        action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
        data: [{ $: { 'android:scheme': 'upi' } }],
      });
    }

    return mod;
  });
};

export default withUpiAppQueries;
