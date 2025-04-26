import SaveIcon from "@mui/icons-material/Save";
import UploadIcon from "@mui/icons-material/Upload";
import {
  Avatar,
  Button,
  FormHelperText,
  Grid,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { Club } from "../../firebase/services/club-service";

interface ClubProfileFormProps {
  clubData: Club;
  onSubmit: (updatedData: Partial<Club>, logoFile?: File) => Promise<void>;
}

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

const ClubProfileForm: React.FC<ClubProfileFormProps> = ({
  clubData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<Partial<Club>>({
    clubName: clubData.clubName || "",
    schoolName: clubData.schoolName || "",
    clubType: clubData.clubType || "",
    contactName: clubData.contactName || "",
    contactPhone: clubData.contactPhone || "",
    email: clubData.email || "",
    clubDescription: clubData.clubDescription || "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    clubData.logoURL || null
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
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = (): boolean => {
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
    } else if (!/^[0-9]{8,10}$/.test(formData.contactPhone.trim())) {
      newErrors.contactPhone = "請輸入有效的電話號碼";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "此欄位為必填";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "請輸入有效的電子郵件地址";
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
        社團資料
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Logo Upload Section */}
          <Grid
            item
            xs={12}
            display="flex"
            flexDirection="column"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle1" gutterBottom>
              社團標誌
            </Typography>

            <Avatar
              src={logoPreview || undefined}
              alt={formData.clubName || "社團標誌"}
              sx={{ width: 120, height: 120, mb: 2 }}
            />

            <Button
              component="label"
              variant="outlined"
              startIcon={<UploadIcon />}
              size="small"
            >
              上傳標誌
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleLogoChange}
              />
            </Button>
            <FormHelperText>
              建議尺寸: 400x400像素，檔案大小不超過2MB
            </FormHelperText>
          </Grid>

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
              helperText={errors.clubType || "請選擇最接近貴社團的類型"}
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
