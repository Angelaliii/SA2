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
  Link,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useEffect, useState } from "react";
import enterpriseService, { EnterprisePost } from "../../firebase/services/enterprise-service";

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
  const [formData, setFormData] = useState<Partial<EnterprisePost>>({});
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);

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
        announcementType: announcement.announcementType || "marketing",
        
        // Contact info
        contactName: announcement.contactName || "",
        contactPhone: announcement.contactPhone || "",
        
        // Marketing fields
        marketingProductName: announcement.marketingProductName || "",
        marketingPeriodStart: announcement.marketingPeriodStart || "",
        marketingPeriodEnd: announcement.marketingPeriodEnd || "",
        
        // Activity fields
        activityName: announcement.activityName || "",
        activityType: announcement.activityType || "",
        activityDateTime: announcement.activityDateTime || "",
        activityLocation: announcement.activityLocation || "",
        cooperationPurpose: announcement.cooperationPurpose || "",
        cooperationType: announcement.cooperationType || "",
        partnerRequirements: announcement.partnerRequirements || "",
        documentURL: announcement.documentURL || "",
        
        // Internship fields
        internshipTitle: announcement.internshipTitle || "",
        internshipDepartment: announcement.internshipDepartment || "",
        internshipPeriod: announcement.internshipPeriod || "",
        // weeklyHours: announcement.weeklyHours !== undefined ? String(announcement.weeklyHours) : "", // Fix for Firebase undefined value
        workLocation: announcement.workLocation || "",
        salary: announcement.salary || "",
        jobDescription: announcement.jobDescription || "",
        requirements: announcement.requirements || "",
        benefits: announcement.benefits || "",
        applicationDeadline: announcement.applicationDeadline || "",
        interviewMethod: announcement.interviewMethod || "",
        additionalDocumentURL: announcement.additionalDocumentURL || "",
      });
    }
  }, [open, announcement]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    if (!formData.title || !formData.content) {
      alert("請填寫標題和內容");
      return;
    }

    setLoading(true);
    try {
      // Create a clean data object without undefined values
      const cleanData = { ...formData };
      
      // Convert empty string weeklyHours to undefined if it exists as empty string
      // if (cleanData.weeklyHours === "") {
      //   cleanData.weeklyHours = undefined;
      // } else {
      //   cleanData.weeklyHours = Number(cleanData.weeklyHours);
      // }
      
      await enterpriseService.updatePost(announcement.id!, cleanData);
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
        />

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="announcement-type-label">公告類型</InputLabel>
          <Select
            labelId="announcement-type-label"
            name="announcementType"
            value={formData.announcementType || "marketing"}
            onChange={handleSelectChange}
            label="公告類型"
            disabled={true} // 不允许更改公告类型，只能在创建时选择
          >
            <MenuItem value="marketing">行銷推廣</MenuItem>
            <MenuItem value="activity">活動合作</MenuItem>
            <MenuItem value="internship">實習合作</MenuItem>
          </Select>
          <FormHelperText>公告類型不可更改</FormHelperText>
        </FormControl>
        
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          聯繫窗口
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
        </Box>
        
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="詳細資訊" />
          <Tab label="公告內容" />
        </Tabs>
        
        {currentTab === 0 && (
          <>
            {/* 根據公告類型顯示對應的表單 */}
            {formData.announcementType === "marketing" && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                mt: 2, 
                bgcolor: '#f2f9ff' 
              }}>
                <Typography variant="h6" gutterBottom>
                  行銷推廣詳細資訊
                </Typography>
                
                <TextField
                  fullWidth
                  name="marketingProductName"
                  label="推廣產品/服務名稱"
                  variant="outlined"
                  value={formData.marketingProductName || ""}
                  onChange={handleInputChange}
                  sx={{ mb: 2 }}
                />
                
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <DatePicker
                      label="推廣開始日期"
                      value={parseDate(formData.marketingPeriodStart)}
                      onChange={(date) => handleDateChange('marketingPeriodStart', date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                    
                    <DatePicker
                      label="推廣結束日期"
                      value={parseDate(formData.marketingPeriodEnd)}
                      onChange={(date) => handleDateChange('marketingPeriodEnd', date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Box>
                </LocalizationProvider>
              </Box>
            )}
            
            {formData.announcementType === "activity" && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                mt: 2, 
                bgcolor: '#f6f9ff' 
              }}>
                <Typography variant="h6" gutterBottom>
                  活動合作詳細資訊
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    name="activityName"
                    label="活動名稱"
                    variant="outlined"
                    value={formData.activityName || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  
                  <TextField
                    name="activityType"
                    label="活動類型"
                    variant="outlined"
                    value={formData.activityType || ""}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="演講/工作坊/展覽/比賽等"
                  />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    name="activityDateTime"
                    label="活動日期與時間"
                    variant="outlined"
                    value={formData.activityDateTime || ""}
                    onChange={handleInputChange}
                    fullWidth
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                  />
                  
                  <TextField
                    name="activityLocation"
                    label="活動地點"
                    variant="outlined"
                    value={formData.activityLocation || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Box>
                
                <TextField
                  name="cooperationPurpose"
                  label="合作說明與目的"
                  variant="outlined"
                  value={formData.cooperationPurpose || ""}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    name="cooperationType"
                    label="合作方式"
                    variant="outlined"
                    value={formData.cooperationType || ""}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="贊助/場地提供/技術支援等"
                  />
                  
                  <TextField
                    name="documentURL"
                    label="相關文件連結"
                    variant="outlined"
                    value={formData.documentURL || ""}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="http://..."
                  />
                </Box>
                
                <TextField
                  name="partnerRequirements"
                  label="徵求合作對象條件"
                  variant="outlined"
                  value={formData.partnerRequirements || ""}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Box>
            )}
            
            {formData.announcementType === "internship" && (
              <Box sx={{ 
                p: 2, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                mt: 2, 
                bgcolor: '#f5fcf9' 
              }}>
                <Typography variant="h6" gutterBottom>
                  實習合作詳細資訊
                </Typography>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    name="internshipTitle"
                    label="實習職缺名稱"
                    variant="outlined"
                    value={formData.internshipTitle || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  
                  <TextField
                    name="internshipDepartment"
                    label="實習部門"
                    variant="outlined"
                    value={formData.internshipDepartment || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    name="internshipPeriod"
                    label="實習期間"
                    variant="outlined"
                    value={formData.internshipPeriod || ""}
                    onChange={handleInputChange}
                    fullWidth
                    placeholder="如: 3個月/6個月/一年"
                  />
                  
                  <TextField
                    name="weeklyHours"
                    label="每週工作時數"
                    variant="outlined"
                    value={formData.weeklyHours || ""}
                    onChange={handleInputChange}
                    fullWidth
                    type="number"
                  />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <TextField
                    name="workLocation"
                    label="工作地點"
                    variant="outlined"
                    value={formData.workLocation || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                  
                  <TextField
                    name="salary"
                    label="薪資待遇"
                    variant="outlined"
                    value={formData.salary || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Box>
                
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
                  placeholder="科系、年級、技能等"
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
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="申請截止日期"
                      value={parseDate(formData.applicationDeadline)}
                      onChange={(date) => handleDateChange('applicationDeadline', date)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </LocalizationProvider>
                  
                  <TextField
                    name="interviewMethod"
                    label="面試方式"
                    variant="outlined"
                    value={formData.interviewMethod || ""}
                    onChange={handleInputChange}
                    fullWidth
                  />
                </Box>
                
                <TextField
                  name="additionalDocumentURL"
                  label="附加說明文件連結"
                  variant="outlined"
                  value={formData.additionalDocumentURL || ""}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="http://..."
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
