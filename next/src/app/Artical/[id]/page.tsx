"use client";

import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import InventoryIcon from "@mui/icons-material/Inventory";
import FavoriteIcon from "@mui/icons-material/Favorite";
import GroupsIcon from '@mui/icons-material/Groups';
import FlareIcon from '@mui/icons-material/Flare';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Link as MuiLink,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { addDoc, collection } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";
import { clubServices } from "../../../firebase/services/club-service";
import * as postService from "../../../firebase/services/post-service";

export default function DemandPostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [clubInfo, setClubInfo] = useState<any>(null);
  const [messageSent, setMessageSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [favorites, setFavorites] = useState<{ [key: string]: boolean }>({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    const fetchPost = async () => {
      try {
        const data = await postService.getPostById(id as string);
        setPost(data);
        console.log("post data", data); // 這裡 log

        if (data?.authorId) {
          const club = await clubServices.getClubById(data.authorId);
          setClubInfo(club);

          if (club?.email) {
            setPost((prev: any) => ({ ...prev, authorEmail: club.email }));
          }
        }

        if (auth.currentUser) {
          const isFav = await postService.checkIfFavorited(
            auth.currentUser.uid,
            id as string
          );
          setFavorites({ [id as string]: isFav });
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      }
    };

    fetchPost();
    return () => unsubscribe();
  }, [id]);

  if (!post) return null;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (error) {
      return "無效日期";
    }
  };

  const formattedDate = formatDate(post.createdAt);

  const handleSendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const messageContent = `我這個組織有意願和你這篇文章合作。`;
      await addDoc(collection(db, "messages"), {
        senderId: currentUser.uid,
        receiverId: post.authorId,
        messageContent,
        postId: id,
        timestamp: new Date(),
      });

      setMessageSent(true);
      setSnackbarMessage("已成功發送合作訊息！");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("發送訊息失敗:", error);
      setSnackbarMessage("發送訊息失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const toggleFavorite = async (post: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const postId = post.id;
    const isFav = favorites[postId];

    try {
      if (isFav) {
        await postService.removeFavorite(currentUser.uid, postId);
      } else {
        await postService.addFavorite(currentUser.uid, postId);
      }
      setFavorites((prev) => ({ ...prev, [postId]: !isFav }));
    } catch (error) {
      console.error("收藏切換失敗:", error);
    }
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {post.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              發布社團：
              {clubInfo ? (
                <MuiLink component={Link} href={`/user/${clubInfo.userId}`} underline="hover">
                  {clubInfo.clubName}（{clubInfo.schoolName}）
                </MuiLink>
              ) : (
                post.organizationName ?? "未知社團"
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              發文時間：{formattedDate}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              聯絡信箱：{post.email ?? "未提供"}
            </Typography>
          </Box>

          {/* 四個區塊渲染如下 */}

         {/* 1. 需求類別 */}
<Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}>
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    <InfoIcon fontSize="small" sx={{ mr: 1, color: "#1976d2" }} />
    <Typography variant="h6" sx={{ color: "#1976d2" }}>
      需求類別
    </Typography>
  </Box>
  <Typography variant="body2">
    <strong>需求主題:</strong> {post.title ?? "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>需求目的:</strong> {post.purposeType ?? "未填寫"}
  </Typography>
</Box>

          {/* 2. 需求類型與合作形式 */}
<Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}>
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    <GroupsIcon fontSize="small" sx={{ mr: 1, color: "#1976d2" }} />
    <Typography variant="h6" sx={{ color: "#1976d2" }}>
      需求類型與合作形式
    </Typography>
  </Box>
  <Typography variant="body2">
    <strong>需求物資:</strong>{" "}
    {post.customItems && post.customItems.length > 0 && post.customItems[0] !== "未填寫"
      ? post.customItems.join("、")
      : "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>希望企業參與方式:</strong> {post.participationType ?? "未填寫"}
  </Typography>
</Box>

{/* 3. 活動資訊 */}
<Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}>
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    <FlareIcon fontSize="small" sx={{ mr: 1, color: "#1976d2" }} />
    <Typography variant="h6" sx={{ color: "#1976d2" }}>
      活動資訊
    </Typography>
  </Box>
  <Typography variant="body2">
    <strong>預估人數：</strong> {post.estimatedParticipants ?? "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>活動地點：</strong> {post.location ?? "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>贊助截止日期：</strong> {post.cooperationReturn ?? "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>活動開始日期：</strong> {post.eventDate ?? "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>活動結束日期：</strong> {post.eventEndDate ?? "未填寫"}
  </Typography>

  {post.purposeType === "教育推廣" && (
    <Typography variant="body2">
      <strong>預計推廣對象：</strong> {post.eventDescription ?? "未填寫"}
    </Typography>
  )}
  {post.purposeType === "社區服務" && (
    <Typography variant="body2">
      <strong>服務對象：</strong> {post.eventType ?? "未填寫"}
    </Typography>
  )}
  {post.purposeType === "校園宣傳" && (
    <>
      <Typography variant="body2">
        <strong>目標對象：</strong> {post.promotionTarget ?? "未填寫"}
      </Typography>
      <Typography variant="body2">
        <strong>宣傳形式：</strong> {post.promotionForm ?? "未填寫"}
      </Typography>
    </>
  )}
</Box>


         {/* 4. 補充說明與回饋 */}
<Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2 }}>
  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
    <ChatBubbleIcon fontSize="small" sx={{ mr: 1, color: "#1976d2" }} />
    <Typography variant="h6" sx={{ color: "#1976d2" }}>
      補充說明與回饋
    </Typography>
  </Box>
  <Typography variant="body2">
    <strong>回饋方式：</strong> {post.demandDescription ?? "未填寫"}
  </Typography>
  <Typography variant="body2">
    <strong>內容說明：</strong> {post.eventDescription ?? "未填寫"}
  </Typography>
</Box>

          {isLoggedIn && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={messageSent}
                sx={{ width: 200 }}
              >
                {messageSent ? "已發送訊息" : "發送合作訊息"}
              </Button>
              <IconButton size="large" onClick={() => toggleFavorite(post)}>
                {favorites[post.id] ? (
                  <FavoriteIcon color="error" />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
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

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
