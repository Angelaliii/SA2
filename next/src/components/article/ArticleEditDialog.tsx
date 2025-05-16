import {
  Autocomplete,
  Box,
  Button,
  Chip,
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
  const [demandType, setDemandType] = useState(""); // 新增需求類型欄位

  // 物資需求欄位
  const [demandItems, setDemandItems] = useState<string[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [demandDescription, setDemandDescription] = useState("");
  const [itemType, setItemType] = useState(""); // 物資類型
  const [customItems, setCustomItems] = useState<string[]>([]);
  // 兼容舊版物資數據
  const [materialCategory, setMaterialCategory] = useState<string[]>([]);
  const [materialDetails, setMaterialDetails] = useState("");

  // 金錢需求欄位
  const [moneyLowerLimit, setMoneyLowerLimit] = useState("");
  const [moneyUpperLimit, setMoneyUpperLimit] = useState("");
  const [moneyPurpose, setMoneyPurpose] = useState("");

  // 講師需求欄位
  const [speakerType, setSpeakerType] = useState("");
  const [speakerDetail, setSpeakerDetail] = useState("");

  // 共通欄位
  const [cooperationReturn, setCooperationReturn] = useState("");
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [sponsorDeadline, setSponsorDeadline] = useState("");

  // 活動相關
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");

  // 事件類型選項
  const eventTypes = ["講座", "工作坊", "表演", "比賽", "展覽", "營隊", "其他"];
  // 講師類型選項
  const speakerTypes = ["技術講師", "學術講師", "創業講師", "職涯講師", "其他"];

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
      setTitle(article.title ?? "");

      // 獲取完整的文章數據
      getPostById(article.id)
        .then((fullArticle) => {
          if (fullArticle) {
            // 基本欄位
            setTitle(fullArticle.title || "");
            setOrganizationName(fullArticle.organizationName ?? "");
            setEmail(fullArticle.email ?? "");
            setDemandType(fullArticle.demandType ?? ""); // 設置需求類型

            // 需求欄位 - 根據不同需求類型設置對應欄位
            // 物資需求 - 兼容舊版和新版的數據格式
            setSelectedDemands(fullArticle.selectedDemands || []);
            setDemandDescription(fullArticle.demandDescription ?? "");
            setCustomItems(fullArticle.customItems || []);
            // 兼容舊版的物資數據
            setMaterialCategory(fullArticle.materialCategory || []);
            setMaterialDetails(fullArticle.materialDetails ?? "");

            // 金錢需求
            setMoneyLowerLimit(fullArticle.moneyLowerLimit ?? "");
            setMoneyUpperLimit(fullArticle.moneyUpperLimit ?? "");
            setMoneyPurpose(fullArticle.moneyPurpose ?? "");

            // 講師需求
            setSpeakerType(fullArticle.speakerType ?? "");
            setSpeakerDetail(fullArticle.speakerDetail ?? "");

            // 共通欄位
            setCooperationReturn(fullArticle.cooperationReturn ?? "");
            setFeedbackDetails(fullArticle.feedbackDetails ?? "");
            setSponsorDeadline(fullArticle.sponsorDeadline ?? "");

            // 活動相關
            setEventName(fullArticle.eventName ?? "");
            setEventType(fullArticle.eventType ?? "");
            setEventDate(fullArticle.eventDate ?? "");
            setEventStart(fullArticle.eventStart ?? "");
            setEventEnd(fullArticle.eventEnd ?? "");
            setEventDescription(fullArticle.eventDescription ?? "");
            setEstimatedParticipants(fullArticle.estimatedParticipants ?? "");
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

    // 根據不同需求類型進行驗證
    if (demandType === "物資") {
      if (selectedDemands.length === 0)
        newErrors.selectedDemands = "請選擇至少一項需求物資";
    } else if (demandType === "金錢") {
      if (!moneyLowerLimit) newErrors.moneyLowerLimit = "請輸入金額下限";
      if (!moneyUpperLimit) newErrors.moneyUpperLimit = "請輸入金額上限";
    } else if (demandType === "講師") {
      if (!speakerType) newErrors.speakerType = "請選擇講師類型";
    }

    if (!eventStart && !eventDate)
      newErrors.eventStart = "活動開始日期為必填項目";
    if (!feedbackDetails) newErrors.feedbackDetails = "請輸入回饋方式";

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
        // 需求類型不變
        demandType,

        // 更新時間
        updatedAt: serverTimestamp(),
      };

      // 根據需求類型添加對應欄位
      if (demandType === "物資") {
        Object.assign(updateData, {
          selectedDemands,
          demandDescription,
          customItems,
          // 兼容舊版的物資數據格式，確保兩者都能被查詢到
          materialCategory:
            selectedDemands.length > 0 ? selectedDemands : materialCategory,
          materialDetails: demandDescription || materialDetails,
        });
      } else if (demandType === "金錢") {
        Object.assign(updateData, {
          moneyLowerLimit,
          moneyUpperLimit,
          moneyPurpose,
        });
      } else if (demandType === "講師") {
        Object.assign(updateData, {
          speakerType,
          speakerDetail,
        });
      }

      // 共通欄位
      Object.assign(updateData, {
        cooperationReturn,
        feedbackDetails,
        sponsorDeadline,

        // 活動相關
        eventName,
        eventType,
        eventDate,
        eventStart: eventStart || eventDate, // 確保至少有一個日期值
        eventEnd,
        eventDescription,
        estimatedParticipants,
      });

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

  // 渲染需求相關欄位 - 根據需求類型顯示對應欄位
  const renderDemandFields = () => {
    switch (demandType) {
      case "物資":
        return (
          <Box
            sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
          >
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
        );
      case "金錢":
        return (
          <Box
            sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              填寫金額資訊
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="金額下限"
                  variant="outlined"
                  type="number"
                  value={moneyLowerLimit}
                  onChange={(e) => setMoneyLowerLimit(e.target.value)}
                  error={!!errors.moneyLowerLimit}
                  helperText={errors.moneyLowerLimit || ""}
                  disabled={isLoading}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="金額上限"
                  variant="outlined"
                  type="number"
                  value={moneyUpperLimit}
                  onChange={(e) => setMoneyUpperLimit(e.target.value)}
                  error={!!errors.moneyUpperLimit}
                  helperText={errors.moneyUpperLimit || ""}
                  disabled={isLoading}
                  required
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="金額用途說明"
              placeholder="請說明所需金額的用途"
              multiline
              rows={4}
              variant="outlined"
              value={moneyPurpose}
              onChange={(e) => setMoneyPurpose(e.target.value)}
              disabled={isLoading}
              sx={{ mt: 2 }}
            />
          </Box>
        );
      case "講師":
        return (
          <Box
            sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
          >
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              講師需求資訊
            </Typography>
            <Autocomplete
              options={speakerTypes}
              value={speakerType}
              onChange={(_, newValue) => setSpeakerType(newValue || "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="請選擇講師類型"
                  error={!!errors.speakerType}
                  helperText={errors.speakerType || ""}
                  required
                />
              )}
              disabled={isLoading}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="講師需求詳細說明"
              placeholder="請輸入講師需求的詳細說明，例如專業領域、經驗要求等"
              multiline
              rows={4}
              variant="outlined"
              value={speakerDetail}
              onChange={(e) => setSpeakerDetail(e.target.value)}
              disabled={isLoading}
            />
          </Box>
        );
      default:
        return null;
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
          </Typography>{" "}
          {/* 需求類型顯示（不可編輯） */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography variant="body1" fontWeight="medium">
                需求類型：{demandType || "未指定"}
              </Typography>
              <Chip
                label={demandType}
                color={
                  demandType === "物資"
                    ? "primary"
                    : demandType === "金錢"
                    ? "error"
                    : "success"
                }
                size="small"
                sx={{ ml: 2 }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              需求類型不可更改，若需更改請重新發布需求
            </Typography>
          </Box>
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

        {/* 根據需求類型動態渲染對應的欄位 */}
        {renderDemandFields()}

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
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="回饋詳情"
            placeholder="請輸入具體的回饋方式"
            multiline
            rows={4}
            variant="outlined"
            value={feedbackDetails}
            onChange={(e) => setFeedbackDetails(e.target.value)}
            error={!!errors.feedbackDetails}
            helperText={errors.feedbackDetails || ""}
            disabled={isLoading}
            required
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
                label="活動開始日期"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                value={eventStart || eventDate} // 優先使用eventStart，兼容舊數據
                onChange={(e) => {
                  setEventStart(e.target.value);
                  // 如果結束日期早於開始日期，自動更新結束日期
                  if (eventEnd && e.target.value > eventEnd) {
                    setEventEnd(e.target.value);
                  }
                }}
                error={!!errors.eventStart}
                helperText={errors.eventStart || ""}
                disabled={isLoading}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="活動結束日期"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                value={eventEnd}
                onChange={(e) => setEventEnd(e.target.value)}
                error={!!errors.eventEnd}
                helperText={errors.eventEnd || ""}
                disabled={isLoading}
                inputProps={{
                  min: eventStart || eventDate || undefined,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="贊助截止日期"
                type="date"
                InputLabelProps={{
                  shrink: true,
                }}
                value={sponsorDeadline}
                onChange={(e) => setSponsorDeadline(e.target.value)}
                disabled={isLoading}
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
