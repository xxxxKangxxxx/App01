import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useOnboardingStore } from '../store/onboarding.store';
import { authApi } from '../services/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

import { queryClient } from '../lib/queryClient';

function RootLayoutNav() {
  const { accessToken, isLoading, loadTokens } = useAuthStore();
  const { loadTheme, colors } = useThemeStore();
  const { hasSeenOnboarding, loadOnboarding } = useOnboardingStore();

  useEffect(() => {
    loadTokens();
    loadTheme();
    loadOnboarding();
  }, [loadTokens, loadTheme, loadOnboarding]);

  useEffect(() => {
    if (!isLoading) {
      if (!accessToken) {
        router.replace('/(auth)/login');
      } else {
        router.replace('/');
        registerForPushNotifications();
        if (!hasSeenOnboarding) {
          setTimeout(() => router.push('/modals/onboarding'), 300);
        }
      }
    }
  }, [accessToken, isLoading, hasSeenOnboarding]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
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
      <Stack.Screen
        name="modals/onboarding"
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack>
  );
}

async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
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
