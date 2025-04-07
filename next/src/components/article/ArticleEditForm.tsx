// 文章編輯表單組件
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArticleFormProps } from "../../types/article";

// 引入靜態選項
import {
  cooperationTypes,
  postLocations,
  postTypes,
  tagOptions,
  visibilityOptions,
} from "../../constants/articleOptions";

/**
 * 文章編輯表單組件
 * 提供文章的所有編輯功能，包括基本資訊、合作詳情等
 */
export default function ArticleEditForm({
  // 表單資料
  data,
  errors,

  // UI 狀態
  isDraft,
  loading,
  currentDraftId,
  lastSaved,

  // 事件處理函數
  onTitleChange,
  onContentChange,
  onLocationChange,
  onPostTypeChange,
  onTagsChange,
  onVisibilityChange,
  onCooperationTypeChange,
  onCooperationDeadlineChange,
  onBudgetMinChange,
  onBudgetMaxChange,
  onEventDateChange,

  // 動作函數
  onSaveDraft,
  onPublish,
  onDeleteDraft,
  onResetForm,
  onPreview,
}: ArticleFormProps) {
  // 解構表單資料以便使用
  const {
    title,
    content,
    location,
    tags,
    postType,
    visibility,
    cooperationType,
    cooperationDeadlineStr,
    budgetMin,
    budgetMax,
    eventDateStr,
  } = data;

  return (
    <Stack spacing={2} mt={2}>
      {/* 文章類型與發布位置選擇 */}
      <Grid container spacing={2} alignItems="flex-start">
        {/* 文章類型選擇 */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth error={!!errors.postType} sx={{ m: 0 }}>
            <InputLabel id="post-type-label">文章類型</InputLabel>
            <Select
              labelId="post-type-label"
              value={postType}
              label="文章類型"
              onChange={(e) => onPostTypeChange(e.target.value)}
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
          <FormControl fullWidth sx={{ m: 0 }}>
            <InputLabel id="location-label">發布位置</InputLabel>
            <Select
              labelId="location-label"
              value={location}
              label="發布位置"
              onChange={(e) => onLocationChange(e.target.value)}
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
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        error={!!errors.title}
        helperText={errors.title}
      />

      {/* 文章內容輸入區 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          內容
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={10}
          placeholder="請輸入文章內容..."
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          error={!!errors.content}
          helperText={errors.content || ""}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 1,
              borderColor: errors.content ? "red" : "#ccc",
            },
          }}
        />
      </Box>

      {/* 標籤選擇區 */}
      <Autocomplete
        multiple
        options={tagOptions}
        value={tags}
        onChange={(_, newValue) => onTagsChange(newValue)}
        renderInput={(params) => <TextField {...params} label="標籤" />}
      />

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
                  onChange={(e) => onCooperationTypeChange(e.target.value)}
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
                value={cooperationDeadlineStr}
                onChange={(e) => onCooperationDeadlineChange(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!errors.cooperationDeadline}
                helperText={errors.cooperationDeadline}
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
                    onChange={(e) => onBudgetMinChange(e.target.value)}
                    error={!!errors.budget}
                    helperText={errors.budget}
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
                    onChange={(e) => onBudgetMaxChange(e.target.value)}
                  />
                </Grid>
              </>
            )}

            {/* 社團活動合作特有欄位：活動日期 */}
            {postType === "社團活動合作" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="活動日期"
                  type="date"
                  value={eventDateStr}
                  onChange={(e) => onEventDateChange(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  error={!!errors.eventDate}
                  helperText={errors.eventDate}
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* 可見範圍設定 */}
      <FormControl fullWidth>
        <InputLabel id="visibility-label">可見範圍</InputLabel>
        <Select
          labelId="visibility-label"
          value={visibility}
          label="可見範圍"
          onChange={(e) => onVisibilityChange(e.target.value)}
        >
          {visibilityOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 操作按鈕區 */}
      <Box display="flex" justifyContent="space-between" mt={2}>
        {/* 左側按鈕組 - 草稿相關操作 */}
        <Box>
          {/* 儲存草稿按鈕 */}
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={onSaveDraft}
            sx={{ mr: 1 }}
          >
            {currentDraftId ? "更新草稿" : "儲存為草稿"}
          </Button>

          {/* 當前正在編輯草稿時才顯示這些按鈕 */}
          {currentDraftId && (
            <>
              {/* 刪除草稿按鈕 */}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDeleteDraft}
                sx={{ mr: 1 }}
              >
                刪除草稿
              </Button>

              {/* 建立新文章按鈕 */}
              <Button variant="outlined" color="primary" onClick={onResetForm}>
                建立新文章
              </Button>
            </>
          )}
        </Box>

        {/* 右側按鈕組 - 預覽與發布 */}
        <Box>
          {/* 預覽按鈕 */}
          <Button variant="outlined" onClick={onPreview} sx={{ mr: 2 }}>
            預覽
          </Button>

          {/* 發布按鈕 */}
          <Button
            variant="contained"
            color="primary"
            onClick={onPublish}
            disabled={loading || isDraft}
          >
            {isDraft
              ? "儲存草稿" // 草稿模式下顯示儲存草稿
              : loading
              ? "發布中..." // 載入中狀態
              : currentDraftId
              ? "發布草稿" // 編輯草稿模式
              : "發布文章"}{" "}
            // 新文章模式
          </Button>
        </Box>
      </Box>
    </Stack>
  );
}
