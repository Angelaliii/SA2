"use client";

import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EnterpriseDeleteDraftDialog from "../../components/article/EnterpriseDeleteDraftDialog";
import EnterpriseDraftManager from "../../components/article/EnterpriseDraftManager";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth } from "../../firebase/config";
import { companyServices } from "../../firebase/services";
import enterpriseService from "../../firebase/services/enterprise-service";

export default function EnterprisePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyEmail, setCompanyEmail] = useState<string>("");
  const [isDraft, setIsDraft] = useState<boolean>(false);

  // 草稿相關狀態
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);

      if (user) {
        try {
          const companies = await companyServices.getCompaniesByUserId(
            user.uid
          );
          if (companies && companies.length > 0) {
            setCompanyName(companies[0].companyName);
            setCompanyEmail(companies[0].email ?? user.email ?? "");
          }
        } catch (error) {
          console.error("Error fetching company info:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 載入用戶草稿
  const loadUserDrafts = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoadingDrafts(true);
    try {
      const userDrafts = await enterpriseService.getUserDrafts(currentUser.uid);
      setDrafts(userDrafts);
    } catch (error) {
      console.error("載入草稿失敗:", error);
      setSnackbarMessage("載入草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // 點擊查看草稿按鈕時載入草稿
  useEffect(() => {
    if (openDraftsDialog) {
      loadUserDrafts();
    }
  }, [openDraftsDialog]);

  // 載入選擇的草稿
  const handleLoadDraft = async (draftId: string) => {
    setLoadingDrafts(true);
    try {
      const draft = await enterpriseService.getPostById(draftId);
      if (draft) {
        setTitle(draft.title);
        setContent(draft.content);
        setCurrentDraftId(draftId);
        setOpenDraftsDialog(false);
      }
    } catch (error) {
      console.error("載入草稿失敗:", error);
      setSnackbarMessage("載入草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // 刪除草稿
  const handleDeleteDraft = async () => {
    if (!draftToDelete) return;

    try {
      await enterpriseService.deletePost(draftToDelete);
      setDrafts(drafts.filter((draft) => draft.id !== draftToDelete));
      setSnackbarMessage("草稿已刪除");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("刪除草稿失敗:", error);
      setSnackbarMessage("刪除草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setOpenDeleteDialog(false);
      setDraftToDelete(null);
    }
  };

  const handleSubmit = async () => {
    if (!title || !content) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("尚未登入");

      const postData = {
        title,
        content,
        authorId: currentUser.uid,
        companyName,
        email: companyEmail,
        createdAt: new Date().toISOString(),
        status: "active" as const,
        postType: "enterprise" as const,
        isDraft: isDraft,
      };

      if (currentDraftId) {
        // 如果是編輯現有草稿，則直接發布該草稿
        await enterpriseService.publishDraft(currentDraftId);
        setSnackbarMessage(isDraft ? "草稿已更新！" : "草稿已成功發布！");
      } else {
        // 創建新文章
        const result = await enterpriseService.createPost(postData);
        if (result.success) {
          setSnackbarMessage(isDraft ? "草稿儲存成功！" : "發布成功！");
        } else {
          throw new Error(isDraft ? "儲存草稿失敗" : "發布失敗");
        }
      }

      setSnackbarSeverity("success");
      setTitle("");
      setContent("");
      setCurrentDraftId(null);

      // 僅在非草稿時跳轉
      if (!isDraft) {
        router.push("/Enterprise/EnterpriseList");
      }
    } catch (error) {
      console.error("發布失敗:", error);
      setSnackbarMessage(
        error instanceof Error ? error.message : "發布失敗，請稍後再試"
      );
      setSnackbarSeverity("error");
    }
    setOpenSnackbar(true);
  };

  if (isLoggedIn === false) {
    return (
      <>
        <Navbar />
        <LoginPrompt />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          pt: "84px",
          pb: 8,
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              backgroundColor: "white",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            {" "}
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              align="center"
              color="primary"
              sx={{ mt: 2 }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box
                  component="img"
                  src="/image/things.png"
                  alt="enterprise post"
                  sx={{ width: 80, height: 80, mb: 1 }}
                />
                <Typography variant="h5" fontWeight="bold" color="black">
                  發布企業公告
                </Typography>
              </Box>
            </Typography>
            <Divider sx={{ mb: 4 }} />
            <Box sx={{ mb: 3, px: 1 }}>
              <Typography variant="body2" color="text.secondary">
                * 表示必填欄位
              </Typography>
            </Box>{" "}
            {/* 發布者資訊 */}
            <Box
              sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6">企業資訊</Typography>
              </Box>
              <TextField
                fullWidth
                label="公司名稱"
                value={companyName}
                disabled
                sx={{ mb: 2 }}
                variant="standard"
                // Use slotProps instead of InputProps
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
              <TextField
                fullWidth
                label="聯絡信箱"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                type="email"
                sx={{ mb: 2 }}
                variant="standard"
                helperText="此信箱將作為合作洽談的主要聯絡方式"
              />
            </Box>{" "}
            {/* 公告內容區塊 */}
            <Box
              sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <DescriptionIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6">公告內容</Typography>
              </Box>
              <TextField
                fullWidth
                label="標題"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3 }}
                required
                variant="standard"
                placeholder="請輸入能吸引目標合作對象的標題"
              />

              <TextField
                fullWidth
                label="內容"
                multiline
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                variant="outlined"
                placeholder="詳細描述合作內容、期望與條件"
              />
            </Box>{" "}
            {/* 按鈕區塊 */}{" "}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setOpenDraftsDialog(true)}
                size="large"
              >
                查看草稿
              </Button>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/Enterprise/EnterpriseList"
                  size="large"
                  sx={{ display: "none" }}
                >
                  返回列表
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsDraft(true);
                    handleSubmit();
                  }}
                  size="large"
                  color="secondary"
                >
                  儲存草稿
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setIsDraft(false);
                    handleSubmit();
                  }}
                  size="large"
                  color="primary"
                >
                  發布公告
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>{" "}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
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
      <EnterpriseDraftManager
        open={openDraftsDialog}
        onClose={() => setOpenDraftsDialog(false)}
        drafts={drafts}
        loading={loadingDrafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={(draftId) => {
          setDraftToDelete(draftId);
          setOpenDeleteDialog(true);
        }}
      />
      {/* 刪除草稿確認對話框 */}
      <EnterpriseDeleteDraftDialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setDraftToDelete(null);
        }}
        onConfirm={handleDeleteDraft}
      />
    </>
  );
}
