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
import DeleteConfirmDialog from "../components/article/DeleteConfirmDialog";
import DraftManager from "../components/article/DraftManager";
import Navbar from "../components/Navbar";
import { auth } from "../firebase/config";
import * as postService from "../firebase/services/post-service";

const postLocations = ["企業版", "社團版"];
const postTypes = ["最新消息", "找贊助"];
const tagOptions = ["教學", "科技", "活動"];
const visibilityOptions = ["公開", "僅特定對象可見"];

export default function ArticlePage() {
  // 基本文章資料
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [postType, setPostType] = React.useState("");
  const [visibility, setVisibility] = React.useState(visibilityOptions[0]);

  // 草稿相關狀態
  const [isDraft, setIsDraft] = React.useState(false);
  const [currentDraftId, setCurrentDraftId] = React.useState<
    string | undefined
  >(undefined);
  const [drafts, setDrafts] = React.useState<any[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = React.useState(false);
  const [loadingDrafts, setLoadingDrafts] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [draftToDelete, setDraftToDelete] = React.useState<string | null>(null);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

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

  // 草稿相關功能
  const handleSaveDraft = async () => {
    try {
      // 檢查用戶是否已登入
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      // 準備要儲存的草稿資料
      const draftData = {
        title,
        content,
        location,
        postType,
        tags,
        authorId: currentUser.uid,
        visibility,
        isDraft: true,
        viewCount: 0,
        interactionCount: 0,
      };

      // 儲存草稿到資料庫
      const result = await postService.saveDraft(draftData, currentDraftId);

      if (result.success) {
        // 如果是新草稿，設置當前草稿ID
        if (result.id && !currentDraftId) {
          setCurrentDraftId(result.id);
        }

        // 更新保存時間顯示
        const now = new Date();
        setLastSaved(
          `上次保存時間：${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        );

        // 更新UI狀態
        setSnackbarMessage("草稿已保存");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setIsDraft(true);
      } else {
        throw new Error("儲存草稿失敗");
      }
    } catch (error) {
      console.error("儲存草稿時出錯:", error);
      setSnackbarMessage("儲存草稿失敗");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };
  // 發布草稿
  const handlePublishDraft = async () => {
    if (currentDraftId) {
      setLoading(true);
      try {
        // 檢查用戶是否登入並獲取Gmail
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setSnackbarMessage("請先登入");
          setSnackbarSeverity("error");
          setOpenSnackbar(true);
          setLoading(false);
          return;
        }
        const result = await postService.publishDraft(
          currentDraftId,
          currentUser.email || undefined
        );
        if (result.success) {
          setSnackbarMessage("草稿已成功發布");
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
          setIsDraft(false);
          setCurrentDraftId(undefined);
          setTimeout(() => {
            router.push("/");
          }, 1500);
        } else {
          throw new Error("發布草稿失敗");
        }
      } catch (error) {
        console.error("發布草稿時出錯:", error);
        setSnackbarMessage("發布草稿失敗");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // 載入用戶所有草稿
  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      // 檢查用戶是否登入
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入以查看草稿");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoadingDrafts(false);
        return;
      }

      // 從資料庫獲取使用者的草稿
      const userDrafts = await postService.getUserDrafts(currentUser.uid);
      setDrafts(userDrafts);
      setOpenDraftsDialog(true);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // 載入特定草稿
  const loadDraft = async (draftId: string) => {
    try {
      // 從資料庫獲取草稿
      const draft = await postService.getPostById(draftId);
      if (!draft) {
        throw new Error("找不到指定草稿");
      }

      // 填充表單基本資料
      setTitle(draft.title || "");
      setContent(draft.content || "");
      setPostType(draft.postType || "");
      setCurrentDraftId(draftId);

      // 設置其他字段
      if (draft.tags) setTags(draft.tags);
      if (draft.location) setLocation(draft.location);
      if (draft.visibility) setVisibility(draft.visibility);

      // 更新UI狀態
      setSnackbarMessage("草稿已載入");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDraftsDialog(false);
      setIsDraft(true);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 確認刪除草稿
  const confirmDeleteDraft = (draftId: string) => {
    setDraftToDelete(draftId);
    setOpenDeleteDialog(true);
  };

  // 刪除草稿
  const deleteDraft = async () => {
    if (!draftToDelete) return;

    try {
      // 從資料庫刪除草稿
      await postService.deletePost(draftToDelete);

      // 更新本地草稿列表
      setDrafts(drafts.filter((draft) => draft.id !== draftToDelete));

      // 如果刪除的是當前正在編輯的草稿，則重置表單
      if (currentDraftId === draftToDelete) {
        resetForm();
      }

      // 更新UI通知
      setSnackbarMessage("草稿已刪除");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDeleteDialog(false);
      setDraftToDelete(null);
    } catch (error) {
      console.error("刪除草稿時出錯:", error);
      setSnackbarMessage("無法刪除草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 重置表單
  const resetForm = () => {
    // 清除表單資料
    setTitle("");
    setContent("");
    setLocation("");
    setTags([]);
    setPostType("");
    setVisibility(visibilityOptions[0]);

    // 重設草稿相關狀態
    setCurrentDraftId(undefined);
    setIsDraft(false);
    setLastSaved(null);
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
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}
            >
              {/* 左側 - 草稿相關按鈕 */}
              <Box>
                <Button
                  variant="outlined"
                  onClick={handleSaveDraft}
                  sx={{ mr: 2 }}
                >
                  {currentDraftId ? "更新草稿" : "儲存為草稿"}
                </Button>

                <Button variant="outlined" onClick={loadDrafts} sx={{ mr: 2 }}>
                  查看草稿
                </Button>

                {currentDraftId && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => confirmDeleteDraft(currentDraftId)}
                      sx={{ mr: 2 }}
                    >
                      刪除草稿
                    </Button>

                    <Button variant="outlined" onClick={resetForm}>
                      建立新文章
                    </Button>
                  </>
                )}
              </Box>

              {/* 右側 - 發布按鈕 */}
              <Button
                variant="contained"
                color="primary"
                onClick={
                  isDraft && currentDraftId ? handlePublishDraft : handlePublish
                }
                disabled={loading}
              >
                {loading
                  ? "發布中..."
                  : isDraft && currentDraftId
                  ? "發布草稿"
                  : "發布文章"}
              </Button>
            </Box>

            {/* 顯示最後保存時間 */}
            {lastSaved && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block" }}
              >
                {lastSaved}
              </Typography>
            )}
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

      {/* 草稿管理對話框 */}
      <DraftManager
        open={openDraftsDialog}
        onClose={() => setOpenDraftsDialog(false)}
        drafts={drafts}
        loading={loadingDrafts}
        onLoadDraft={loadDraft}
        onDeleteDraft={confirmDeleteDraft}
      />

      {/* 刪除確認對話框 */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={deleteDraft}
      />
    </>
  );
}
