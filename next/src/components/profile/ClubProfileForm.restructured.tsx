"use client";

import SaveIcon from "@mui/icons-material/Save";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Club } from "../../firebase/services/club-service";

// 分離出唯讀視圖組件
const ReadOnlyClubProfile = ({ clubData }: { clubData: Club }) => (
  <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      社團資料
    </Typography>

    <Grid container spacing={2}>
      {clubData.logoURL && (
        <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
          <Box
            component="img"
            src={clubData.logoURL}
            alt={`${clubData.clubName}的標誌`}
            sx={{
              width: 120,
              height: 120,
              objectFit: "contain",
              borderRadius: "50%",
            }}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <Typography>
          <strong>社團名稱：</strong> {clubData.clubName}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography>
          <strong>學校名稱：</strong> {clubData.schoolName}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography>
          <strong>社團類型：</strong> {clubData.clubType}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography>
          <strong>聯絡人姓名：</strong> {clubData.contactName}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography>
          <strong>聯絡電話：</strong> {clubData.contactPhone}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography>
          <strong>電子郵件：</strong> {clubData.email}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Typography sx={{ mt: 2 }}>
          <strong>社團簡介：</strong>
        </Typography>
        <Typography sx={{ whiteSpace: "pre-line" }}>
          {clubData.clubDescription}
        </Typography>
      </Grid>
    </Grid>
  </Paper>
);

// 分離 Logo 上傳區域
const LogoUploadSection = ({
  logoPreview,
  handleLogoChange,
}: {
  logoPreview: string | null;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <Grid
    item
    xs={12}
    display="flex"
    flexDirection="column"
    alignItems="center"
    mb={2}
  >
    {logoPreview && (
      <Box
        component="img"
        src={logoPreview}
        alt="社團標誌預覽"
        sx={{
          width: 120,
          height: 120,
          objectFit: "contain",
          borderRadius: "50%",
          mb: 2,
          border: "1px solid #e0e0e0",
        }}
      />
    )}
    <Button
      component="label"
      variant="outlined"
      sx={{ mt: logoPreview ? 1 : 0 }}
    >
      {logoPreview ? "更換標誌" : "上傳社團標誌"}
      <input type="file" accept="image/*" onChange={handleLogoChange} hidden />
    </Button>
    {logoPreview && (
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        建議使用正方形圖片，檔案大小不超過2MB
      </Typography>
    )}
  </Grid>
);

// 社團類型選項
const clubTypes = [
  "學術研究",
  "體育競技",
  "音樂表演",
  "藝術文化",
  "社會服務",
  "職涯發展",
  "科技創新",
  "國際交流",
  "其他",
];

// 驗證工具函數
const validateClubForm = (formData: Partial<Club>) => {
  const newErrors: Partial<Record<keyof Club, string>> = {};

  if (!formData.clubName?.trim()) {
    newErrors.clubName = "此欄位為必填";
  }

  if (!formData.schoolName?.trim()) {
    newErrors.schoolName = "此欄位為必填";
  }

  if (!formData.clubType) {
    newErrors.clubType = "此欄位為必填";
  }

  if (!formData.contactName?.trim()) {
    newErrors.contactName = "此欄位為必填";
  }

  if (!formData.contactPhone?.trim()) {
    newErrors.contactPhone = "此欄位為必填";
  } else if (!/^\d{8,10}$/.test(formData.contactPhone.trim())) {
    newErrors.contactPhone = "請輸入有效的電話號碼";
  }

  if (!formData.email?.trim()) {
    newErrors.email = "此欄位為必填";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    newErrors.email = "請輸入有效的電子郵件地址";
  }

  return newErrors;
};

interface ClubProfileFormProps {
  clubData: Club;
  onSubmit: (updatedData: Partial<Club>, logoFile?: File) => Promise<void>;
  readonly?: boolean;
}

const ClubProfileForm: React.FC<ClubProfileFormProps> = ({
  clubData,
  onSubmit,
  readonly = false,
}) => {
  // 如果是唯讀模式，直接返回唯讀視圖
  if (readonly) {
    return <ReadOnlyClubProfile clubData={clubData} />;
  }

  const [formData, setFormData] = useState<Partial<Club>>({
    clubName: clubData.clubName ?? "",
    schoolName: clubData.schoolName ?? "",
    clubType: clubData.clubType ?? "",
    contactName: clubData.contactName ?? "",
    contactPhone: clubData.contactPhone ?? "",
    email: clubData.email ?? "",
    clubDescription: clubData.clubDescription ?? "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    clubData.logoURL ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Club, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name as keyof Club]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = validateClubForm(formData);
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
      await onSubmit(formData, logoFile ?? undefined);
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
        社團資料
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Logo Upload Section */}
          <LogoUploadSection
            logoPreview={logoPreview}
            handleLogoChange={handleLogoChange}
          />

          {/* Club Information Fields */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="社團名稱"
              name="clubName"
              value={formData.clubName}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.clubName}
              helperText={errors.clubName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="學校名稱"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.schoolName}
              helperText={errors.schoolName}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="社團類型"
              name="clubType"
              value={formData.clubType}
              onChange={handleChange}
              margin="normal"
              required
              error={!!errors.clubType}
              helperText={errors.clubType ?? "請選擇最接近貴社團的類型"}
            >
              {clubTypes.map((option) => (
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

          <Grid item xs={12}>
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
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="社團簡介"
              name="clubDescription"
              value={formData.clubDescription}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="請輸入社團簡介，描述社團的宗旨、活動內容等"
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

export default ClubProfileForm;
