import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';
import { formatCurrency, getNoteSummary } from '@/lib/finance';
import { ThemePreference, useThemePreference } from '@/lib/theme-preference';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [themePreference, setThemePreference] = useThemePreference();
  const { user, notes, entries, signOut, syncData, syncing, lastSyncedAt, pendingChangeCount } = useAppData();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const totalNotes = notes.length;
  const sumTracked = notes.reduce((acc, note) => acc + getNoteSummary(note, entries).totalPaise, 0);

  const performSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)');
    } catch (error) {
      Alert.alert('Sign-out failed', error instanceof Error ? error.message : 'Unknown error');
      setIsSigningOut(false);
    }
  };

  const handleSignOut = async () => {
    if (isSigningOut || syncing) return;

    if (pendingChangeCount > 0) {
      Alert.alert(
        'Unsynced changes',
        `You have ${pendingChangeCount} unsynced changes. Signing out removes this device's data and will permanently discard them. Sync first?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sync now', onPress: () => void handleSync() },
          {
            text: 'Discard & sign out',
            style: 'destructive',
            onPress: () => void performSignOut(),
          },
        ],
      );
      return;
    }

    await performSignOut();
  };

  const handleSync = async () => {
    try {
      await syncData();
      Alert.alert('Sync complete', 'Your data is up to date.');
    } catch (error) {
      Alert.alert('Sync failed', error instanceof Error ? error.message : 'Unable to sync right now.');
    }
  };

  const syncStatus = lastSyncedAt
    ? `Last synced ${new Date(lastSyncedAt).toLocaleString()}`
    : 'Not synced yet';

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.displayName?.slice(0, 1).toUpperCase() ?? 'M'}</Text>
          </View>
          <Text style={styles.name}>{user?.displayName ?? 'Money Tracker User'}</Text>
          <Text style={styles.email}>{user?.email ?? 'No email available'}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Notes</Text>
            <Text style={styles.statValue}>{totalNotes}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Tracked</Text>
            <Text style={styles.statValue}>{formatCurrency(sumTracked)}</Text>
          </View>
        </View>

        <View style={styles.syncSection}>
          <View style={styles.syncCopy}>
            <Text style={styles.syncTitle}>Appearance</Text>
            <Text style={styles.syncStatus}>Choose how the app looks on this device.</Text>
          </View>
          <View style={styles.themeRow}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => {
              const isActive = themePreference === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.themeOption, isActive && styles.themeOptionActive]}
                  onPress={() => setThemePreference(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.themeOptionText, isActive && styles.themeOptionTextActive]}>
                    {option === 'system' ? 'System' : option === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.syncSection}>
          <View style={styles.syncCopy}>
            <Text style={styles.syncTitle}>Data sync</Text>
            <Text style={styles.syncStatus}>{syncStatus} · automatic after 10:00 PM while the app is open</Text>
          </View>
          <Pressable style={styles.syncButton} onPress={handleSync} disabled={syncing}>
            <Text style={styles.syncButtonText}>{syncing ? 'Syncing…' : 'Sync now'}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.signOutButton} onPress={handleSignOut} disabled={isSigningOut || syncing}>
          <Text style={styles.signOutText}>{isSigningOut ? 'Signing out…' : 'Sign out'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.canvas,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: theme.canvas,
    gap: 18,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: theme.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: theme.ink,
    fontWeight: '800',
    fontSize: 26,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.ink,
    fontFamily: 'serif',
  },
  email: {
    marginTop: 6,
    color: theme.muted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  syncSection: {
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 16,
    gap: 14,
  },
  syncCopy: {
    gap: 5,
  },
  syncTitle: {
    color: theme.ink,
    fontWeight: '700',
    fontSize: 16,
  },
  syncStatus: {
    color: theme.muted,
    fontSize: 13,
  },
  syncButton: {
    backgroundColor: theme.pine,
    borderRadius: 5,
    paddingVertical: 13,
    alignItems: 'center',
  },
  syncButtonText: {
    color: theme.surface,
    fontWeight: '700',
    fontSize: 15,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.canvas,
    alignItems: 'center',
  },
  themeOptionActive: {
    backgroundColor: theme.pine,
    borderColor: theme.pine,
  },
  themeOptionText: {
    color: theme.ink,
    fontWeight: '700',
    fontSize: 13,
  },
  themeOptionTextActive: {
    color: theme.surface,
  },
  statBox: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 18,
  },
  statLabel: {
    color: theme.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 8,
    color: theme.ink,
    fontSize: 18,
    fontWeight: '800',
  },
  signOutButton: {
    backgroundColor: theme.dangerSoft,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: theme.danger,
    fontWeight: '700',
    fontSize: 16,
  },
});
