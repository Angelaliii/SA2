"use client";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HandshakeIcon from "@mui/icons-material/Handshake";
import {
  Alert,
  Box,
  Button,
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
  const [isFavorite, setIsFavorite] = useState(false);

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

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
        
        // Check favorite status
        if (auth.currentUser) {
          const q = query(
            collection(db, "favorites"),
            where("userId", "==", auth.currentUser.uid),
            where("articleId", "==", id)
          );
          const snapshot = await getDocs(q);
          setIsFavorite(!snapshot.empty);
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost();
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
      return `${year}-${month}-${day}`;
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
      // ✅ 不再手動寫入 messages
      const messageContent = `有意願和你合作。`;

      // ✅ 僅執行 createCollaborationRequest（內部會發送訊息）
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

  // 導航到社團的合作列表頁面
  const handleNavigateToCollaborationList = () => {
    router.push(`/Profile?searchTerm=4`); // 導航到合作記錄標籤
  };
  
  // 收藏文章處理
  const handleToggleFavorite = async () => {
    if (!auth.currentUser) return;
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", auth.currentUser.uid),
          where("articleId", "==", id)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          await deleteDoc(doc(db, "favorites", snapshot.docs[0].id));
        }
      } else {
        // Add to favorites
        await setDoc(doc(collection(db, "favorites")), {
          userId: auth.currentUser.uid,
          articleId: id,
          createdAt: new Date().toISOString(),
          postType: "demand",
          title: post.title,
          content: post.content,
          organizationName: post.organizationName || clubInfo?.clubName
        });
      }
      
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error("操作收藏失敗", error);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* 標題與社團資訊 */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight="bold">
                {post.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                由 {" "}
                <MuiLink 
                  href={`/public-profile/${post.authorId}`}
                  sx={{ 
                    color: "primary.main", 
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" } 
                  }}
                >
                  {clubInfo?.clubName ?? post.organizationName ?? "未知社團"}
                </MuiLink>
                {" "}｜{" "}
                {clubInfo?.schoolName ?? "未知學校"}
                {" "}發布
              </Typography>
            </Box>
            <IconButton 
              onClick={handleToggleFavorite}
              color={isFavorite ? "error" : "default"}
              title={isFavorite ? "取消收藏" : "收藏文章"}
            >
              {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>

          {/* 聯絡資訊 - 企業格式 */}
          <Box sx={{ bgcolor: "#f8f9fa", p: 3, borderRadius: 2, mb: 3, border: "1px solid #e0e0e0" }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2, borderBottom: "1px solid #e0e0e0", pb: 1 }}>
              聯繫窗口資訊
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  聯繫人
                </Typography>
                <Typography variant="body1">
                  {post.contactName || "未提供"}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  聯絡電話
                </Typography>
                <Typography variant="body1">
                  {post.contactPhone || "未提供"}
                </Typography>
              </Box>
              
              {post.email && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    電子郵件
                  </Typography>
                  <MuiLink href={`mailto:${post.email}`}>
                    {post.email}
                  </MuiLink>
                </Box>
              )}
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  發布時間
                </Typography>
                <Typography variant="body1">
                  {formattedDate}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 活動與組織資訊 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2, pb: 1, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
              活動與組織資訊
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
              <Typography variant="body2">
                <strong>活動標題：</strong>{post.eventName || "未提供"}
              </Typography>
              <Typography variant="body2">
                <strong>活動期間：</strong>{post.eventStart ? formatDate(post.eventStart) : "未提供"} {post.eventEnd ? `- ${formatDate(post.eventEnd)}` : ""}
              </Typography>
              <Typography variant="body2">
                <strong>活動地點：</strong>{post.location || "未提供"}
              </Typography>
              <Typography variant="body2">
                <strong>活動類型：</strong>{post.eventNature || "未提供"}
              </Typography>
              <Typography variant="body2">
                <strong>預估人數：</strong>{post.estimatedParticipants || "未提供"}
              </Typography>
              <Typography variant="body2">
                <strong>贊助截止時間：</strong>{post.sponsorDeadline ? formatDate(post.sponsorDeadline) : "未提供"}
              </Typography>
            </Box>
          </Box>

          {/* 贊助需求 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2, pb: 1, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
              贊助需求
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1.5 }}>
              <strong>需求類型：</strong>{post.demandType || "未提供"}
            </Typography>
            
            {post.demandType === "物資" && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>物資類型：</strong>{post.itemType || (post.customItems?.join("、") || "未提供")}
                </Typography>
                <Typography variant="body2">
                  <strong>物資明細：</strong>{post.demandDescription || "未提供"}
                </Typography>
              </Box>
            )}

            {post.demandType === "金錢" && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>預估金額區間：</strong>{post.moneyLowerLimit || "?"} 元 - {post.moneyUpperLimit || "?"} 元
                </Typography>
                <Typography variant="body2">
                  <strong>明細說明：</strong>{post.demandDescription || "未提供"}
                </Typography>
              </Box>
            )}

            {post.demandType === "講師" && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>講師類型：</strong>{post.speakerType || "未提供"}
                </Typography>
                <Typography variant="body2">
                  <strong>需求描述：</strong>{post.demandDescription || "未提供"}
                </Typography>
              </Box>
            )}
          </Box>

          {/* 回饋與補充 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2, pb: 1, borderBottom: "1px solid rgba(0,0,0,0.1)" }}>
              回饋與補充
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>回饋方式：</strong>{post.feedbackDetails || "未提供"}
            </Typography>
            <Typography variant="body2">
              <strong>補充說明：</strong>{post.notes || "未提供"}
            </Typography>
          </Box>

          {/* 合作按鈕 */}
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
                startIcon={<HandshakeIcon />}
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
