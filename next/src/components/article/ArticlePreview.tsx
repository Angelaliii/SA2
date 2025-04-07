// 文章預覽組件
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { ArticlePreviewProps } from "../../types/article";

/**
 * 文章預覽組件
 * 顯示文章的預覽視圖，並提供發布和返回編輯的操作
 */
export default function ArticlePreview({
  data,
  loading,
  onBack,
  onPublish,
}: ArticlePreviewProps) {
  const {
    title,
    content,
    location,
    tags,
    postType,
    visibility,
    cooperationType,
    cooperationDeadline,
    budgetMin,
    budgetMax,
    eventDate,
  } = data;

  return (
    <Box>
      {/* 文章標題 */}
      <Typography variant="h4" gutterBottom>
        {title || "無標題"}
      </Typography>

      {/* 標籤顯示 */}
      <Box display="flex" gap={1} mb={1}>
        {tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" />
        ))}
      </Box>

      {/* 基本資訊列 */}
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        發布位置: {location || "未指定"} | 文章類型: {postType || "未指定"} |
        可見性: {visibility}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* 文章內容 */}
      <Box sx={{ mt: 2, whiteSpace: "pre-wrap" }}>{content}</Box>

      {/* 合作詳情區塊 - 僅在合作類型文章顯示 */}
      {(postType === "企業合作需求" || postType === "社團活動合作") && (
        <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            合作詳情
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>合作類型：</strong> {cooperationType || "未指定"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2">
                <strong>合作期限：</strong>{" "}
                {cooperationDeadline
                  ? cooperationDeadline.toLocaleDateString()
                  : "未指定"}
              </Typography>
            </Grid>
            {postType === "企業合作需求" && (
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>預算範圍：</strong> {budgetMin || "0"} -{" "}
                  {budgetMax || "不限"} 元
                </Typography>
              </Grid>
            )}
            {postType === "社團活動合作" && (
              <Grid item xs={6}>
                <Typography variant="body2">
                  <strong>活動日期：</strong>{" "}
                  {eventDate ? eventDate.toLocaleDateString() : "未指定"}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* 預覽模式下的操作按鈕 */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Button
          variant="contained"
          color="primary"
          onClick={onBack}
          sx={{ mr: 2 }}
        >
          返回編輯
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={onPublish}
          disabled={loading}
        >
          {loading ? "發布中..." : "確認發布"}
        </Button>
      </Box>
    </Box>
  );
}
