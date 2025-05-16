"use client";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import HandshakeIcon from "@mui/icons-material/Handshake";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Link as MuiLink,
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
  // 更新頁面標題
  useEffect(() => {
    if (post && post.title && post.title !== "載入中...") {
      document.title = `${post.title} - 需求牆`;
    } else {
      document.title = "需求牆 - 社團企業媒合平台";
    }
  }, [post]);

  // 維持社團用戶的身份狀態，確保從詳情頁返回列表頁時不會丟失狀態
  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const clubData = await clubServices.getClubByUserId(user.uid);
          if (clubData && typeof window !== "undefined") {
            sessionStorage.setItem("isClubUser", "true");
          }
        } catch (error) {
          console.error("檢查社團用戶時出錯:", error);
        }
      }
    };

    checkUserRole();
  }, []);

  // 收藏相關狀態
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
    if (!auth.currentUser) {
      setSnackbarMessage("請先登入後再進行收藏");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

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
        setSnackbarMessage("已取消收藏");
      } else {
        // Add to favorites
        await setDoc(doc(collection(db, "favorites")), {
          userId: auth.currentUser.uid,
          articleId: id,
          createdAt: new Date().toISOString(),
          postType: "demand",
          title: post.title,
          content: post.content,
          organizationName: post.organizationName || clubInfo?.clubName,
        });
        setSnackbarMessage("已加入收藏");
      }

      setIsFavorite(!isFavorite);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("操作收藏失敗", error);
      setSnackbarMessage("操作失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  return (
    <div>
      <Navbar />
      <Box
        sx={{
          pt: 10,
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
            {/* 標題與社團資訊 */}
            <Box sx={{ textAlign: "center", mb: 4, position: "relative" }}>
              <Typography
                variant="h4"
                gutterBottom
                fontWeight="bold"
                color="primary"
              >
                {post.title}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <HandshakeIcon sx={{ mr: 1, color: "text.secondary" }} />
                {post.authorId ? (
                  <MuiLink
                    href={`/public-profile/${post.authorId}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{
                        cursor: "pointer",
                        fontWeight: "medium",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {clubInfo?.clubName ??
                        post.organizationName ??
                        "未知社團"}
                    </Typography>
                  </MuiLink>
                ) : (
                  <Typography variant="h6" color="text.secondary">
                    {clubInfo?.clubName ?? post.organizationName ?? "未知社團"}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                發布時間：{formattedDate}
              </Typography>
            </Box>{" "}
            {/* 收藏按鈕 */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant={isFavorite ? "contained" : "outlined"}
                color="error"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                size="small"
                startIcon={
                  isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />
                }
                sx={{
                  borderRadius: 4,
                  px: 2,
                  boxShadow: isFavorite ? 2 : 0,
                  "&:hover": {
                    boxShadow: 1,
                  },
                }}
              >
                {isFavorite ? "已收藏" : "收藏"}
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />{" "}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                p: 3,
                borderRadius: 2,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ mb: 2 }}
              >
                聯繫窗口資訊
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    聯繫人
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {post.contactName ?? "未提供"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    聯絡電話
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {post.contactPhone ?? "未提供"}
                  </Typography>
                </Box>

                {post.email && (
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      電子郵件
                    </Typography>
                    <MuiLink href={`mailto:${post.email}`}>
                      {post.email}
                    </MuiLink>
                  </Box>
                )}

                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    發布時間
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formattedDate}
                  </Typography>
                </Box>
              </Box>
            </Box>{" "}
            {/* 活動與組織資訊 */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                p: 3,
                borderRadius: 2,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ mb: 2 }}
              >
                活動與組織資訊
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      活動標題
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {post.eventName || "未提供"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      活動期間
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {post.eventStart || post.eventDate
                        ? formatDate(post.eventStart || post.eventDate)
                        : "未提供"}{" "}
                      {post.eventEnd ? `- ${formatDate(post.eventEnd)}` : ""}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      活動地點
                    </Typography>
                    <Typography variant="body1">
                      {post.location || "未提供"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      活動類型
                    </Typography>
                    <Typography variant="body1">
                      {post.eventNature || post.eventType || "未提供"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      預估人數
                    </Typography>
                    <Typography variant="body1">
                      {post.estimatedParticipants || "未提供"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: "flex", flexDirection: "column", mb: 2 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      贊助截止時間
                    </Typography>
                    <Typography variant="body1">
                      {post.sponsorDeadline
                        ? formatDate(post.sponsorDeadline)
                        : "未提供"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            {/* 贊助需求 */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                p: 3,
                borderRadius: 2,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                贊助需求
              </Typography>

              <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ minWidth: 100 }}
                >
                  需求類型：
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: "medium",
                    bgcolor:
                      post.demandType === "物資"
                        ? "#e3f2fd"
                        : post.demandType === "金錢"
                        ? "#fce4ec"
                        : post.demandType === "講師"
                        ? "#e8f5e9"
                        : "#f5f5f5",
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  {post.demandType || "未指定"}
                </Typography>
              </Box>

              {post.demandType === "物資" && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 100 }}
                    >
                      物資類型：
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {post.selectedDemands
                        ? post.selectedDemands.join("、")
                        : post.materialCategory?.join("、") || "未提供"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 100 }}
                    >
                      物資明細：
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-line",
                        bgcolor: "white",
                        p: 1.5,
                        borderRadius: 1,
                        flex: 1,
                      }}
                    >
                      {post.demandDescription ||
                        post.materialDetails ||
                        "未提供"}
                    </Typography>
                  </Box>
                </Box>
              )}

              {post.demandType === "金錢" && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 100 }}
                    >
                      金額範圍：
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {post.moneyLowerLimit && post.moneyUpperLimit
                        ? `${post.moneyLowerLimit} - ${post.moneyUpperLimit} 元`
                        : "未提供"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 100 }}
                    >
                      用途說明：
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-line",
                        bgcolor: "white",
                        p: 1.5,
                        borderRadius: 1,
                        flex: 1,
                      }}
                    >
                      {post.moneyPurpose ?? "未提供"}
                    </Typography>
                  </Box>
                </Box>
              )}

              {post.demandType === "講師" && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", mb: 1 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 100 }}
                    >
                      講師類型：
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {post.speakerType ?? "未提供"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ minWidth: 100 }}
                    >
                      需求描述：
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-line",
                        bgcolor: "white",
                        p: 1.5,
                        borderRadius: 1,
                        flex: 1,
                      }}
                    >
                      {post.speakerDetail ?? "未提供"}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>{" "}
            {/* 回饋與補充 */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                p: 3,
                borderRadius: 2,
                mb: 3,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ mb: 2 }}
              >
                回饋與補充
              </Typography>

              <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ minWidth: 100 }}
                >
                  回饋方式：
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-line",
                    bgcolor: "white",
                    p: 1.5,
                    borderRadius: 1,
                    flex: 1,
                  }}
                >
                  {post.feedbackDetails || "未提供"}
                </Typography>
              </Box>

              {post.notes && (
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ minWidth: 100 }}
                  >
                    補充說明：
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      whiteSpace: "pre-line",
                      bgcolor: "white",
                      p: 1.5,
                      borderRadius: 1,
                      flex: 1,
                    }}
                  >
                    {post.notes}
                  </Typography>
                </Box>
              )}
            </Box>
            {/* 底部按鈕區：返回列表和合作按鈕 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 4,
                mb: 2,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={() => router.push("/Artical/DemandList")}
              >
                返回列表
              </Button>

              {isLoggedIn && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={messageSent}
                  startIcon={<HandshakeIcon />}
                >
                  {messageSent ? "已發送訊息" : "發送合作訊息"}
                </Button>
              )}
              {!isLoggedIn && (
                <Typography variant="body2" color="text.secondary">
                  請先登入才能發送合作訊息
                </Typography>
              )}
            </Box>
            {/* 附加的合作記錄確認按鈕 */}
            {isLoggedIn && messageSent && (
              <Box
                sx={{ display: "flex", justifyContent: "center", mt: 1, mb: 3 }}
              >
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleNavigateToCollaborationList}
                  startIcon={<HandshakeIcon />}
                  size="small"
                >
                  前往我的合作記錄確認
                </Button>
              </Box>
            )}
          </Paper>
        </Container>{" "}
        {/* Snackbar */}{" "}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
    </div>
  );
}
