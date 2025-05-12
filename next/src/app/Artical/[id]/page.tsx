"use client";

import EventIcon from "@mui/icons-material/Event";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HandshakeIcon from "@mui/icons-material/Handshake";
import InfoIcon from "@mui/icons-material/Info";
import InventoryIcon from "@mui/icons-material/Inventory";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Link as MuiLink,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";
import { clubServices } from "../../../firebase/services/club-service";
import { collaborationService } from "../../../firebase/services/collaboration-service";
import * as postService from "../../../firebase/services/post-service";

export default function DemandPostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>({
    title: "載入中...",
    organizationName: "未知社團",
    createdAt: "",
    email: "未提供",
  });
  const [clubInfo, setClubInfo] = useState<any>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // 收藏相關狀態
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    const fetchPost = async () => {
      try {
        const data = await postService.getPostById(id as string);
        setPost((prev: any) => ({ ...prev, ...data }));

        if (data?.authorId) {
          const club = await clubServices.getClubById(data.authorId);
          setClubInfo(club);

          if (club?.email) {
            setPost((prev: any) => ({ ...prev, authorEmail: club.email }));
          }
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost();

    // 檢查用戶是否已收藏該需求文章
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

    return () => unsubscribe();
  }, [id]);

  if (!post) return null;

  // 使用一種固定格式，避免水合錯誤
  const formatDate = (dateString: string | Date) => {
    try {
      const date =
        dateString instanceof Date ? dateString : new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return "無效日期";
    }
  };

  const formattedDate = formatDate(post.createdAt);

  const handleSendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // 1. 發送訊息
      const messageContent = `我這個組織有意願和你關於「${post.title}」的文章合作。`;
      await addDoc(collection(db, "messages"), {
        senderId: currentUser.uid,
        receiverId: post.authorId,
        messageContent: messageContent,
        postId: id,
        timestamp: new Date(),
        postTitle: post.title,
      });

      // 2. 創建合作請求
      console.log("Creating collaboration request with:", {
        postId: id,
        postTitle: post.title,
        requesterId: currentUser.uid,
        receiverId: post.authorId,
      });

      const collaborationResult =
        await collaborationService.createCollaborationRequest({
          postId: id as string,
          postTitle: post.title,
          requesterId: currentUser.uid,
          receiverId: post.authorId,
          message: messageContent,
        });

      console.log("Collaboration request result:", collaborationResult);

      if (collaborationResult.success) {
        setSnackbarMessage("已成功發送合作訊息！合作請求已提交給對方審核。");
      } else {
        setSnackbarMessage(
          `已發送訊息，但${collaborationResult.error ?? "無法提交合作請求"}`
        );
      }

      setMessageSent(true);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("發送訊息失敗:", error);
      setSnackbarMessage("發送訊息失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 處理收藏功能
  const handleToggleFavorite = async () => {
    if (!auth.currentUser) {
      setSnackbarMessage("請先登入後再進行收藏");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
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
          postType: "demand",
          title: post.title,
          organizationName: post.organizationName,
          content: post.content ?? post.demandDescription ?? "",
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setIsFavorite(true);
        setSnackbarMessage("已成功加入收藏！");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }
      // 已收藏，取消收藏
      else {
        const docToDelete = snapshot.docs[0];
        await deleteDoc(doc(db, "favorites", docToDelete.id));
        setIsFavorite(false);
        setSnackbarMessage("已取消收藏");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }
    } catch (error) {
      console.error("收藏操作失敗:", error);
      setSnackbarMessage("操作失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setFavoriteLoading(false);
    }
  };

  // 導航到社團的合作列表頁面
  const handleNavigateToCollaborationList = () => {
    router.push(`/Profile?searchTerm=4`); // 導航到合作記錄標籤
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, minHeight: "80vh" }}>
          {/* 標題 + 社團資訊 */}
          <Box sx={{ textAlign: "center", mb: 4, position: "relative" }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {post.title}
            </Typography>

            {/* 收藏按鈕 */}
            <IconButton
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                fontSize: "1.8rem",
              }}
            >
              {favoriteLoading ? (
                <CircularProgress size={20} />
              ) : isFavorite ? (
                "❤️"
              ) : (
                "🤍"
              )}
            </IconButton>

            {/* 社團名稱 */}
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {" "}
              發布社團：
              {clubInfo ? (
                <Box sx={{ display: "inline-block", mb: 2 }}>
                  <NextLink href={`/public-profile/${post.authorId}`} passHref>
                    <MuiLink
                      sx={{
                        color: "#1976d2",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {clubInfo.clubName}｜{clubInfo.schoolName}
                    </MuiLink>
                  </NextLink>
                </Box>
              ) : (
                post.organizationName ?? "未知社團"
              )}
            </Typography>

            {/* 發文時間 */}
            <Typography variant="body2" color="text.secondary">
              發文時間：{formattedDate}
            </Typography>

            {/* 聯絡信箱 */}
            <Typography variant="body2" color="text.secondary">
              聯絡信箱：
              {post.email ?? "未提供"}
            </Typography>
          </Box>
          {/* 收藏按鈕區塊 */}{" "}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <Button
              variant={isFavorite ? "contained" : "outlined"}
              color={isFavorite ? "error" : "primary"}
              startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              size="small"
            >
              {isFavorite ? "已收藏" : "加入收藏"}
            </Button>
          </Box>
          {/* 需求物資 */}
          <Box
            sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InventoryIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">需求物資</Typography>
            </Box>
            <Typography variant="body2" gutterBottom>
              <strong>需求項目：</strong>
            </Typography>{" "}
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {post.selectedDemands?.length > 0 ? (
                post.selectedDemands.map((item: string) => (
                  <Chip key={`demand-${item}`} label={item} color="primary" />
                ))
              ) : (
                <Typography variant="body2">未填寫</Typography>
              )}
            </Box>
            <Typography variant="body2" gutterBottom>
              <strong>需求說明：</strong> {post.demandDescription ?? "未填寫"}
            </Typography>
          </Box>
          {/* 活動資訊 */}
          <Box
            sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">活動資訊</Typography>
            </Box>
            <Typography variant="body2" gutterBottom>
              <strong>活動名稱：</strong>
              {post.eventName ?? "未填寫"}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>活動性質：</strong>
              {post.eventType ?? "未填寫"}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>預估人數：</strong>
              {post.estimatedParticipants ?? "未填寫"}
            </Typography>
            <Typography variant="body2" gutterBottom>
              <strong>活動日期：</strong>
              {post.eventDate ?? "未填寫"}
            </Typography>
          </Box>
          {/* 回饋與補充說明 */}
          <Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InfoIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">補充說明與回饋</Typography>
            </Box>
            <Typography variant="body2" gutterBottom>
              <strong>回饋方案：</strong> {post.cooperationReturn ?? "未填寫"}
            </Typography>
            <Typography variant="body2" gutterBottom sx={{ mt: 1 }}>
              <strong>補充說明：</strong> {post.eventDescription ?? "未填寫"}
            </Typography>
          </Box>
          {/* 發送訊息按鈕 */}
          {isLoggedIn && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 4,
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={messageSent}
                sx={{ width: 200 }}
              >
                {messageSent ? "已發送訊息" : "發送合作訊息"}
              </Button>

              {messageSent && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleNavigateToCollaborationList}
                  startIcon={<HandshakeIcon />}
                >
                  前往我的合作記錄確認
                </Button>
              )}
            </Box>
          )}
          {!isLoggedIn && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                請先登入才能發送合作訊息
              </Typography>
            </Box>
          )}
          {/* 收藏按鈕 */}
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <IconButton
              onClick={handleToggleFavorite}
              disabled={favoriteLoading}
              color="primary"
            >
              {favoriteLoading ? (
                <CircularProgress size={24} />
              ) : isFavorite ? (
                <FavoriteIcon />
              ) : (
                <FavoriteBorderIcon />
              )}
            </IconButton>
          </Box>
        </Paper>
      </Container>

      {/* Snackbar */}
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
