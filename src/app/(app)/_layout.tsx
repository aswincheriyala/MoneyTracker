import { Redirect, Stack } from 'expo-router';

import { useAppData } from '@/context/app-context';

export default function AppLayout() {
  const { user, loading } = useAppData();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#edf1e9' } }}>
      {/* <Stack.Screen name="index" /> */}
      <Stack.Screen
        name="notes/[id]"
        options={{
          headerShown: true,
          title: 'Note',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#edf1e9' },
          headerTintColor: '#183d32',
          headerTitleStyle: { fontFamily: 'serif' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: true,
          title: 'Profile',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#edf1e9' },
          headerTintColor: '#183d32',
          headerTitleStyle: { fontFamily: 'serif' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="payment-confirm"
        options={{
          headerShown: true,
          title: 'Confirm payment',
          headerBackButtonDisplayMode: 'minimal',
          headerStyle: { backgroundColor: '#edf1e9' },
          headerTintColor: '#183d32',
          headerTitleStyle: { fontFamily: 'serif' },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
