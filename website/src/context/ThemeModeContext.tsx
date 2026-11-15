
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { getAppTheme } from "../theme";

type ThemeMode = "light" | "dark";

interface ThemeModeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextType | undefined>(
  undefined
);

export function ThemeModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return localStorage.getItem("dc-dashboard-theme") === "dark"
      ? "dark"
      : "light";
  });

  useEffect(() => {
    localStorage.setItem("dc-dashboard-theme", mode);
  }, [mode]);

  const toggleMode = () => {
    setMode((current) => current === "light" ? "dark" : "light");
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode must be used inside ThemeModeProvider");
  }

  return context;
}
