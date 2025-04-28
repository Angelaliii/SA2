import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  cooperationTypes,
  postLocations,
  postTypes,
  tagOptions,
  visibilityOptions,
} from "../../constants/articleOptions";
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
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [postType, setPostType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("公開");

  // 需求欄位
  const [organizationName, setOrganizationName] = useState("");
  const [demandItems, setDemandItems] = useState<string[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [demandDescription, setDemandDescription] = useState("");

  // 合作欄位
  const [cooperationType, setCooperationType] = useState("");
  const [cooperationDeadline, setCooperationDeadline] = useState("");
  const [cooperationReturn, setCooperationReturn] = useState("");

  // 預算相關
  const [budgetMin, setBudgetMin] = useState<number | string>("");
  const [budgetMax, setBudgetMax] = useState<number | string>("");

  // 活動相關
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");

  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 載入需求項目
  useEffect(() => {
    const loadDemandItems = async () => {
      const items = await getDemandItems();
      setDemandItems(items);
    };

    loadDemandItems();
  }, []);

  // 當對話框打開時，加載文章數據
  useEffect(() => {
    if (open && article?.id) {
      setIsLoading(true);

      // 從 article 數據中設置初始值
      setTitle(article.title || "");
      setContent(article.content || "");

      // 獲取完整的文章數據
      getPostById(article.id)
        .then((fullArticle) => {
          if (fullArticle) {
            // 基本欄位
            setTitle(fullArticle.title);
            setContent(fullArticle.content);
            setLocation(fullArticle.location || "");
            setPostType(fullArticle.postType || "");
            setTags(fullArticle.tags || []);
            setVisibility(fullArticle.visibility || "公開");

            // 需求欄位
            setOrganizationName(fullArticle.organizationName || "");
            setSelectedDemands(fullArticle.selectedDemands || []);
            setDemandDescription(fullArticle.demandDescription || "");

            // 合作欄位
            setCooperationType(fullArticle.cooperationType || "");
            setCooperationDeadline(fullArticle.cooperationDeadline || "");
            setCooperationReturn(fullArticle.cooperationReturn || "");

            // 預算相關
            if (fullArticle.budget) {
              setBudgetMin(fullArticle.budget.min || "");
              setBudgetMax(fullArticle.budget.max || "");
            }

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

    if (!title) newErrors.title = "請輸入標題";
    if (!content) newErrors.content = "請輸入內容";
    if (!postType) newErrors.postType = "請選擇文章類型";

    if (postType === "企業合作需求" || postType === "社團活動合作") {
      if (!cooperationType) newErrors.cooperationType = "請選擇合作類型";
      if (!cooperationDeadline)
        newErrors.cooperationDeadline = "請選擇合作期限";
    }

    if (postType === "企業合作需求") {
      if (!budgetMin && budgetMin !== 0) newErrors.budget = "請輸入最低預算";
    }

    if (postType === "社團活動合作") {
      if (!eventDate) newErrors.eventDate = "請選擇活動日期";
    }

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
        content,
        location,
        postType,
        tags,
        visibility,

        // 需求欄位
        organizationName,
        selectedDemands,
        demandDescription,

        // 合作欄位
        cooperationType,
        cooperationDeadline,
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

      // 預算相關 - 只有在企業合作需求時才設置
      if (
        postType === "企業合作需求" &&
        (budgetMin !== "" || budgetMax !== "")
      ) {
        updateData.budget = {
          min: Number(budgetMin) || 0,
          max: Number(budgetMax) || 0,
        };
      }

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
        {/* 文章類型與發布位置選擇 */}
        <Grid container spacing={2} alignItems="flex-start" sx={{ mt: 1 }}>
          {/* 文章類型選擇 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.postType}>
              <InputLabel id="post-type-label">文章類型</InputLabel>
              <Select
                labelId="post-type-label"
                value={postType}
                label="文章類型"
                onChange={(e) => setPostType(e.target.value)}
                disabled={isLoading}
              >
                {postTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
              {errors.postType && (
                <FormHelperText>{errors.postType}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* 發布位置選擇 */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="location-label">發布位置</InputLabel>
              <Select
                labelId="location-label"
                value={location}
                label="發布位置"
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
              >
                {postLocations.map((loc) => (
                  <MenuItem key={loc} value={loc}>
                    {loc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* 文章標題輸入 */}
        <TextField
          fullWidth
          label="標題"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={!!errors.title}
          helperText={errors.title}
          sx={{ mt: 2 }}
          disabled={isLoading}
        />

        {/* 文章內容輸入區 */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="內容"
            variant="outlined"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            multiline
            rows={6}
            error={!!errors.content}
            helperText={errors.content}
            disabled={isLoading}
          />
        </Box>

        {/* 標籤選擇區 */}
        <Autocomplete
          multiple
          options={tagOptions}
          value={tags}
          onChange={(_, newValue) => setTags(newValue)}
          renderInput={(params) => (
            <TextField {...params} label="標籤" sx={{ mt: 2 }} />
          )}
          disabled={isLoading}
        />

        {/* 特定需求欄位 */}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="組織名稱"
            variant="outlined"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            sx={{ mb: 2 }}
            disabled={isLoading}
          />

          <Autocomplete
            multiple
            options={demandItems}
            value={selectedDemands}
            onChange={(_, newValue) => setSelectedDemands(newValue)}
            renderInput={(params) => <TextField {...params} label="需求項目" />}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="需求描述"
            variant="outlined"
            value={demandDescription}
            onChange={(e) => setDemandDescription(e.target.value)}
            multiline
            rows={4}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />
        </Box>

        {/* 合作需求特有欄位 */}
        {(postType === "企業合作需求" || postType === "社團活動合作") && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              合作詳情
            </Typography>
            <Grid container spacing={2}>
              {/* 合作類型選擇 */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.cooperationType}>
                  <InputLabel id="cooperation-type-label">合作類型</InputLabel>
                  <Select
                    labelId="cooperation-type-label"
                    value={cooperationType}
                    label="合作類型"
                    onChange={(e) => setCooperationType(e.target.value)}
                    disabled={isLoading}
                  >
                    {cooperationTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.cooperationType && (
                    <FormHelperText>{errors.cooperationType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              {/* 合作期限設定 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="合作期限"
                  type="date"
                  value={cooperationDeadline}
                  onChange={(e) => setCooperationDeadline(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!errors.cooperationDeadline}
                  helperText={errors.cooperationDeadline}
                  disabled={isLoading}
                />
              </Grid>

              {/* 合作回饋 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="合作回饋"
                  variant="outlined"
                  value={cooperationReturn}
                  onChange={(e) => setCooperationReturn(e.target.value)}
                  multiline
                  rows={3}
                  disabled={isLoading}
                />
              </Grid>

              {/* 企業合作需求特有欄位：預算 */}
              {postType === "企業合作需求" && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="最低預算"
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      value={budgetMin}
                      onChange={(e) => setBudgetMin(e.target.value)}
                      error={!!errors.budget}
                      helperText={errors.budget}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="最高預算"
                      type="number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">$</InputAdornment>
                        ),
                      }}
                      value={budgetMax}
                      onChange={(e) => setBudgetMax(e.target.value)}
                      disabled={isLoading}
                    />
                  </Grid>
                </>
              )}

              {/* 社團活動合作特有欄位 */}
              {postType === "社團活動合作" && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="活動名稱"
                      variant="outlined"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="活動類型"
                      variant="outlined"
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="活動日期"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      error={!!errors.eventDate}
                      helperText={errors.eventDate}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="參與人數"
                      variant="outlined"
                      value={estimatedParticipants}
                      onChange={(e) => setEstimatedParticipants(e.target.value)}
                      disabled={isLoading}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="活動描述"
                      variant="outlined"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      multiline
                      rows={3}
                      disabled={isLoading}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        )}

        {/* 可見範圍設定 */}
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel id="visibility-label">可見範圍</InputLabel>
          <Select
            labelId="visibility-label"
            value={visibility}
            label="可見範圍"
            onChange={(e) => setVisibility(e.target.value)}
            disabled={isLoading}
          >
            {visibilityOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
