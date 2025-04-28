"use client";

import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import Link from "@mui/material/Link";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";

interface EnterprisePost {
  id: string;
  title: string;
  companyName?: string;
  email?: string;
  content?: string;
  createdAt?: string | Date;
  status?: string;
}

export default function EnterpriseDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<EnterprisePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();

  // 檢查用戶是否已收藏該文章
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!auth.currentUser || !id) return;

      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", auth.currentUser.uid),
          where("articleId", "==", id)
        );

        const snapshot = await getDocs(q);
        setIsFavorite(!snapshot.empty);
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    checkFavoriteStatus();
  }, [id]);

  // 獲取文章詳情
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "enterprisePosts", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({
            id: docSnap.id,
            title: data.title || "無標題",
            companyName: data.companyName || "未知企業",
            email: data.email || "",
            content: data.content || "",
            createdAt: data.createdAt,
            status: data.status,
          });
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // 處理收藏功能
  const handleToggleFavorite = async () => {
    if (!auth.currentUser) {
      setSnackbarMessage("請先登入後再進行收藏");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (!id || !post) return;

    setFavoriteLoading(true);

    try {
      const userId = auth.currentUser.uid;

      // 檢查是否已收藏
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("articleId", "==", id)
      );

      const snapshot = await getDocs(q);

      // 目前未收藏，進行收藏
      if (snapshot.empty) {
        const favoriteData = {
          userId,
          articleId: id,
          postType: "enterprise",
          title: post.title,
          companyName: post.companyName,
          content: post.content,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setIsFavorite(true);
        setSnackbarMessage("已成功加入收藏！");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
      // 已收藏，取消收藏
      else {
        const docToDelete = snapshot.docs[0];
        await deleteDoc(doc(db, "favorites", docToDelete.id));
        setIsFavorite(false);
        setSnackbarMessage("已取消收藏");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("收藏操作失敗:", error);
      setSnackbarMessage("操作失敗，請稍後再試");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatDate = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return "無日期";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <Container>
          <Typography>找不到文章</Typography>
        </Container>
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
            {/* 標題與企業資訊 */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography
                variant="h4"
                gutterBottom
                fontWeight="bold"
                color="primary"
              >
                {post.title}
              </Typography>

              {/* 企業資訊與聯絡方式 */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BusinessIcon color="primary" />
                  <Typography variant="subtitle1">
                    {post.companyName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon color="primary" />
                  <Typography variant="subtitle1">
                    {post.email ? (
                      <Link
                        href={`mailto:${post.email}`}
                        underline="hover"
                        sx={{
                          color: "primary.main",
                          "&:hover": {
                            color: "primary.dark",
                          },
                        }}
                      >
                        {post.email}
                      </Link>
                    ) : (
                      "無提供信箱"
                    )}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                發布時間：{formatDate(post.createdAt)}
              </Typography>
            </Box>

            {/* 內容區 */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                p: 3,
                borderRadius: 2,
                mb: 4,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <DescriptionIcon />
                合作內容
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-line",
                  minHeight: "100px",
                  bgcolor: "background.paper",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                {post.content || "尚無合作內容說明"}
              </Typography>
            </Box>

            {/* 聯絡按鈕 */}
            <Box sx={{ textAlign: "center", mt: 4 }}>
              {post.email ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmailIcon />}
                  href={`mailto:${post.email}`}
                  sx={{
                    minWidth: 200,
                    mb: 2,
                  }}
                >
                  聯絡企業
                </Button>
              ) : (
                <Typography color="text.secondary">
                  此企業尚未提供聯絡方式
                </Typography>
              )}{" "}
              <Box sx={{ mt: 2 }}>{/* Removed favorite button */}</Box>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
