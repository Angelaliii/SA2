import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import enterpriseService, {
  EnterprisePost,
} from "../../firebase/services/enterprise-service";

type EnterpriseEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcement: EnterprisePost;
};

export default function EnterpriseEditDialog({
  open,
  onClose,
  onSuccess,
  announcement,
}: EnterpriseEditDialogProps) {
  // Define a form state type that allows string values for numeric fields
  interface FormDataType
    extends Omit<
      Partial<EnterprisePost>,
      "weeklyHours" | "internshipPositions"
    > {
    weeklyHours?: string | number;
    internshipPositions?: string | number;
  }

  const [formData, setFormData] = useState<FormDataType>({});
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

  // 定義選項
  const activityTypeOptions = [
    "演講",
    "工作坊",
    "展覽",
    "比賽",
    "營隊",
    "其他",
  ];
  const interviewMethodOptions = [
    "線上面試",
    "實體面試",
    "電話面試",
    "專案測試",
    "多輪面試",
    "其他",
  ];
  const contractPeriodOptions = ["一個月", "三個月", "半年", "一年"];

  // Parse date strings to Date objects for the date pickers
  const parseDate = (dateString?: string): Date | null => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  };

  useEffect(() => {
    if (open && announcement) {
      setFormData({
        title: announcement.title || "",
        content: announcement.content || "",
        email: announcement.email || "",
        companyName: announcement.companyName || "",
        announcementType:
          announcement.announcementType || "specialOfferPartnership",

        // Contact info
        contactName: announcement.contactName || "",
        contactPhone: announcement.contactPhone || "",
        contactEmail: announcement.contactEmail || "",

        // 特約商店特有欄位
        partnershipName: announcement.partnershipName || "",
        contractPeriodDuration: announcement.contractPeriodDuration || "",

        // 活動合作特有欄位
        activityName: announcement.activityName || "",
        activityType: announcement.activityType || "",
        activityStartDate: announcement.activityStartDate || "",
        activityEndDate: announcement.activityEndDate || "",
        activityLocation: announcement.activityLocation || "",
        cooperationType: announcement.cooperationType || "",
        partnerRequirements: announcement.partnerRequirements || "",
        applicationDeadline: announcement.applicationDeadline || "",
        documentURL: announcement.documentURL || "",

        // 實習合作特有欄位
        internshipTitle: announcement.internshipTitle || "",
        internshipDepartment: announcement.internshipDepartment || "",
        internshipPeriod: announcement.internshipPeriod || "",
        weeklyHours:
          announcement.weeklyHours !== undefined
            ? String(announcement.weeklyHours)
            : "",
        workLocation: announcement.workLocation || "",
        salary: announcement.salary || "",
        jobDescription: announcement.jobDescription || "",
        requirements: announcement.requirements || "",
        internshipPositions:
          announcement.internshipPositions !== undefined
            ? String(announcement.internshipPositions)
            : "",
        benefits: announcement.benefits || "",
        internshipApplicationDeadline:
          announcement.internshipApplicationDeadline || "",
        interviewMethod: announcement.interviewMethod || "",
        additionalDocumentURL: announcement.additionalDocumentURL || "",
      });
    }
  }, [open, announcement]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, [name]: date.toISOString() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };
  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (!formData.title || !formData.content) {
        alert("標題和內容不能為空");
        return;
      } // Create a clean data object that matches EnterprisePost type
      const cleanData: Partial<EnterprisePost> = {
        ...Object.fromEntries(
          Object.entries(formData).filter(
            ([key]) => key !== "weeklyHours" && key !== "internshipPositions"
          )
        ),
      };

      // Convert weeklyHours string to number if it exists, otherwise exclude it
      if (formData.weeklyHours && formData.weeklyHours !== "") {
        cleanData.weeklyHours = Number(formData.weeklyHours);
      }
      // Do not include weeklyHours if it's empty or undefined

      // Convert internshipPositions string to number if it exists, otherwise exclude it
      if (formData.internshipPositions && formData.internshipPositions !== "") {
        cleanData.internshipPositions = Number(formData.internshipPositions);
      }
      // Do not include internshipPositions if it's empty or undefined

      // 最終清理：移除所有 undefined 值
      const finalData = Object.fromEntries(
        Object.entries(cleanData).filter(([_, value]) => value !== undefined)
      );

      await enterpriseService.updatePost(announcement.id!, finalData);
      onSuccess();
    } catch (error) {
      console.error("更新公告失敗", error);
      alert("更新公告失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>編輯企業公告</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          公告基本資訊
        </Typography>

        <TextField
          fullWidth
          name="title"
          label="公告標題"
          variant="outlined"
          value={formData.title || ""}
          onChange={handleInputChange}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          name="email"
          label="聯絡電子郵件"
          variant="outlined"
          value={formData.email || ""}
          onChange={handleInputChange}
          type="email"
          sx={{ mb: 2 }}
          helperText="此信箱將作為合作洽談的主要聯絡方式"
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="announcement-type-label">公告類型</InputLabel>
          <Select
            labelId="announcement-type-label"
            name="announcementType"
            value={formData.announcementType || "specialOfferPartnership"}
            onChange={handleSelectChange}
            label="公告類型"
            disabled={true} // 不允许更改公告类型，只能在创建时选择
          >
            <MenuItem value="specialOfferPartnership">特約商店</MenuItem>
            <MenuItem value="activityCooperation">活動合作</MenuItem>
            <MenuItem value="internshipCooperation">實習合作</MenuItem>
          </Select>
          <FormHelperText>公告類型不可更改</FormHelperText>
        </FormControl>

        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          聯繫窗口
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            name="contactName"
            label="聯繫人姓名"
            variant="outlined"
            value={formData.contactName || ""}
            onChange={handleInputChange}
            fullWidth
          />

          <TextField
            name="contactPhone"
            label="聯繫電話"
            variant="outlined"
            value={formData.contactPhone || ""}
            onChange={handleInputChange}
            fullWidth
          />

          <TextField
            name="contactEmail"
            label="聯繫信箱"
            variant="outlined"
            value={formData.contactEmail || ""}
            onChange={handleInputChange}
            fullWidth
          />
        </Box>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="詳細資訊" />
          <Tab label="公告內容" />
        </Tabs>

        {currentTab === 0 && (
          <>
            {/* 根據公告類型顯示對應的表單 */}
            {formData.announcementType === "specialOfferPartnership" && (
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  mt: 2,
                  bgcolor: "#f2f9ff",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  特約商店資訊
                </Typography>

                <TextField
                  fullWidth
                  name="partnershipName"
                  label="特約商店名稱"
                  variant="outlined"
                  value={formData.partnershipName || ""}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="contract-period-label">合約期限</InputLabel>
                  <Select
                    labelId="contract-period-label"
                    name="contractPeriodDuration"
                    value={formData.contractPeriodDuration || ""}
                    onChange={handleSelectChange}
                    label="合約期限"
                  >
                    <MenuItem value="">選擇合約期限</MenuItem>
                    {contractPeriodOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {formData.announcementType === "activityCooperation" && (
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  mt: 2,
                  bgcolor: "#f6f9ff",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  活動合作資訊
                </Typography>

                <TextField
                  fullWidth
                  name="activityName"
                  label="活動名稱"
                  variant="outlined"
                  value={formData.activityName || ""}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="activity-type-label">活動類型</InputLabel>
                    <Select
                      labelId="activity-type-label"
                      name="activityType"
                      value={formData.activityType || ""}
                      onChange={handleSelectChange}
                      label="活動類型"
                    >
                      <MenuItem value="">選擇活動類型</MenuItem>
                      {activityTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    name="activityStartDate"
                    label="活動開始日期"
                    type="date"
                    variant="outlined"
                    value={formData.activityStartDate || ""}
                    onChange={handleInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    name="activityEndDate"
                    label="活動結束日期"
                    type="date"
                    variant="outlined"
                    value={formData.activityEndDate || ""}
                    onChange={handleInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <TextField
                  name="activityLocation"
                  label="活動地點"
                  variant="outlined"
                  value={formData.activityLocation || ""}
                  onChange={handleInputChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="cooperationType"
                  label="合作方式"
                  variant="outlined"
                  value={formData.cooperationType || ""}
                  onChange={handleInputChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="partnerRequirements"
                  label="徵求合作對象條件"
                  variant="outlined"
                  value={formData.partnerRequirements || ""}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="applicationDeadline"
                  label="申請截止日期"
                  type="date"
                  variant="outlined"
                  value={formData.applicationDeadline || ""}
                  onChange={handleInputChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="documentURL"
                  label="相關文件連結"
                  variant="outlined"
                  value={formData.documentURL || ""}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="請輸入文件的URL連結"
                />
              </Box>
            )}

            {formData.announcementType === "internshipCooperation" && (
              <Box
                sx={{
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  mt: 2,
                  bgcolor: "#f5fcf9",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  實習合作資訊
                </Typography>

                <TextField
                  fullWidth
                  name="internshipTitle"
                  label="實習職缺名稱"
                  variant="outlined"
                  value={formData.internshipTitle || ""}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    name="internshipDepartment"
                    label="實習部門"
                    variant="outlined"
                    value={formData.internshipDepartment || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />

                  <TextField
                    name="internshipPeriod"
                    label="實習期間"
                    variant="outlined"
                    value={formData.internshipPeriod || ""}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="例：3個月/1學期"
                  />
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    name="weeklyHours"
                    label="每週工作時數"
                    variant="outlined"
                    value={formData.weeklyHours || ""}
                    onChange={handleInputChange}
                    fullWidth
                    type="number"
                    inputProps={{ min: 0 }}
                  />

                  <TextField
                    name="salary"
                    label="薪資待遇"
                    variant="outlined"
                    value={formData.salary || ""}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="例：時薪165元/月薪25,000元"
                  />
                </Box>

                <TextField
                  name="workLocation"
                  label="工作地點"
                  variant="outlined"
                  value={formData.workLocation || ""}
                  onChange={handleInputChange}
                  fullWidth
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="jobDescription"
                  label="職務內容"
                  variant="outlined"
                  value={formData.jobDescription || ""}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="requirements"
                  label="應徵條件"
                  variant="outlined"
                  value={formData.requirements || ""}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                  placeholder="例：科系、年級、技能等"
                />

                <TextField
                  name="internshipPositions"
                  label="實習名額"
                  variant="outlined"
                  value={formData.internshipPositions || ""}
                  onChange={handleInputChange}
                  fullWidth
                  type="number"
                  inputProps={{ min: 0 }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  name="benefits"
                  label="實習福利"
                  variant="outlined"
                  value={formData.benefits || ""}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <TextField
                    name="internshipApplicationDeadline"
                    label="申請截止日期"
                    type="date"
                    variant="outlined"
                    value={formData.internshipApplicationDeadline || ""}
                    onChange={handleInputChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />

                  <FormControl fullWidth>
                    <InputLabel id="interview-method-label">
                      面試方式
                    </InputLabel>
                    <Select
                      labelId="interview-method-label"
                      name="interviewMethod"
                      value={formData.interviewMethod || ""}
                      onChange={handleSelectChange}
                      label="面試方式"
                    >
                      <MenuItem value="">選擇面試方式</MenuItem>
                      {interviewMethodOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  name="additionalDocumentURL"
                  label="附加說明文件連結"
                  variant="outlined"
                  value={formData.additionalDocumentURL || ""}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="請輸入文件的URL連結"
                />
              </Box>
            )}
          </>
        )}

        {currentTab === 1 && (
          <TextField
            fullWidth
            name="content"
            label="公告內容"
            variant="outlined"
            value={formData.content || ""}
            onChange={handleInputChange}
            required
            multiline
            rows={12}
            sx={{ mt: 2 }}
            placeholder="詳細描述合作內容、期望與條件"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          {loading ? "更新中..." : "更新公告"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
