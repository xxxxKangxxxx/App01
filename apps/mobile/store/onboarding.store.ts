import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'freshbox_onboarding_completed';

interface OnboardingState {
  hasSeenOnboarding: boolean;
  setOnboardingComplete: () => Promise<void>;
  loadOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  hasSeenOnboarding: false,

  setOnboardingComplete: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasSeenOnboarding: true });
  },

  loadOnboarding: async () => {
    try {
      const saved = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ hasSeenOnboarding: saved === 'true' });
    } catch {
      // 기본값 유지
    }
  },
}));
