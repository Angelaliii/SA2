"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from "@mui/material/styles";
import { useServerInsertedHTML } from "next/navigation";
import { ReactNode, useState } from "react";
// 引入 LocalizationProvider 和 AdapterDayjs
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// 建立一個穩定的主題，確保伺服器和客戶端一致
const theme = createTheme({
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
});

// 修改: 創建一個伺服器端緩存以便注入樣式
function createEmotionCache() {
  return createCache({
    key: "mui-style",
    prepend: true, // 確保樣式被插入到頁面的開頭，這樣它們會優先於任何其他樣式
  });
}

// 這個組件用於在服務器端和客戶端之間提供一致的 Emotion 樣式
export default function ThemeRegistry({
  children,
}: Readonly<{ children: ReactNode }>) {
  // 創建一個固定的緩存實例，以確保在SSR期間和客戶端水合之間的一致性
  const [{ cache, flush }] = useState(() => {
    const cache = createEmotionCache();
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });
  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key="emotion-style"
        data-emotion={`${cache.key} ${names.join(" ")}`}
        dangerouslySetInnerHTML={{ __html: styles }}
        suppressHydrationWarning
      />
    );
  });
  return (
    <CacheProvider value={cache}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <CssBaseline enableColorScheme />
            {children}
          </LocalizationProvider>
        </ThemeProvider>
      </StyledEngineProvider>
    </CacheProvider>
  );
}
