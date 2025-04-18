// src/Login.tsx
"use client"; // 告訴 Next.js 這是客戶端組件

import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Link as MUILink,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // ✅ 正確！
import { FormEvent, useState } from "react";
import { authServices } from "../firebase/services";

interface LoginProps {
  readonly onSuccess?: () => void;
}

export default function Login({ onSuccess }: Readonly<LoginProps>) {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPasswordSent, setResetPasswordSent] = useState(false);

  // Handle form submission for login
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authServices.login(email, password);

      if (result.success) {
        console.log("登入成功", result.user);
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/"); // 導向首頁或儀表板
        }
      } else {
        setError(result.error ?? "登入失敗");
      }
    } catch (err) {
      console.error("登入過程發生錯誤", err);
      setError("登入過程中發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset request
  const handleResetPassword = async () => {
    if (!email) {
      setError("請輸入您的電子郵件以重置密碼");
      return;
    }

    setLoading(true);

    try {
      const result = await authServices.resetPassword(email);

      if (result.success) {
        setResetPasswordSent(true);
        setError("");
      } else {
        setError(result.error ?? "無法發送重設密碼郵件");
      }
    } catch (err) {
      console.error("重設密碼過程發生錯誤", err);
      setError("重設密碼過程中發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 500, mx: "auto", mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        登入
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {resetPasswordSent && (
        <Alert severity="success" sx={{ mb: 2 }}>
          重設密碼鏈接已發送至您的電子郵件
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          label="電子郵件"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <TextField
          label="密碼"
          type={showPassword ? "text" : "password"}
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{ "& .MuiInputBase-adornedEnd": { paddingRight: "8px" } }}
          // 使用 slotProps 代替 InputProps
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <MUILink
            component="button"
            type="button"
            variant="body2"
            onClick={handleResetPassword}
          >
            忘記密碼？
          </MUILink>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "登入"}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 4, textAlign: "center" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}>
          <Typography variant="body2">
            企業用戶？{" "}
            <Link href="/CompanyRegister">
              <Typography
                component="span"
                color="primary"
                sx={{ cursor: "pointer" }}
              >
                企業註冊
              </Typography>
            </Link>
          </Typography>

          <Typography variant="body2">
            學生社團？{" "}
            <Link href="/ClubRegister">
              <Typography
                component="span"
                color="primary"
                sx={{ cursor: "pointer" }}
              >
                社團註冊
              </Typography>
            </Link>
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
