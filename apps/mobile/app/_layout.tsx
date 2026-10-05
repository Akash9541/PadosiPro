import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function RootLayout() {
  const loadToken = useAuthStore((s) => s.loadToken);

  useEffect(() => {
    loadToken();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}
