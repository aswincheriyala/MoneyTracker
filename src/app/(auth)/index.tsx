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
            <Text style={styles.eyebrow}>A LITTLE MORE CLARITY</Text>
            <Text style={styles.title}>Your money,{'\n'}in better focus.</Text>
            <View style={styles.accentRule}>
              <View style={styles.accentPrimary} />
              <View style={styles.accentSecondary} />
            </View>
          </View>
        </View>

        <View style={styles.signIn}>
          <View style={styles.divider} />
          <Text style={styles.welcome}>Welcome</Text>
          <Text style={styles.instruction}>Sign in to continue.</Text>
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
    marginTop: 62,
    gap: 15,
  },
  eyebrow: {
    color: MoneyTheme.clay,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    maxWidth: 340,
    color: MoneyTheme.ink,
    fontFamily: 'serif',
    fontSize: 42,
    fontWeight: '500',
    lineHeight: 49,
  },
  accentRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
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
  signIn: {
    marginTop: 56,
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
    fontSize: 15,
    lineHeight: 22,
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
