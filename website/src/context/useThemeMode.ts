import { useContext } from "react";
import { ThemeModeContext } from "./ThemeModeContextValue";

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeModeProvider");
  }

  return context;
}