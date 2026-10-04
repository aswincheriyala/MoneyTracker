import { useAppData } from '@/context/app-context';
import { formatCurrency, getNoteSummary } from '@/lib/finance';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#edf1e9',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#edf1e9',
    gap: 18,
  },
  card: {
    backgroundColor: '#fbfcf8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d4dbd0',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#e5ebe2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#183d32',
    fontWeight: '800',
    fontSize: 26,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#183d32',
    fontFamily: 'serif',
  },
  email: {
    marginTop: 6,
    color: '#69776d',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  syncSection: {
    backgroundColor: '#fbfcf8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d4dbd0',
    padding: 16,
    gap: 14,
  },
  syncCopy: {
    gap: 5,
  },
  syncTitle: {
    color: '#183d32',
    fontWeight: '700',
    fontSize: 16,
  },
  syncStatus: {
    color: '#69776d',
    fontSize: 13,
  },
  syncButton: {
    backgroundColor: '#183d32',
    borderRadius: 5,
    paddingVertical: 13,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#fbfcf8',
    fontWeight: '700',
    fontSize: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fbfcf8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d4dbd0',
    padding: 18,
  },
  statLabel: {
    color: '#69776d',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    marginTop: 8,
    color: '#183d32',
    fontSize: 18,
    fontWeight: '800',
  },
  signOutButton: {
    backgroundColor: '#f5e5df',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#a65345',
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: {
    color: '#a65345',
    fontWeight: '700',
    fontSize: 16,
  },
});
