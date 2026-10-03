import { Redirect } from 'expo-router';

import { useAppData } from '@/context/app-context';

export default function AppIndex() {
  const { user, loading } = useAppData();

  if (loading) {
    return null;
  }

  return <Redirect href={user ? '/(app)' : '/(auth)'} />;
}
