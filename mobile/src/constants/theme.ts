
import {
  MD3DarkTheme,
  MD3LightTheme,
  type MD3Theme,
} from 'react-native-paper';

export type PaletteName = 'blue' | 'green' | 'purple' | 'teal';
export type ThemeMode = 'system' | 'light' | 'dark';

const palettes = {
  blue: {
    light: {
      primary: '#3569B7',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D7E3FF',
      onPrimaryContainer: '#001B3F',
      secondaryContainer: '#DAE2F9',
      onSecondaryContainer: '#101C2B',
    },
    dark: {
      primary: '#ADC6FF',
      onPrimary: '#002F65',
      primaryContainer: '#174987',
      onPrimaryContainer: '#D7E3FF',
      secondaryContainer: '#3E4960',
      onSecondaryContainer: '#DAE2F9',
    },
  },

  green: {
    light: {
      primary: '#386A45',
      onPrimary: '#FFFFFF',
      primaryContainer: '#B9F0BE',
      onPrimaryContainer: '#00210B',
      secondaryContainer: '#D5E8D0',
      onSecondaryContainer: '#102016',
    },
    dark: {
      primary: '#9DD49F',
      onPrimary: '#003914',
      primaryContainer: '#20502D',
      onPrimaryContainer: '#B9F0BE',
      secondaryContainer: '#394D3B',
      onSecondaryContainer: '#D5E8D0',
    },
  },

  purple: {
    light: {
      primary: '#6750A4',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E9DDFF',
      onPrimaryContainer: '#22005D',
      secondaryContainer: '#E8DEF8',
      onSecondaryContainer: '#201A2C',
    },
    dark: {
      primary: '#D0BCFF',
      onPrimary: '#381E72',
      primaryContainer: '#4F378B',
      onPrimaryContainer: '#E9DDFF',
      secondaryContainer: '#4A4458',
      onSecondaryContainer: '#E8DEF8',
    },
  },

  teal: {
    light: {
      primary: '#006A60',
      onPrimary: '#FFFFFF',
      primaryContainer: '#9CF2E5',
      onPrimaryContainer: '#00201C',
      secondaryContainer: '#CCE8E2',
      onSecondaryContainer: '#10201D',
    },
    dark: {
      primary: '#80D5C7',
      onPrimary: '#003731',
      primaryContainer: '#005047',
      onPrimaryContainer: '#9CF2E5',
      secondaryContainer: '#344C48',
      onSecondaryContainer: '#CCE8E2',
    },
  },
};

export function createAppTheme(
  mode: 'light' | 'dark',
  palette: PaletteName
): MD3Theme {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      ...palettes[palette][mode],
    },
  };
}
