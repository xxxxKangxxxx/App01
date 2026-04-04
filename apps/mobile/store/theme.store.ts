import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { lightColors, darkColors, ThemeColors } from '../constants/colors';

const THEME_KEY = 'freshbox_theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  loadTheme: () => Promise<void>;
}

function resolveColors(mode: ThemeMode): { colors: ThemeColors; isDark: boolean } {
  const isDark =
    mode === 'dark' || (mode === 'system' && Appearance.getColorScheme() === 'dark');
  return { colors: isDark ? darkColors : lightColors, isDark };
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  ...resolveColors('system'),

  setMode: async (mode) => {
    await AsyncStorage.setItem(THEME_KEY, mode);
    set({ mode, ...resolveColors(mode) });
  },

  loadTheme: async () => {
    try {
      const saved = (await AsyncStorage.getItem(THEME_KEY)) as ThemeMode | null;
      const mode = saved ?? 'system';
      set({ mode, ...resolveColors(mode) });
    } catch {
      // 기본값 유지
    }
  },
}));
