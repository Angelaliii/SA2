"use client";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import { useRouter } from 'next/navigation'; // ✅ 正確！
import { ChangeEvent, FormEvent, useState } from "react";
import styles from "../../assets/globals.module.css";
import { auth } from "../../firebase/config";
import { clubServices } from "../../firebase/services";

// Define types for formData and errors
interface FormData {
  clubName: string;
  schoolName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  clubName: string;
  schoolName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function ClubRegister() {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    clubName: "",
    schoolName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({
    clubName: "",
    schoolName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle text input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Validate email format
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // 驗證密碼強度 (至少8個字元，包含數字和字母)
  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  // Form validation
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    // Required fields validation
    if (!formData.clubName.trim()) {
      newErrors.clubName = "此欄位為必填";
      valid = false;
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = "此欄位為必填";
      valid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = "此欄位為必填";
      valid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件地址";
      valid = false;
    }

    // 密碼驗證
    if (!formData.password) {
      newErrors.password = "此欄位為必填";
      valid = false;
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "密碼必須至少8個字元，且包含字母和數字";
      valid = false;
    }

    // 確認密碼驗證
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "請確認您的密碼";
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "兩次輸入的密碼不一致";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. 建立Firebase用戶
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. 將社團資料保存到Firestore
      const clubData = {
        clubName: formData.clubName,
        schoolName: formData.schoolName,
        email: formData.email,
        status: "pending", // 初始狀態為待審核
        registrationDate: new Date().toISOString(),
        userId: userCredential.user.uid, // 將Firebase用戶ID關聯到社團資料
      };

      // 3. 添加到Firestore
      await clubServices.addClub(clubData);

      // 4. 註冊成功
      setSubmitSuccess(true);
    } catch (error: any) {
      console.error("註冊錯誤:", error);

      // 處理常見Firebase錯誤
      let errorMessage = "註冊失敗，請稍後再試";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "此電子郵件已被註冊，請使用其他電子郵件";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "請輸入有效的電子郵件地址";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "密碼強度不足，請設置更強的密碼";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "網絡連接失敗，請檢查您的網絡連接";
      }

      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Container maxWidth="md">
        {submitSuccess ? (
          <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              註冊成功！
            </Typography>
            <Typography align="center" sx={{ mb: 2 }}>
              感謝您完成社團註冊，您的帳號已成功建立
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                component={Link}
                href="/LoginPage"
                sx={{ mr: 2 }}
              >
                前往登入
              </Button>
              <Button variant="outlined" component={Link} href="/">
                返回首頁
              </Button>
            </Box>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              社團帳號註冊
            </Typography>
            <Typography color="textSecondary" align="center" sx={{ mb: 2 }}>
              請填寫基本資料以註冊社團帳號
            </Typography>

            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 3 }}
              >
                {/* 社團名稱 */}
                <TextField
                  name="clubName"
                  label="社團名稱"
                  value={formData.clubName}
                  onChange={handleInputChange}
                  error={!!errors.clubName}
                  helperText={errors.clubName}
                  fullWidth
                  required
                />

                {/* 學校名稱 */}
                <TextField
                  name="schoolName"
                  label="學校名稱"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  error={!!errors.schoolName}
                  helperText={errors.schoolName}
                  fullWidth
                  required
                />

                {/* 電子郵件 */}
                <TextField
                  name="email"
                  label="電子郵件"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                  required
                />

                {/* 密碼 */}
                <TextField
                  name="password"
                  label="密碼"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!errors.password}
                  helperText={
                    errors.password || "至少8個字元，須包含字母和數字"
                  }
                  fullWidth
                  required
                />

                {/* 確認密碼 */}
                <TextField
                  name="confirmPassword"
                  label="確認密碼"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  fullWidth
                  required
                />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 3,
                  }}
                >
                  <Button variant="outlined" component={Link} href="/">
                    返回首頁
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress
                          size={24}
                          sx={{ mr: 1 }}
                          color="inherit"
                        />
                        處理中...
                      </Box>
                    ) : (
                      "完成註冊"
                    )}
                  </Button>
                </Box>
              </Box>
            </form>
          </Paper>
        )}
      </Container>
    </div>
  );
}
