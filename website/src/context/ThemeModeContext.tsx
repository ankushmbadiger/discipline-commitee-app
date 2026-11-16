
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ThemeProvider, CssBaseline } from "@mui/material";
import { getAppTheme } from "../theme";
import { ThemeModeContext } from "./ThemeModeContextValue";

export function ThemeModeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [mode, setMode] = useState<"light" | "dark">(() => {
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
