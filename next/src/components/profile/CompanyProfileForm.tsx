import SaveIcon from "@mui/icons-material/Save";
import {
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Company } from "../../firebase/services/company-service";

interface CompanyProfileFormProps {
  companyData: Company;
  onSubmit: (updatedData: Partial<Company>, logoFile?: File) => Promise<void>;
}

// Industry types options
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

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({
  companyData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<Company>>({
    companyName: companyData.companyName || "",
    businessId: companyData.businessId || "",
    industryType: companyData.industryType || "",
    contactName: companyData.contactName || "",
    contactPhone: companyData.contactPhone || "",
    email: companyData.email || "",
    companyDescription: companyData.companyDescription || "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    companyData.logoURL ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Company, string>>>(
    {}
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name as keyof Company]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Company, string>> = {};

    if (!formData.companyName?.trim()) {
      newErrors.companyName = "請輸入企業名稱";
    }

    if (!formData.contactName?.trim()) {
      newErrors.contactName = "請輸入聯絡人姓名";
    }

    if (!formData.contactPhone?.trim()) {
      newErrors.contactPhone = "請輸入聯絡電話";
    } else if (!/^[0-9]{8,10}$/.test(formData.contactPhone.trim())) {
      newErrors.contactPhone = "請輸入有效的電話號碼";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "請輸入電子郵件";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "請輸入有效的電子郵件地址";
    }

    if (!formData.industryType) {
      newErrors.industryType = "請選擇產業類型";
    }

    if (!formData.businessId?.trim()) {
      newErrors.businessId = "請輸入統一編號";
    } else if (!/^[0-9]{8}$/.test(formData.businessId.trim())) {
      newErrors.businessId = "統一編號必須為8位數字";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData, logoFile || undefined);
      if (logoFile) {
        setLogoFile(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        企業資料
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Logo Upload Section */}

          {/* Company Information Fields */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="企業名稱"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.companyName}
              helperText={errors.companyName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="統一編號"
              name="businessId"
              value={formData.businessId}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.businessId}
              helperText={errors.businessId}
              disabled={!!companyData.businessId} // 已註冊的企業不可更改統一編號
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="產業類型"
              name="industryType"
              value={formData.industryType}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.industryType}
              helperText={errors.industryType ?? "請選擇最接近貴公司的產業類型"}
            >
              {industryTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="聯絡人姓名"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.contactName}
              helperText={errors.contactName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="聯絡電話"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.contactPhone}
              helperText={errors.contactPhone}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="電子郵件"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.email}
              helperText={errors.email}
              disabled={!!companyData.email} // 已註冊的企業不可更改郵件
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="企業簡介"
              name="companyDescription"
              value={formData.companyDescription}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="請輸入企業簡介，描述企業文化、產品服務等"
              helperText="建議字數：100-300字"
            />
          </Grid>

          {/* Submit Button */}
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              startIcon={<SaveIcon />}
              sx={{ minWidth: 120 }}
            >
              {isSubmitting ? "儲存中..." : "儲存變更"}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default CompanyProfileForm;
