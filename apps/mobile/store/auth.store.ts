import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthUser } from '@freshbox/types';
import { queryClient } from '../lib/queryClient';

const ACCESS_TOKEN_KEY = 'freshbox_access_token';
const REFRESH_TOKEN_KEY = 'freshbox_refresh_token';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isLoading: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  loadTokens: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoading: true,

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  loadTokens: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      set({ accessToken, refreshToken, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    queryClient.clear();
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
