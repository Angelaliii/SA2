// 文章發布頁面 - 主容器
"use client";

import {
  Alert,
  Box,
  Container,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect } from "react";

// 引入圖標
import ListAltIcon from "@mui/icons-material/ListAlt";
import PreviewIcon from "@mui/icons-material/Preview";

// 引入自定義組件
import ArticleEditForm from "../components/article/ArticleEditForm";
import ArticlePreview from "../components/article/ArticlePreview";
import DeleteConfirmDialog from "../components/article/DeleteConfirmDialog";
import DraftManager from "../components/article/DraftManager";

// 引入自定義Hook和Firebase服務
import { auth } from "../firebase/config";
import useArticleForm from "../hooks/useArticleForm";

/**
 * 文章發布頁面
 * 整合所有文章編輯、預覽、草稿管理等功能
 */
export default function ArticlePage() {
  const router = useRouter();

  // 使用自定義Hook獲取所有表單狀態和操作函數
  const articleForm = useArticleForm();

  // 從自定義Hook中解構需要的狀態和函數
  const {
    formData,
    errors,
    isDraft,
    loading,
    lastSaved,
    currentDraftId,
    previewMode,
    openSnackbar,
    snackbarMessage,
    snackbarSeverity,
    drafts,
    openDraftsDialog,
    loadingDrafts,
    draftToDelete,
    openDeleteDialog,

    // UI控制函數
    setOpenSnackbar,
    setPreviewMode,

    // 操作函數
    togglePreview,
    resetForm,
    loadDrafts,
    loadDraft,
    confirmDeleteDraft,
    deleteDraft,
    handleSaveDraft,
    handlePublish,

    // 表單輸入處理函數
    setTitle,
    setContent,
    setLocation,
    setTags,
    setPostType,
    setVisibility,
    setCooperationType,
    setCooperationDeadlineStr,
    setBudgetMin,
    setBudgetMax,
    setEventDateStr,
  } = articleForm;

  // ========== 登入檢查 ==========
  useEffect(() => {
    // 檢查用戶是否已登入
    const checkAuthStatus = () => {
      const user = auth.currentUser;
      if (!user) {
        // 用戶未登入，顯示訊息並重定向
        articleForm.setSnackbarMessage("請先登入以發布文章");
        articleForm.setSnackbarSeverity("error");
        articleForm.setOpenSnackbar(true);

        // 短暫延遲後重定向，以便用戶看到提示訊息
        setTimeout(() => {
          router.push("/LoginPage");
        }, 1500);
      }
    };

    // 立即檢查
    checkAuthStatus();

    // 設置監聽器以持續監控登入狀態
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        // 用戶登出，立即重定向到登入頁面
        router.push("/LoginPage");
      }
    });

    // 組件卸載時清理監聽器
    return () => unsubscribe();
  }, [router]);

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* 頁面標題與工具列 */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            {/* 標題：根據當前模式顯示不同文字 */}
            <Typography variant="h5">
              {previewMode
                ? "預覽文章"
                : currentDraftId
                ? "編輯草稿"
                : "發布文章"}
            </Typography>

            {/* 右側工具按鈕區 */}
            <Box>
              {/* 顯示上次保存時間 */}
              {!previewMode && lastSaved && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 2 }}
                >
                  {lastSaved}
                </Typography>
              )}

              {/* 草稿列表按鈕 */}
              <Tooltip title="查看已儲存草稿">
                <IconButton onClick={loadDrafts} disabled={loadingDrafts}>
                  <ListAltIcon />
                </IconButton>
              </Tooltip>

              {/* 預覽/返回編輯按鈕 */}
              <Tooltip title={previewMode ? "返回編輯" : "預覽文章"}>
                <IconButton onClick={togglePreview}>
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* 根據模式顯示不同組件 */}
          {previewMode ? (
            <ArticlePreview
              data={formData}
              loading={loading}
              onBack={togglePreview}
              onPublish={handlePublish}
            />
          ) : (
            <ArticleEditForm
              data={formData}
              errors={errors}
              isDraft={isDraft}
              loading={loading}
              currentDraftId={currentDraftId}
              lastSaved={lastSaved}
              onTitleChange={setTitle}
              onContentChange={setContent}
              onLocationChange={setLocation}
              onPostTypeChange={setPostType}
              onTagsChange={setTags}
              onVisibilityChange={setVisibility}
              onCooperationTypeChange={setCooperationType}
              onCooperationDeadlineChange={setCooperationDeadlineStr}
              onBudgetMinChange={setBudgetMin}
              onBudgetMaxChange={setBudgetMax}
              onEventDateChange={setEventDateStr}
              onSaveDraft={handleSaveDraft}
              onPublish={handlePublish}
              onDeleteDraft={() => confirmDeleteDraft(currentDraftId || "")}
              onResetForm={resetForm}
              onPreview={togglePreview}
            />
          )}
        </Paper>
      </Container>

      {/* 草稿管理對話框 */}
      <DraftManager
        open={openDraftsDialog}
        onClose={() => articleForm.setOpenDraftsDialog(false)}
        drafts={drafts}
        loading={loadingDrafts}
        onLoadDraft={loadDraft}
        onDeleteDraft={confirmDeleteDraft}
      />

      {/* 刪除確認對話框 */}
      <DeleteConfirmDialog
        open={openDeleteDialog}
        onClose={() => articleForm.setOpenDeleteDialog(false)}
        onConfirm={() => (draftToDelete ? deleteDraft(draftToDelete) : null)}
      />

      {/* 通知消息 Snackbar */}
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
