// "use client" 表示這個組件在瀏覽器端執行，而非伺服器端
"use client";

import SaveIcon from "@mui/icons-material/Save"; // 儲存圖示
import {
  Box, // 基本容器組件
  Button, // 按鈕組件
  Grid, // 網格佈局系統
  MenuItem, // 下拉選單項目
  Paper, // 帶陰影的卡片容器
  TextField, // 文字輸入欄位
  Typography, // 文字排版組件
} from "@mui/material";
import React, { useState } from "react"; // React 核心庫和 useState Hook
import { Club } from "../../firebase/services/club-service"; // 引入 Club 類型定義

/**
 * 唯讀視圖組件 - 用於顯示社團資料的唯讀模式
 *
 * 這個組件接收一個 clubData 物件作為參數，並以美觀的方式顯示其內容
 * 但不提供編輯功能
 */
const ReadOnlyClubProfile = ({ clubData }: { clubData: Club }) => (
  // Paper 是一個帶陰影的容器，提供紙張般的視覺效果
  <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
    {/* 標題 */}
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      社團資料
    </Typography>

    {/* Grid 是 Material UI 的佈局系統，可以輕鬆建立響應式佈局 */}
    <Grid container spacing={2}>
      {/* 條件渲染：只有當 logoURL 存在時才顯示標誌 */}
      {clubData.logoURL && (
        <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
          <Box
            component="img" // 將 Box 組件變成 img 元素
            src={clubData.logoURL}
            alt={`${clubData.clubName}的標誌`}
            sx={{
              width: 120,
              height: 120,
              objectFit: "contain", // 維持圖片比例
              borderRadius: "50%", // 圓形顯示
            }}
          />
        </Grid>
      )}

      {/* 使用 Grid 系統排列社團資料，在小螢幕上堆疊，大螢幕上並排 */}
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

      {/* 社團簡介 - 因為可能較長，所以佔據全寬 */}
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

/**
 * 社團類型選項 - 提供選擇用的固定選項清單
 */
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

/**
 * 表單驗證函數 - 檢查表單資料是否有效
 *
 * 這個函數會檢查所有必填欄位是否已填寫，並驗證電話和郵件格式
 * 返回一個包含錯誤訊息的物件
 */
const validateClubForm = (formData: Partial<Club>) => {
  // 初始化空的錯誤訊息物件
  const newErrors: Partial<Record<keyof Club, string>> = {};

  // (trim() 去除前後空白)
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
    // 使用正則表達式檢查是否為 8-10 位數字
    newErrors.contactPhone = "請輸入有效的電話號碼";
  }

  // 檢查電子郵件是否填寫，且格式是否正確
  if (!formData.email?.trim()) {
    newErrors.email = "此欄位為必填";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
    // 使用正則表達式檢查電子郵件格式
    newErrors.email = "請輸入有效的電子郵件地址";
  }

  return newErrors;
};

/**
 * 可編輯的社團表單組件
 *
 * 這個組件提供表單界面讓使用者編輯社團資料
 * 包含表單驗證和提交功能
 */
const EditableClubProfile = ({
  clubData, // 初始社團資料
  onSubmit, // 提交函數，由父組件提供
}: {
  clubData: Club;
  onSubmit: (updatedData: Partial<Club>, logoFile?: File) => Promise<void>;
}) => {
  // === 狀態管理部分 ===

  // 使用 React 的 useState Hook 來管理表單資料
  // useState 接收初始值並返回當前狀態值和一個更新函數
  const [formData, setFormData] = useState<Partial<Club>>({
    clubName: clubData.clubName || "",
    schoolName: clubData.schoolName || "",
    clubType: clubData.clubType || "",
    contactName: clubData.contactName || "",
    contactPhone: clubData.contactPhone || "",
    email: clubData.email || "",
    clubDescription: clubData.clubDescription || "",
  });

  // 標誌預覽用的狀態
  const [logoPreview, setLogoPreview] = useState<string | null>(
    clubData.logoURL || null
  );

  // 錯誤訊息狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 提交中的狀態，用來顯示載入中效果
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 事件處理函數 ===

  /**
   * 處理表單欄位變更的函數
   * 當使用者在任何欄位中輸入資料時會觸發此函數
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target; // 解構取得欄位名稱和值
    setFormData((prev) => ({
      ...prev, // 保留原有的所有值
      [name]: value, // 只更新變更的欄位
    }));

    // 如果該欄位之前有錯誤訊息，輸入新值後清除錯誤
    if (errors[name as keyof Club]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * 表單驗證函數，返回表單是否有效
   * 利用前面定義的 validateClubForm 函數來驗證
   */
  const validateForm = (): boolean => {
    const newErrors = validateClubForm(formData);
    setErrors(newErrors); // 更新錯誤狀態
    return Object.keys(newErrors).length === 0; // 如果沒有錯誤，返回 true
  };

  /**
   * 表單提交處理函數
   * 非同步函數，處理表單提交事件
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 防止表單預設的提交行為

    // 如果表單驗證失敗，直接返回不繼續
    if (!validateForm()) {
      return;
    }

    // 設定為提交中狀態，用來顯示載入中效果
    setIsSubmitting(true);
    try {
      // 呼叫從父組件傳來的 onSubmit 函數
      // undefined 表示沒有上傳新的標誌檔案
      await onSubmit(formData, undefined);
    } finally {
      // 無論成功或失敗，都將提交狀態設回 false
      setIsSubmitting(false);
    }
  };

  // 渲染表單界面
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        社團資料
      </Typography>

      {/* 表單元素，onSubmit 連接到 handleSubmit 函數 */}
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* 標誌上傳區域 */}
          <Grid
            item
            xs={12}
            display="flex"
            flexDirection="column"
            alignItems="center"
            mb={2}
          >
            {/* 條件渲染：只有當有標誌預覽時才顯示 */}
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
                }}
              />
            )}
            <Typography variant="body2" color="textSecondary" align="center">
              圖片上傳功能已停用
            </Typography>
          </Grid>

          {/* 社團資料輸入欄位 */}
          {/* Grid item xs={12} md={6} 表示在小螢幕上佔 12 格，中等以上螢幕佔 6 格（共 12 格） */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth // 寬度 100%
              label="社團名稱" // 欄位標籤
              name="clubName" // 欄位名稱，與 formData 中的屬性對應
              value={formData.clubName} // 綁定到狀態值
              onChange={handleChange} // 綁定變更處理函數
              margin="normal"
              required // HTML5 必填標記
              error={!!errors.clubName} // 如果有錯誤，顯示紅色
              helperText={errors.clubName} // 錯誤訊息
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
              select // 這是一個選擇欄位
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
              {/* 使用前面定義的 clubTypes 陣列建立選項 */}
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
              type="email" // 指定為 email 類型
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
              multiline // 多行文字輸入
              rows={4} // 顯示 4 行高
              placeholder="請輸入社團簡介，描述社團的宗旨、活動內容等"
              helperText="建議字數：100-300字"
            />
          </Grid>

          {/* 提交按鈕 */}
          <Grid
            item
            xs={12}
            display="flex"
            justifyContent="center"
            sx={{ mt: 2 }}
          >
            <Button
              type="submit" // HTML 表單提交按鈕
              variant="contained" // 實心按鈕樣式
              color="primary" // 主色系
              size="large"
              disabled={isSubmitting} // 提交中時禁用按鈕
              startIcon={<SaveIcon />} // 按鈕前面的儲存圖示
              sx={{ minWidth: 120 }} // 最小寬度樣式
            >
              {/* 根據提交狀態顯示不同文字 */}
              {isSubmitting ? "儲存中..." : "儲存變更"}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

/**
 * 主要 ClubProfileForm 組件
 *
 * 這是外部使用的主要組件入口點，根據 readonly 屬性
 * 決定是顯示唯讀視圖還是可編輯表單
 */
interface ClubProfileFormProps {
  clubData: Club; // 社團資料
  onSubmit: (updatedData: Partial<Club>, logoFile?: File) => Promise<void>; // 提交處理函數
  readonly?: boolean; // 是否為唯讀模式
}

const ClubProfileForm: React.FC<ClubProfileFormProps> = ({
  clubData,
  onSubmit,
  readonly = false, // 預設值為 false（可編輯模式）
}) => {
  // 根據 readonly 屬性決定顯示唯讀或可編輯模式
  if (readonly) {
    return <ReadOnlyClubProfile clubData={clubData} />;
  }

  return <EditableClubProfile clubData={clubData} onSubmit={onSubmit} />;
};

export default ClubProfileForm;
