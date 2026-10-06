import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppProvider, useAppData } from '@/context/app-context';
import { loadThemePreference, useThemePreference } from '@/lib/theme-preference';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [preference] = useThemePreference();
  const colorScheme = preference === 'system' ? systemScheme : preference;

  useEffect(() => {
    void loadThemePreference();
  }, []);

  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootStack />
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const { user, loading } = useAppData();

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* <Stack.Screen name="index" /> */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="auth/callback" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
