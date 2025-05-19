import { Box, Button, Container, Typography } from "@mui/material";

// 匯入 Next.js 提供的 Link 元件，用來做頁面跳轉（類似 <a> 但是 SPA 模式）
import Link from "next/link";

import styles from "../../assets/globals.module.css";

import Login from "../../components/Login";

// 頁面主要的元件：LoginPage
export default function LoginPage() {
  return (
    // 外層 div 使用自定義 CSS class，讓整個畫面有統一的樣式
    <div className={styles.page}>
      {/* Container 是 MUI 的容器元件，設定寬度最大為 sm（小尺寸） */}
      <Container maxWidth="sm">
        {/* Box 是 MUI 提供的 layout 元件，這邊設定 my=4 表示上下邊距 */}
        <Box sx={{ my: 4 }}>
          {/* h1 標題，置中顯示，使用 variant="h3" 樣式 */}
          <Typography variant="h3" component="h1" align="center" gutterBottom>
            歡迎回來
          </Typography>

          {/* 次要說明文字，灰色，段落格式，置中 */}
          <Typography color="textSecondary" align="center" paragraph>
            登入以使用所有功能
          </Typography>

          {/* 登入表單元件，應該是輸入帳號密碼的區塊 */}
          <Login />

          {/* 一個置中的按鈕區塊 */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            {/* MUI 的按鈕元件，包裝了 Next.js 的 Link 做為導向首頁的按鈕 */}
            <Button
              component={Link} // 把按鈕變成一個連結
              href="/" // 點擊時導向首頁
              variant="outlined" // 按鈕樣式：框線按鈕
              color="primary"
              sx={{ textDecoration: "none" }}
            >
              返回首頁
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
