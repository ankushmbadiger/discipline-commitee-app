
import { createContext, useContext } from 'react';
import type { PaletteName, ThemeMode } from './theme';

type ThemeContextType = {
  palette: PaletteName;
  setPalette: (palette: PaletteName) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  palette: 'blue',
  setPalette: () => {},
  mode: 'system',
  setMode: () => {},
});

export function useAppTheme() {
  return useContext(ThemeContext);
}
