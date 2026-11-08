import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createAppTheme,
  type PaletteName,
  type ThemeMode,
} from '../constants/theme';

import { ThemeContext } from '../constants/theme-context';

const PALETTE_KEY = 'app_palette';
const MODE_KEY = 'app_theme_mode';

const validPalettes: PaletteName[] = [
  'blue',
  'green',
  'purple',
  'teal',
];

const validModes: ThemeMode[] = [
  'system',
  'light',
  'dark',
];

export default function RootLayout() {
  const systemScheme = useColorScheme();

  const [palette, setPalette] = useState<PaletteName>('blue');
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved preferences when the app starts.
  useEffect(() => {
    async function loadPreferences() {
      try {
        const savedPalette = await AsyncStorage.getItem(PALETTE_KEY);
        const savedMode = await AsyncStorage.getItem(MODE_KEY);

        if (savedPalette && validPalettes.includes(savedPalette as PaletteName)) {
          setPalette(savedPalette as PaletteName);
        }

        if (savedMode && validModes.includes(savedMode as ThemeMode)) {
          setMode(savedMode as ThemeMode);
        }
      } catch (error) {
        console.error('Could not load theme preferences:', error);
      } finally {
        setIsHydrated(true);
      }
    }

    loadPreferences();
  }, []);

  // Save preferences whenever the user changes them.
  useEffect(() => {
    if (!isHydrated) return;

    async function savePreferences() {
      try {
        await AsyncStorage.multiSet([
          [PALETTE_KEY, palette],
          [MODE_KEY, mode],
        ]);
      } catch (error) {
        console.error('Could not save theme preferences:', error);
      }
    }

    savePreferences();
  }, [palette, mode, isHydrated]);

  const resolvedMode =
    mode === 'system'
      ? systemScheme === 'dark' ? 'dark' : 'light'
      : mode;

  const theme = createAppTheme(resolvedMode, palette);

  return (
    <ThemeContext.Provider
      value={{ palette, setPalette, mode, setMode }}
    >
      <PaperProvider theme={theme}>
        <StatusBar
          style={resolvedMode === 'dark' ? 'light' : 'dark'}
        />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </ThemeContext.Provider>
  );
}
