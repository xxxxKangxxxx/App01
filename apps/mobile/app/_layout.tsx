import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function RootLayoutNav() {
  const { accessToken, isLoading, loadTokens } = useAuthStore();

  useEffect(() => {
    loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    if (!isLoading) {
      if (!accessToken) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/(tabs)/');
        registerForPushNotifications();
      }
    }
  }, [accessToken, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modals/refrigerator-setup"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/shelf-detail"
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="modals/fridge-detail"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const pushToken = tokenData.data;

  try {
    await authApi.updatePushToken(pushToken);
  } catch {
    // silent fail
  }
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}
