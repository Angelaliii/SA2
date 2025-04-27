"use client";

// 引入必要的套件和服務
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import styles from "../../assets/globals.module.css";
import { auth } from "../../firebase/config";
import { companyServices } from "../../firebase/services";

// 產業類型選項
const industryTypes = [
  "科技/IT",
  "金融/保險",
  "零售/電商",
  "製造/工業",
  "教育/培訓",
  "醫療/健康",
  "餐飲/娛樂",
  "媒體/廣告",
  "非營利組織",
  "其他",
];

// 表單資料類型
interface FormData {
  companyName: string;
  businessId: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyDescription: string;
}

// 表單錯誤類型
interface FormErrors {
  companyName: string;
  businessId: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyDescription: string;
}

export default function CompanyRegister() {
  // 表單狀態
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    businessId: "",
    industryType: "",
    contactName: "",
    contactPhone: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyDescription: "",
  });

  // 驗證錯誤
  const [errors, setErrors] = useState<FormErrors>({
    companyName: "",
    businessId: "",
    industryType: "",
    contactName: "",
    contactPhone: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyDescription: "",
  });

  // 提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 處理輸入變化
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 清除錯誤
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // 驗證統一編號格式 - 8位數字
  const validateBusinessId = (id: string) => {
    const regex = /^\d{8}$/;
    return regex.test(id);
  };

  // 驗證電子郵件格式
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // 驗證密碼強度 (至少8個字元，包含數字和字母)
  const validatePassword = (password: string) => {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return regex.test(password);
  };

  // 表單驗證
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    // 必填欄位驗證
    if (!formData.companyName.trim()) {
      newErrors.companyName = "此欄位為必填";
      valid = false;
    }

    if (!formData.businessId.trim()) {
      newErrors.businessId = "此欄位為必填";
      valid = false;
    } else if (!validateBusinessId(formData.businessId)) {
      newErrors.businessId = "請輸入有效的統一編號";
      valid = false;
    }

    if (!formData.industryType.trim()) {
      newErrors.industryType = "此欄位為必填";
      valid = false;
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = "此欄位為必填";
      valid = false;
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "此欄位為必填";
      valid = false;
    } else if (!/^[0-9]{8,10}$/.test(formData.contactPhone.trim())) {
      newErrors.contactPhone = "請輸入有效的電話號碼";
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

    if (!formData.companyDescription.trim()) {
      newErrors.companyDescription = "此欄位為必填";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 處理表單提交
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 驗證表單
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 先檢查電子郵件是否已註冊
      const signInMethods = await fetchSignInMethodsForEmail(
        auth,
        formData.email
      );
      if (signInMethods.length > 0) {
        throw new Error("auth/email-already-in-use");
      }

      // 使用電子郵件和用戶設定的密碼創建 Firebase Auth 用戶
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const userId = userCredential.user.uid;
      console.log("用戶創建成功:", userId);

      // 將簡化的公司資料存入 Firestore
      const companyData = {
        companyName: formData.companyName,
        businessId: formData.businessId,
        industryType: formData.industryType,
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        email: formData.email,
        companyDescription: formData.companyDescription,
        cooperationFields: [], // 空值
        logoURL: "", // 改為空字串而非 null
        businessCertificateURL: "", // 改為空字串而非 null
        status: "pending", // 預設狀態為待審核
        registrationDate: new Date().toISOString(),
        userId: userId,
      };

      // 存儲公司資料
      const companyId = await companyServices.addCompany(companyData);
      console.log("公司資料存儲成功:", companyId);

      setSubmitSuccess(true);
    } catch (error) {
      console.error("註冊公司過程中發生錯誤:", error);

      // 處理 Firebase 錯誤
      let errorMessage = "註冊過程中發生錯誤，請稍後再試";

      if (error instanceof Error) {
        // 處理常見的 Firebase 註冊錯誤
        if (error.message.includes("email-already-in-use")) {
          errorMessage = "此電子郵件已被註冊，請使用其他電子郵件或嘗試登入";
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "請提供有效的電子郵件地址";
        } else if (error.message.includes("weak-password")) {
          errorMessage = "密碼強度不足，請使用更複雜的密碼";
        } else {
          errorMessage = `註冊失敗: ${error.message}`;
        }
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
              感謝您完成企業註冊，您的帳號已成功建立，我們將審核您的資料
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                component={Link}
                href="/CompanyList"
                sx={{ mr: 2 }}
              >
                查看公司列表
              </Button>
              <Button variant="outlined" component={Link} href="/LoginPage">
                前往登入
              </Button>
            </Box>
          </Paper>
        ) : (
          <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
            <Typography variant="h4" align="center" gutterBottom>
              企業帳號註冊
            </Typography>
            <Typography color="textSecondary" align="center" sx={{ mb: 2 }}>
              請填寫基本資料以註冊企業帳號
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
                {/* 企業名稱 */}
                <TextField
                  name="companyName"
                  label="企業名稱"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  error={!!errors.companyName}
                  helperText={errors.companyName}
                  fullWidth
                  required
                />

                {/* 統一編號 */}
                <TextField
                  name="businessId"
                  label="統一編號"
                  value={formData.businessId}
                  onChange={handleInputChange}
                  error={!!errors.businessId}
                  helperText={errors.businessId || "請輸入8位數字的統一編號"}
                  fullWidth
                  required
                  sx={{
                    "& .MuiInputBase-input": {
                      maxLength: 8,
                    },
                  }}
                />

                {/* 行業類型 */}
                <TextField
                  select
                  name="industryType"
                  label="產業類型"
                  value={formData.industryType}
                  onChange={handleInputChange}
                  error={!!errors.industryType}
                  helperText={errors.industryType}
                  fullWidth
                  required
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    },
                  }}
                >
                  {industryTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>

                {/* 聯絡人姓名 */}
                <TextField
                  name="contactName"
                  label="聯絡人姓名"
                  value={formData.contactName}
                  onChange={handleInputChange}
                  error={!!errors.contactName}
                  helperText={errors.contactName}
                  fullWidth
                  required
                />

                {/* 聯絡人電話 */}
                <TextField
                  name="contactPhone"
                  label="聯絡人電話"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  error={!!errors.contactPhone}
                  helperText={errors.contactPhone}
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

                {/* 公司描述 */}
                <TextField
                  name="companyDescription"
                  label="公司描述"
                  value={formData.companyDescription}
                  onChange={handleInputChange}
                  error={!!errors.companyDescription}
                  helperText={
                    errors.companyDescription ||
                    "請簡述公司業務、合作需求等資訊"
                  }
                  fullWidth
                  required
                  multiline
                  rows={4}
                  InputProps={{
                    sx: {
                      bgcolor: "rgba(0, 0, 0, 0.02)",
                    },
                  }}
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
