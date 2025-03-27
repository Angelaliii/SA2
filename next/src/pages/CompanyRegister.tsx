"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";
import styles from "../assets/globals.module.css";
import { companyServices } from "../firebase/services";

// Define types for formData and errors
interface FormData {
  companyName: string;
  businessId: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  companyDescription: string;
  cooperationFields: string[];
  logo: File | null;
  businessCertificate: File | null;
}

interface FormErrors {
  companyName: string;
  businessId: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  businessCertificate: string;
}

const industryTypes = [
  "資訊科技",
  "金融服務",
  "製造業",
  "零售業",
  "教育產業",
  "醫療保健",
  "媒體與娛樂",
  "餐飲業",
  "房地產",
  "物流運輸",
  "顧問服務",
  "其他",
];

const cooperationFields = [
  "技術合作",
  "人才培育",
  "產品設計",
  "市場行銷",
  "活動贊助",
  "研究發展",
  "社會企業責任",
  "校園招募",
  "實習機會",
  "創新創業",
  "其他",
];

export default function CompanyRegister() {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    companyName: "",
    businessId: "",
    industryType: "",
    contactName: "",
    contactPhone: "",
    email: "",
    companyDescription: "",
    cooperationFields: [],
    logo: null,
    businessCertificate: null,
  });

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({
    companyName: "",
    businessId: "",
    industryType: "",
    contactName: "",
    contactPhone: "",
    email: "",
    businessCertificate: "",
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  // Handle select change for industry type
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle multi-select for cooperation fields
  const handleCooperationFieldChange = (e: SelectChangeEvent<string[]>) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      cooperationFields: typeof value === "string" ? value.split(",") : value,
    }));
  };

  // Handle file upload for logo
  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));
    }
  };

  // Handle file upload for business certificate
  const handleCertificateUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({
        ...prev,
        businessCertificate: file,
      }));

      // Clear error
      if (errors.businessCertificate) {
        setErrors((prev) => ({
          ...prev,
          businessCertificate: "",
        }));
      }
    }
  };

  // Validate business ID (統一編號) format - 8 digits
  const validateBusinessId = (id: string) => {
    const regex = /^\d{8}$/;
    return regex.test(id);
  };

  // Validate email format
  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Form validation
  const validateForm = () => {
    let valid = true;
    const newErrors = { ...errors };

    // Required fields validation
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

    if (!formData.industryType) {
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
    }

    if (!formData.email.trim()) {
      newErrors.email = "此欄位為必填";
      valid = false;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "請輸入有效的電子郵件地址";
      valid = false;
    }

    if (!formData.businessCertificate) {
      newErrors.businessCertificate = "此欄位為必填";
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

    try {
      // 使用 Firebase 服務直接註冊公司
      const result = await companyServices.registerCompany(
        {
          companyName: formData.companyName,
          businessId: formData.businessId,
          industryType: formData.industryType,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          email: formData.email,
          companyDescription: formData.companyDescription,
          cooperationFields: formData.cooperationFields,
        },
        formData.logo,
        formData.businessCertificate
      );

      if (result.success) {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        // 重置表單
        setFormData({
          companyName: "",
          businessId: "",
          industryType: "",
          contactName: "",
          contactPhone: "",
          email: "",
          companyDescription: "",
          cooperationFields: [],
          logo: null,
          businessCertificate: null,
        });
        setErrors({
          companyName: "",
          businessId: "",
          industryType: "",
          contactName: "",
          contactPhone: "",
          email: "",
          businessCertificate: "",
        });
      } else {
        // 處理錯誤
        console.error("註冊失敗:", result.error);
        alert(`註冊失敗: ${result.error}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("註冊過程發生錯誤:", error);
      alert("註冊過程中發生錯誤，請稍後再試");
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
            <Typography align="center" paragraph>
              感謝您完成企業註冊，您的帳號已成功建立
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Button
                variant="contained"
                component={Link}
                href="/login"
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
              企業帳號註冊
            </Typography>
            <Typography color="textSecondary" align="center" paragraph>
              請填寫以下資料以註冊企業帳號
            </Typography>

            <Divider sx={{ my: 3 }}>
              <Typography variant="subtitle1" color="primary">
                基本資料
              </Typography>
            </Divider>

            <form onSubmit={handleSubmit}>
              <div className={styles.gridContainer}>
                {/* 企業名稱 */}
                <div className={styles.fullWidth}>
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
                </div>

                {/* 統一編號 和 產業類型 */}
                <div className={styles.formRow}>
                  <TextField
                    name="businessId"
                    label="統一編號"
                    value={formData.businessId}
                    onChange={handleInputChange}
                    error={!!errors.businessId}
                    helperText={errors.businessId}
                    fullWidth
                    required
                    inputProps={{
                      maxLength: 8,
                    }}
                  />

                  <FormControl fullWidth error={!!errors.industryType} required>
                    <InputLabel>產業類型</InputLabel>
                    <Select
                      name="industryType"
                      value={formData.industryType}
                      onChange={handleSelectChange}
                      label="產業類型"
                    >
                      {industryTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.industryType && (
                      <FormHelperText>{errors.industryType}</FormHelperText>
                    )}
                  </FormControl>
                </div>

                {/* 聯絡人姓名 和 聯絡電話 */}
                <div className={styles.formRow}>
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

                  <TextField
                    name="contactPhone"
                    label="聯絡電話"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    error={!!errors.contactPhone}
                    helperText={errors.contactPhone}
                    fullWidth
                    required
                  />
                </div>

                {/* 電子郵件 */}
                <div className={styles.fullWidth}>
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
                </div>

                <div className={styles.fullWidth}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="subtitle1" color="primary">
                      選填資料
                    </Typography>
                  </Divider>
                </div>

                {/* 企業簡介 */}
                <div className={styles.fullWidth}>
                  <TextField
                    name="companyDescription"
                    label="企業簡介"
                    value={formData.companyDescription}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={4}
                  />
                </div>

                {/* 企業標誌 和 合作意向領域 */}
                <div className={styles.formRow}>
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      企業標誌
                    </Typography>
                    <Button variant="outlined" component="label" fullWidth>
                      選擇檔案
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </Button>
                    {formData.logo && (
                      <Typography
                        variant="caption"
                        sx={{ display: "block", mt: 1 }}
                      >
                        已選擇: {formData.logo.name}
                      </Typography>
                    )}
                  </div>

                  <FormControl fullWidth>
                    <InputLabel>合作意向領域</InputLabel>
                    <Select
                      multiple
                      name="cooperationFields"
                      value={formData.cooperationFields}
                      onChange={handleCooperationFieldChange}
                      label="合作意向領域"
                      renderValue={(selected) => selected.join(", ")}
                    >
                      {cooperationFields.map((field) => (
                        <MenuItem key={field} value={field}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={
                                  formData.cooperationFields.indexOf(field) > -1
                                }
                              />
                            }
                            label={field}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <div className={styles.fullWidth}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="subtitle1" color="primary">
                      證明文件
                    </Typography>
                  </Divider>
                </div>

                {/* 營業登記證明文件 */}
                <div className={styles.fullWidth}>
                  <Typography variant="subtitle2" gutterBottom>
                    營業登記證明文件 <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    color={errors.businessCertificate ? "error" : "primary"}
                  >
                    上傳營業登記證明文件
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleCertificateUpload}
                    />
                  </Button>
                  {formData.businessCertificate && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1 }}
                    >
                      已選擇: {formData.businessCertificate.name}
                    </Typography>
                  )}
                  {errors.businessCertificate && (
                    <FormHelperText error>
                      {errors.businessCertificate}
                    </FormHelperText>
                  )}
                </div>

                <div className={styles.fullWidth}>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    提交資料後，我們將進行審核。審核通過後您將收到通知。
                  </Alert>
                </div>

                <div className={styles.fullWidth}>
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
                      {isSubmitting ? "處理中..." : "完成註冊"}
                    </Button>
                  </Box>
                </div>
              </div>
            </form>
          </Paper>
        )}
      </Container>
    </div>
  );
}
