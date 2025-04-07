"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import * as React from "react";
import Navbar from "../components/Navbar";
import { auth } from "../firebase/config";
import * as postService from "../firebase/services/post-service";

const postLocations = ["企業版", "社團版"];
const postTypes = ["最新消息", "找贊助"];
const tagOptions = ["教學", "科技", "活動"];

export default function ArticlePage() {
  // 基本文章資料
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [postType, setPostType] = React.useState("");

  // UI狀態
  const [loading, setLoading] = React.useState(false);
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<
    "success" | "error"
  >("success");

  const router = useRouter();

  const handlePublish = async () => {
    // 表單驗證
    if (!location || !title || !content || !postType) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);

    try {
      // 檢查用戶是否已登入
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      // 準備文章資料
      const postData = {
        title,
        content,
        location,
        tags,
        postType,
        authorId: currentUser.uid,
        isDraft: false,
        viewCount: 0,
        interactionCount: 0,
        createdAt: new Date().toISOString(),
      };

      // 發布文章
      const result = await postService.createPost(postData);

      if (result.success) {
        setSnackbarMessage("文章發布成功");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        // 重設表單
        setTitle("");
        setContent("");
        setLocation("");
        setTags([]);
        setPostType("");
        // 導航到平台首頁
        setTimeout(() => {
          router.push("/PlatformLanding");
        }, 1500);
      } else {
        throw new Error("發布失敗");
      }
    } catch (error) {
      console.error("發布文章時出錯:", error);
      setSnackbarMessage("發布失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      {/* 發文區塊容器 */}
      <Box sx={{ pt: 10, pb: 8 }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            {/* 標題 */}
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              發布文章
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* 發文位置 */}
            <Typography variant="subtitle2" gutterBottom>
              發文位置
            </Typography>
            <Select
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                請選擇發文位置
              </MenuItem>
              {postLocations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>

            {/* 文章類型 */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
              文章類型
            </Typography>
            <Select
              fullWidth
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>
                請選擇文章類型
              </MenuItem>
              {postTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>

            {/* 標籤 */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
              標籤
            </Typography>
            <Autocomplete
              multiple
              options={tagOptions}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="請選擇標籤"
                  placeholder="選擇標籤"
                />
              )}
            />

            {/* 標題欄位 */}
            <TextField
              fullWidth
              label="標題"
              variant="standard"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              inputProps={{ maxLength: 80 }}
              sx={{ mt: 4 }}
            />

            {/* 內容輸入 */}
            <TextField
              fullWidth
              label="文章內容"
              placeholder="請輸入文章內容（可換行）"
              multiline
              rows={12}
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              sx={{
                mt: 3,
                "& .MuiInputBase-input": {
                  whiteSpace: "pre-line",
                },
              }}
            />

            {/* 發文按鈕 */}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handlePublish}
              disabled={loading}
              sx={{ mt: 3 }}
            >
              {loading ? "發布中..." : "發文"}
            </Button>
          </Paper>
        </Container>
      </Box>

      {/* Snackbar 提示訊息 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
