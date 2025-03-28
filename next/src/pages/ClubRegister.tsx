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
import { clubServices } from "../firebase/services";

// Define types for formData and errors
interface FormData {
  clubName: string;
  schoolName: string;
  clubType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  clubDescription: string;
  cooperationFields: string[];
  logo: File | null;
  clubCertificate: File | null;
}

interface FormErrors {
  clubName: string;
  schoolName: string;
  clubType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  clubCertificate: string;
}

const clubTypes = [
  "學術性社團",
  "藝術性社團",
  "體育性社團",
  "服務性社團",
  "聯誼性社團",
  "音樂性社團",
  "科技性社團",
  "創業社團",
  "宗教性社團",
  "國際交流社團",
  "其他",
];

const cooperationFields = [
  "技術合作",
  "藝術展演",
  "營銷策劃",
  "活動合作",
  "人才培育",
  "社會公益",
  "專業實習",
  "專題研究",
  "創新創業",
  "其他",
];

export default function ClubRegister() {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    clubName: "",
    schoolName: "",
    clubType: "",
    contactName: "",
    contactPhone: "",
    email: "",
    clubDescription: "",
    cooperationFields: [],
    logo: null,
    clubCertificate: null,
  });

  // Validation errors
  const [errors, setErrors] = useState<FormErrors>({
    clubName: "",
    schoolName: "",
    clubType: "",
    contactName: "",
    contactPhone: "",
    email: "",
    clubCertificate: "",
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

  // Handle select change for club type
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

  // Handle file upload for club certificate
  const handleCertificateUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({
        ...prev,
        clubCertificate: file,
      }));

      // Clear error
      if (errors.clubCertificate) {
        setErrors((prev) => ({
          ...prev,
          clubCertificate: "",
        }));
      }
    }
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
    if (!formData.clubName.trim()) {
      newErrors.clubName = "此欄位為必填";
      valid = false;
    }

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = "此欄位為必填";
      valid = false;
    }

    if (!formData.clubType) {
      newErrors.clubType = "此欄位為必填";
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

    if (!formData.clubCertificate) {
      newErrors.clubCertificate = "此欄位為必填";
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
      // 使用 clubServices 直接向後端發送請求
      const result = await clubServices.registerClub(
        {
          clubName: formData.clubName,
          schoolName: formData.schoolName,
          clubType: formData.clubType,
          contactName: formData.contactName,
          contactPhone: formData.contactPhone,
          email: formData.email,
          clubDescription: formData.clubDescription,
          cooperationFields: formData.cooperationFields,
        },
        formData.logo,
        formData.clubCertificate
      );

      if (result.success) {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        // 重置表單
        setFormData({
          clubName: "",
          schoolName: "",
          clubType: "",
          contactName: "",
          contactPhone: "",
          email: "",
          clubDescription: "",
          cooperationFields: [],
          logo: null,
          clubCertificate: null,
        });
        setErrors({
          clubName: "",
          schoolName: "",
          clubType: "",
          contactName: "",
          contactPhone: "",
          email: "",
          clubCertificate: "",
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
              感謝您完成社團註冊，您的申請已成功提交
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
              學生社團註冊
            </Typography>
            <Typography color="textSecondary" align="center" paragraph>
              請填寫以下資料以註冊學生社團
            </Typography>

            <Divider sx={{ my: 3 }}>
              <Typography variant="subtitle1" color="primary">
                基本資料
              </Typography>
            </Divider>

            <form onSubmit={handleSubmit}>
              <div className={styles.gridContainer}>
                {/* 社團名稱 */}
                <div className={styles.fullWidth}>
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
                </div>

                {/* 學校名稱 和 社團類型 */}
                <div className={styles.formRow}>
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

                  <FormControl fullWidth error={!!errors.clubType} required>
                    <InputLabel>社團類型</InputLabel>
                    <Select
                      name="clubType"
                      value={formData.clubType}
                      onChange={handleSelectChange}
                      label="社團類型"
                    >
                      {clubTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.clubType && (
                      <FormHelperText>{errors.clubType}</FormHelperText>
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

                {/* 社團簡介 */}
                <div className={styles.fullWidth}>
                  <TextField
                    name="clubDescription"
                    label="社團簡介"
                    value={formData.clubDescription}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={4}
                  />
                </div>

                {/* 社團標誌 和 合作意向領域 */}
                <div className={styles.formRow}>
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      社團標誌
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

                {/* 社團證明文件 */}
                <div className={styles.fullWidth}>
                  <Typography variant="subtitle2" gutterBottom>
                    社團證明文件 <span style={{ color: "red" }}>*</span>
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    color={errors.clubCertificate ? "error" : "primary"}
                  >
                    上傳社團證明文件
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleCertificateUpload}
                    />
                  </Button>
                  {formData.clubCertificate && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 1 }}
                    >
                      已選擇: {formData.clubCertificate.name}
                    </Typography>
                  )}
                  {errors.clubCertificate && (
                    <FormHelperText error>
                      {errors.clubCertificate}
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
