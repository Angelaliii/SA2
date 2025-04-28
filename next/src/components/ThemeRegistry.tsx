"use client";

import { CssBaseline } from "@mui/material";
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material/styles";
import { ReactNode, useMemo } from "react";

export default function ThemeRegistry({
  children,
}: Readonly<{ children: ReactNode }>) {
  // Create theme only once on the client side to prevent hydration mismatches
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          primary: { main: "#1976d2" },
          secondary: { main: "#f50057" },
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundColor: "#f5f5f5",
              },
            },
          },
        },
      }),
    []
  );

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}
