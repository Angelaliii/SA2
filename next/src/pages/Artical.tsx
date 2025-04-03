"use client";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import * as React from "react";
import { auth } from "../firebase/config";
import { postService } from "../firebase/services";

const postLocations = ["最新消息", "找贊助"];
const tagOptions = ["教學", "科技", "活動"];

export default function PublishPage() {
  const [location, setLocation] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<
    "success" | "error"
  >("success");
  const router = useRouter();

  const handlePublish = async () => {
    // 表單驗證
    if (!location || !title || !content) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      const result = await postService.createPost({
        title,
        content,
        location,
        tags,
        authorId: currentUser.uid,
      });

      if (result.success) {
        setSnackbarMessage("文章發布成功");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        // 重設表單
        setTitle("");
        setContent("");
        setLocation("");
        setTags([]);
        // 可選：導航到文章列表頁面
        setTimeout(() => {
          router.push("/");
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
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Typography variant="h5" align="center" gutterBottom>
            發布文章
          </Typography>
          <Typography variant="body2" align="center" gutterBottom></Typography>

          <Stack spacing={2} mt={2}>
            <Select
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled hidden>
                請選擇發文位置
              </MenuItem>
              {postLocations.map((loc) => (
                <MenuItem key={loc} value={loc}>
                  {loc}
                </MenuItem>
              ))}
            </Select>

            <TextField
              fullWidth
              label="標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <TextField
              fullWidth
              label="文章內容"
              multiline
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="請輸入文章內容"
            />

            <Autocomplete
              multiple
              options={tagOptions}
              value={tags}
              onChange={(_, newValue) => setTags(newValue)}
              renderInput={(params) => <TextField {...params} label="標籤" />}
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handlePublish}
              disabled={loading}
            >
              {loading ? "發布中..." : "發文"}
            </Button>
          </Stack>
        </Paper>
      </Container>

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
    </Box>
  );
}



