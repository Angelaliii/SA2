"use client";

import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Link,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";
import enterpriseService from "../../../firebase/services/enterprise-service";

interface EnterprisePost {
  id: string;
  title: string;
  companyName?: string;
  email?: string;
  content?: string;
  createdAt?: string | Date;
  status?: string;
  authorId?: string;
}

export default function EnterpriseDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
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

  // 獲取文章詳情 - 使用 enterpriseService 來獲取資料
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const postData = await enterpriseService.getPostById(id);
        if (postData) {
          setPost({
            id: postData.id || id,
            title: postData.title || "無標題",
            companyName: postData.companyName || "未知企業",
            email: postData.email || "",
            content: postData.content || "",
            createdAt: postData.createdAt || new Date(),
            status: postData.status || "active",
            authorId: postData.authorId,
          });
        } else {
          console.error("Post not found");
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
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "日期格式錯誤";
    }
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
          <Box sx={{ pt: "84px", textAlign: "center", py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              找不到文章
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/Enterprise/EnterpriseList"
              sx={{ mt: 2 }}
            >
              返回列表
            </Button>
          </Box>
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
                {post.email && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmailIcon color="primary" />
                    <Typography variant="subtitle1">
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
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                發布時間：{formatDate(post.createdAt)}
              </Typography>
            </Box>

            {/* 收藏按鈕 */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant={isFavorite ? "contained" : "outlined"}
                color={isFavorite ? "error" : "primary"}
                startIcon={
                  isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />
                }
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                size="small"
              >
                {isFavorite ? "已收藏" : "加入收藏"}
              </Button>
            </Box>

            <Divider sx={{ mb: 3 }} />

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

            {/* 聯絡按鈕和返回列表按鈕 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                href="/Enterprise/EnterpriseList"
              >
                返回列表
              </Button>

              {post.email ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmailIcon />}
                  href={`mailto:${post.email}`}
                >
                  聯絡企業
                </Button>
              ) : (
                <Typography color="text.secondary">
                  此企業尚未提供聯絡方式
                </Typography>
              )}
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
