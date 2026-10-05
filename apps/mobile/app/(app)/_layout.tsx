import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="profile" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
