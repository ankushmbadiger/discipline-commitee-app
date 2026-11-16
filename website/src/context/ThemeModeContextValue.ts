import { createContext } from "react";

type ThemeMode = "light" | "dark";

interface ThemeModeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

export const ThemeModeContext = createContext<
  ThemeModeContextType | undefined
>(undefined);