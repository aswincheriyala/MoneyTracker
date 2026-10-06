import { Redirect, Stack } from 'expo-router';

import { useMoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';

export default function AppLayout() {
  const theme = useMoneyTheme();
  const { user, loading } = useAppData();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  const headerOptions = {
    headerBackButtonDisplayMode: 'minimal' as const,
    headerStyle: { backgroundColor: theme.canvas },
    headerTintColor: theme.ink,
    headerTitleStyle: { fontFamily: 'serif' },
    headerShadowVisible: false,
  };

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.canvas } }}>
      {/* <Stack.Screen name="index" /> */}
      <Stack.Screen
        name="notes/[id]"
        options={{
          headerShown: true,
          title: 'Note',
          ...headerOptions,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: 'Profile',
          ...headerOptions,
        }}
      />
      <Stack.Screen
        name="payment-confirm"
        options={{
          headerShown: true,
          title: 'Confirm payment',
          ...headerOptions,
        }}
      />
    </Stack>
  );
}
