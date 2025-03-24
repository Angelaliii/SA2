// src/Login.tsx
"use client"; // 告訴 Next.js 這是客戶端組件

import dynamic from "next/dynamic";
import React, { useState } from "react";

// 動態引入 MUI 組件，避免服務端渲染
const TextField = dynamic(() => import("@mui/material/TextField"), {
  ssr: false,
});
const Button = dynamic(() => import("@mui/material/Button"), { ssr: false });
const Container = dynamic(() => import("@mui/material/Container"), {
  ssr: false,
});
const Typography = dynamic(() => import("@mui/material/Typography"), {
  ssr: false,
});
const Box = dynamic(() => import("@mui/material/Box"), { ssr: false });

const Login: React.FC = () => {
  // 定義狀態，用來存儲輸入的資料
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 處理表單提交
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // 簡單的驗證
    if (!email || !password) {
      setError("請填寫所有欄位");
      return;
    }

    // 這裡可以加入 API 呼叫來驗證用戶
    alert("登入成功！");
  };

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 3,
          marginTop: 8,
          borderRadius: 1,
          boxShadow: 3,
        }}
      >
        <Typography variant="h5" gutterBottom>
          登入
        </Typography>

        {error && <Typography color="error">{error}</Typography>}

        <form onSubmit={handleSubmit}>
          <TextField
            label="電子郵件"
            variant="outlined"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="密碼"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ marginTop: 2 }}
          >
            登入
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;
