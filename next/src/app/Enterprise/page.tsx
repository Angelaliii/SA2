"use client";

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
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth, db } from "../../firebase/config";
import { companyServices } from "../../firebase/services";

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
        postType: "enterprise",
      };

      await addDoc(collection(db, "enterprisePosts"), {
        ...postData,
        timestamp: serverTimestamp(),
      });
      setSnackbarMessage("發布成功！");
      setSnackbarSeverity("success");
      setTitle("");
      setContent("");

      // Use router.push instead of window.location for client-side navigation
      router.push("/Enterprise/EnterpriseList");
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
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              align="center"
              color="primary"
            >
              發布企業公告
            </Typography>
            <Typography
              variant="subtitle1"
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              分享您的企業合作機會，尋找最佳合作夥伴
            </Typography>
            <Divider sx={{ mb: 4 }} />
            {/* 發布者資訊 - 移除特殊區塊包裝 */}{" "}
            <TextField
              fullWidth
              label="公司名稱"
              value={companyName}
              disabled
              sx={{ mb: 2 }}
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
              sx={{ mb: 4 }}
              helperText="此信箱將作為合作洽談的主要聯絡方式"
            />
            {/* 公告內容區塊 */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <DescriptionIcon color="primary" />
                公告內容
              </Typography>
              <TextField
                fullWidth
                label="標題 *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3 }}
                required
                placeholder="請輸入能吸引目標合作對象的標題"
              />

              <TextField
                fullWidth
                label="內容 *"
                multiline
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="詳細描述合作內容、期望與條件"
              />
            </Box>
            {/* 按鈕區塊 */}
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmit}
                size="large"
                sx={{ minWidth: 200 }}
              >
                發布公告
              </Button>
              <Button
                variant="outlined"
                component={Link}
                href="/Enterprise/EnterpriseList"
                size="large"
                sx={{ minWidth: 200 }}
              >
                返回列表
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>

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
    </>
  );
}
