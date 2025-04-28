import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import {
  getDemandItems,
  getPostById,
} from "../../firebase/services/post-service";

type ArticleEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: any;
};

export default function ArticleEditDialog({
  open,
  onClose,
  onSuccess,
  article,
}: ArticleEditDialogProps) {
  // 基本欄位
  const [title, setTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");

  // 需求欄位
  const [demandItems, setDemandItems] = useState<string[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [demandDescription, setDemandDescription] = useState("");
  const [cooperationReturn, setCooperationReturn] = useState("");

  // 活動相關
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");

  // 事件類型選項
  const eventTypes = ["講座", "工作坊", "表演", "比賽", "展覽", "營隊", "其他"];

  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 載入需求項目
  useEffect(() => {
    const loadDemandItems = async () => {
      const defaultItems = ["零食", "飲料", "生活用品", "戶外用品", "其他"];
      try {
        const items = await getDemandItems();
        setDemandItems(items.length ? items : defaultItems);
      } catch {
        console.error("無法載入需求物資，使用預設值");
        setDemandItems(defaultItems);
      }
    };

    loadDemandItems();
  }, []);

  // 當對話框打開時，加載文章數據
  useEffect(() => {
    if (open && article?.id) {
      setIsLoading(true);

      // 從 article 數據中設置初始值
      setTitle(article.title || "");

      // 獲取完整的文章數據
      getPostById(article.id)
        .then((fullArticle) => {
          if (fullArticle) {
            // 基本欄位
            setTitle(fullArticle.title || "");
            setOrganizationName(fullArticle.organizationName || "");
            setEmail(fullArticle.email || "");

            // 需求欄位
            setSelectedDemands(fullArticle.selectedDemands || []);
            setDemandDescription(fullArticle.demandDescription || "");
            setCooperationReturn(fullArticle.cooperationReturn || "");

            // 活動相關
            setEventName(fullArticle.eventName || "");
            setEventType(fullArticle.eventType || "");
            setEventDate(fullArticle.eventDate || "");
            setEventDescription(fullArticle.eventDescription || "");
            setEstimatedParticipants(fullArticle.estimatedParticipants || "");
          }
        })
        .catch((error) => {
          console.error("獲取文章詳情失敗", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, article]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "請輸入標題";
    if (selectedDemands.length === 0)
      newErrors.selectedDemands = "請選擇至少一項需求物資";
    if (!eventDate) newErrors.eventDate = "活動日期為必填項目";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // 構建更新數據
      const updateData: any = {
        // 基本欄位
        title,
        organizationName,
        email,

        // 需求欄位
        selectedDemands,
        demandDescription,
        cooperationReturn,

        // 活動相關
        eventName,
        eventType,
        eventDate,
        eventDescription,
        estimatedParticipants,

        // 更新時間
        updatedAt: serverTimestamp(),
      };

      // 使用 post-service 的 API 更新文章
      const postRef = doc(db, "posts", article.id);
      await updateDoc(postRef, updateData);

      onSuccess();
    } catch (error) {
      console.error("更新文章失敗", error);
      alert("更新文章失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>編輯需求文章</DialogTitle>
      <DialogContent>
        {/* 基本資訊區塊 */}
        <Box
          sx={{
            backgroundColor: "#f9f9f9",
            p: 2,
            borderRadius: 2,
            mb: 3,
            mt: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            填寫基本資訊
          </Typography>
          <TextField
            fullWidth
            label="標題"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={!!errors.title}
            helperText={errors.title || ""}
            sx={{ mb: 2 }}
            disabled={isLoading}
            required
          />
          <TextField
            fullWidth
            label="組織名稱"
            variant="outlined"
            value={organizationName}
            disabled
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="聯絡信箱"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            sx={{ mb: 2 }}
            disabled={isLoading}
            helperText="此信箱將作為合作洽談的聯絡方式"
          />
        </Box>

        {/* 需求物資區塊 */}
        <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            選擇你需要的資源
          </Typography>
          <Autocomplete
            multiple
            options={demandItems}
            value={selectedDemands}
            onChange={(_, newValue) => setSelectedDemands(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="請選擇需求物資"
                placeholder="選擇需求物資"
                error={!!errors.selectedDemands}
                helperText={errors.selectedDemands || ""}
                required
              />
            )}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="需求物資說明"
            placeholder="請輸入需求物資的詳細說明"
            multiline
            rows={4}
            variant="outlined"
            value={demandDescription}
            onChange={(e) => setDemandDescription(e.target.value)}
            disabled={isLoading}
          />
        </Box>

        {/* 回饋方案 */}
        <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            說明你的回饋方式
          </Typography>
          <TextField
            fullWidth
            label="回饋方案"
            placeholder="請輸入回饋方案（可換行）"
            multiline
            rows={4}
            variant="outlined"
            value={cooperationReturn}
            onChange={(e) => setCooperationReturn(e.target.value)}
            disabled={isLoading}
          />
        </Box>

        {/* 活動資訊 */}
        <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            活動資訊
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="活動名稱"
                variant="outlined"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={eventTypes}
                value={eventType}
                onChange={(_, newValue) => setEventType(newValue || "")}
                renderInput={(params) => (
                  <TextField {...params} label="活動性質" variant="outlined" />
                )}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="活動預估人數"
                variant="outlined"
                type="number"
                value={estimatedParticipants}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (value > 0 || e.target.value === "") {
                    setEstimatedParticipants(e.target.value);
                  }
                }}
                inputProps={{ min: 1 }}
                disabled={isLoading}
                error={
                  parseInt(estimatedParticipants) <= 0 &&
                  estimatedParticipants !== ""
                }
                helperText={
                  parseInt(estimatedParticipants) <= 0 &&
                  estimatedParticipants !== ""
                    ? "人數必須大於0"
                    : ""
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="活動日期"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                error={!!errors.eventDate}
                helperText={errors.eventDate || ""}
                disabled={isLoading}
                required
              />
            </Grid>
          </Grid>
        </Box>

        {/* 補充說明 */}
        <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            補充說明
          </Typography>
          <TextField
            fullWidth
            label="說明"
            placeholder="請輸入補充資料"
            multiline
            rows={4}
            variant="outlined"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            disabled={isLoading}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          disabled={loading || isLoading}
        >
          {loading ? "更新中..." : "更新文章"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
