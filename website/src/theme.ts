
import { createTheme } from "@mui/material/styles";

export function getAppTheme(mode: "light" | "dark") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,

      primary: {
        main: isDark ? "#90CAF9" : "#2563EB",
      },

      secondary: {
        main: isDark ? "#B0BEC5" : "#64748B",
      },

      background: {
        default: isDark ? "#121212" : "#F8FAFC",
        paper: isDark ? "#1E1E1E" : "#FFFFFF",
      },

      text: {
        primary: isDark ? "#F1F5F9" : "#0F172A",
        secondary: isDark ? "#B0BEC5" : "#64748B",
      },

      divider: isDark ? "#333333" : "#E2E8F0",
    },

    shape: {
      borderRadius: 10,
    },

    typography: {
      fontFamily: [
        "Inter",
        "Roboto",
        "Arial",
        "sans-serif",
      ].join(","),

      h4: {
        fontWeight: 700,
      },

      h5: {
        fontWeight: 700,
      },

      h6: {
        fontWeight: 600,
      },

      button: {
        textTransform: "none",
        fontWeight: 600,
      },
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            boxShadow: "none",
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${isDark ? "#333333" : "#E2E8F0"}`,
            boxShadow: "none",
          },
        },
      },
    },
  });
}

export default getAppTheme("light");
