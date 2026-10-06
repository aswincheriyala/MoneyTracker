import { MoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const { signIn, loading } = useAppData();

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      router.replace('/(app)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start Google sign-in.';
      Alert.alert('Google sign-in unavailable', message);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.page}>
        <View>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <View style={styles.markLineLong} />
              <View style={styles.markLineShort} />
              <View style={styles.markLineLong} />
            </View>
            <View style={styles.brandCopy}>
              <Text style={styles.brandName}>MONEY TRACKER</Text>
              <Text style={styles.brandLabel}>PERSONAL FINANCE</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>KNOW WHERE IT GOES</Text>
            <Text style={styles.title}>Big amount in.{'\n'}Small amounts out.</Text>
            <Text style={styles.subtitle}>Break any lump sum into items. Track each one.</Text>
            <View style={styles.accentRule}>
              <View style={styles.accentPrimary} />
              <View style={styles.accentSecondary} />
            </View>
          </View>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <View style={styles.featureMark}>
                <View style={[styles.featureBar, styles.featureBarFull]} />
                <View style={[styles.featureBar, styles.featureBarMid]} />
                <View style={[styles.featureBar, styles.featureBarSmall]} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>Break it down</Text>
                <Text style={styles.featureBody}>One big amount, small named items.</Text>
              </View>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureMark}>
                <View style={styles.featureCheckWrap}>
                  <Text style={styles.featureCheck}>✓</Text>
                </View>
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>Paid or pending</Text>
                <Text style={styles.featureBody}>Always know what{'\u2019'}s left.</Text>
              </View>
            </View>
            <View style={styles.featureRow}>
              <View style={styles.featureMark}>
                <Text style={styles.featureRupee}>₹</Text>
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>Pay via UPI</Text>
                <Text style={styles.featureBody}>Pay in your UPI app. Confirm here.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.signIn}>
          <View style={styles.divider} />
          <Text style={styles.welcome}>Start tracking</Text>
          <Text style={styles.instruction}>Sign in. Sync everywhere.</Text>
          <Pressable
            style={({ pressed }) => [styles.googleButton, pressed && !loading && styles.googleButtonPressed]}
            onPress={handleGoogleSignIn}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.googleButtonText}>{loading ? 'Preparing...' : 'Continue with Google'}</Text>
            <Text style={styles.buttonArrow}>›</Text>
          </Pressable>
          <Text style={styles.securityNote}>SECURE SIGN-IN  /  GOOGLE</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MoneyTheme.canvas,
  },
  page: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 32,
    backgroundColor: MoneyTheme.canvas,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 4,
    backgroundColor: MoneyTheme.pine,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    gap: 4,
  },
  markLineLong: {
    width: 21,
    height: 2,
    backgroundColor: MoneyTheme.sand,
  },
  markLineShort: {
    width: 14,
    height: 2,
    backgroundColor: MoneyTheme.sand,
  },
  brandCopy: {
    gap: 3,
  },
  brandName: {
    color: MoneyTheme.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  brandLabel: {
    color: MoneyTheme.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  hero: {
    marginTop: 44,
    gap: 14,
  },
  eyebrow: {
    color: MoneyTheme.clay,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    maxWidth: 340,
    color: MoneyTheme.ink,
    fontFamily: 'serif',
    fontSize: 40,
    fontWeight: '500',
    lineHeight: 47,
  },
  subtitle: {
    maxWidth: 330,
    color: MoneyTheme.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  accentRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  accentPrimary: {
    width: 34,
    height: 3,
    backgroundColor: MoneyTheme.clay,
  },
  accentSecondary: {
    width: 14,
    height: 3,
    backgroundColor: MoneyTheme.sand,
  },
  featureList: {
    marginTop: 34,
    gap: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureMark: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: MoneyTheme.surfaceSoft,
    borderWidth: 1,
    borderColor: MoneyTheme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: MoneyTheme.pine,
    alignSelf: 'flex-start',
    marginLeft: 9,
  },
  featureBarFull: {
    width: 18,
  },
  featureBarMid: {
    width: 12,
    marginTop: 3,
  },
  featureBarSmall: {
    width: 7,
    marginTop: 3,
  },
  featureCheckWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: MoneyTheme.paid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCheck: {
    color: MoneyTheme.surface,
    fontSize: 11,
    fontWeight: '900',
  },
  featureRupee: {
    color: MoneyTheme.clay,
    fontSize: 17,
    fontWeight: '800',
  },
  featureCopy: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    color: MoneyTheme.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  featureBody: {
    color: MoneyTheme.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  signIn: {
    marginTop: 40,
  },
  divider: {
    height: 1,
    backgroundColor: MoneyTheme.line,
    marginBottom: 24,
  },
  welcome: {
    color: MoneyTheme.ink,
    fontSize: 23,
    fontWeight: '700',
  },
  instruction: {
    color: MoneyTheme.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 5,
    marginBottom: 20,
  },
  googleButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderRadius: 5,
    backgroundColor: MoneyTheme.pine,
  },
  googleButtonPressed: {
    backgroundColor: MoneyTheme.pinePressed,
  },
  googleMark: {
    position: 'absolute',
    left: 18,
    color: MoneyTheme.sand,
    fontSize: 19,
    fontWeight: '700',
  },
  googleButtonText: {
    color: MoneyTheme.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonArrow: {
    position: 'absolute',
    right: 18,
    color: MoneyTheme.sand,
    fontSize: 25,
    lineHeight: 28,
  },
  securityNote: {
    marginTop: 18,
    color: MoneyTheme.quiet,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
