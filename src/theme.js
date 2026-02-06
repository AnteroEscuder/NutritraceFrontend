import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f7a8c" },
    secondary: { main: "#e76f51" },
    background: {
      default: "#f6f8fb",
      paper: "#ffffff",
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily:
      "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'",
    h5: { fontWeight: 800 },
    h6: { fontWeight: 800 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow:
            "0 1px 2px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
  },
});
