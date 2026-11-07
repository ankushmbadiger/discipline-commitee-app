import { useState } from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import {
  createAppTheme,
  type PaletteName,
  type ThemeMode,
} from '../constants/theme';

import { ThemeContext } from '../constants/theme-context';

export default function RootLayout() {
  const systemScheme = useColorScheme();

  const [palette, setPalette] = useState<PaletteName>('blue');
  const [mode, setMode] = useState<ThemeMode>('system');

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
        <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </ThemeContext.Provider>
  );
}
