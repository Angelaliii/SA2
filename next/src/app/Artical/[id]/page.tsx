"use client";

import {
  Box,
  Container,
  Typography,
  Chip,
  Paper,
  Link as MuiLink,
  Button,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as postService from "../../../firebase/services/post-service";
import { clubServices } from "../../../firebase/services/club-service";
import Navbar from "../../../components/Navbar";
import InventoryIcon from "@mui/icons-material/Inventory";
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import Link from "next/link";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { auth } from "../../../firebase/config";
import FavoriteIcon from "@mui/icons-material/Favorite"; // 收藏圖示

export default function DemandPostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [clubInfo, setClubInfo] = useState<any>(null);
  const [messageSent, setMessageSent] = useState(false); // 控制訊息是否已發送

  useEffect(() => {
    const fetchPost = async () => {
      const data = await postService.getPostById(id as string);
      setPost(data);

      if (data?.authorId) {
        const club = await clubServices.getClubById(data.authorId);
        setClubInfo(club);
      }
    };
    fetchPost();
  }, [id]);

  if (!post) return null;

  const formattedDate = new Date(post.createdAt).toLocaleString("zh-TW", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const handleSendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const messageContent = `我這個組織有意願和你這篇文章合作。`;
      await addDoc(collection(db, "messages"), {
        senderId: currentUser.uid,
        receiverId: post.authorId, // 文章作者的 UID
        messageContent: messageContent,
        postId: id,
        timestamp: new Date(),
      });

      setMessageSent(true);  // 訊息發送成功後，設置狀態
    } catch (error) {
      console.error("發送訊息失敗:", error);
    }
  };

  const handleAddToFavorites = () => {
    // 此處實現收藏邏輯
    console.log("已添加到收藏");
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, minHeight: "80vh" }}>
          {/* 標題 + 社團資訊 */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {post.title}
            </Typography>

            {/* 🔗 社團名稱 + 學校連結 */}
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              發布社團：
              {clubInfo ? (
                <MuiLink
                  component={Link}
                  href={`/user/${clubInfo.userId}`}
                  underline="hover"
                >
                  {clubInfo.clubName}（{clubInfo.schoolName}）
                </MuiLink>
              ) : (
                post.organizationName || "未知社團"
              )}
            </Typography>

            {/* 🕒 發文時間 */}
            <Typography variant="body2" color="text.secondary">
              發文時間：{formattedDate}
            </Typography>

            {/* 📧 社團信箱 */}
            <Typography variant="body2" color="text.secondary">
              聯絡信箱：{clubInfo?.email || "未提供"}
            </Typography>
          </Box>

          {/* 需求物資 */}
          <Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InventoryIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">需求物資</Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {post.selectedDemands?.map((item: string, index: number) => (
                <Chip key={index} label={item} color="primary" />
              ))}
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {post.demandDescription || "無補充說明"}
            </Typography>
          </Box>

          {/* 活動資訊 */}
          <Box sx={{ backgroundColor: "#f9f9f9", p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">活動資訊</Typography>
            </Box>
            {post.eventName && (
              <Typography variant="body2" gutterBottom>
                活動名稱：{post.eventName}
              </Typography>
            )}
            {post.eventType && (
              <Typography variant="body2" gutterBottom>
                活動性質：{post.eventType}
              </Typography>
            )}
            <Typography variant="body2" gutterBottom>
              預估人數：{post.estimatedParticipants || "未填寫"}
            </Typography>
            <Typography variant="body2" gutterBottom>
              活動日期：{post.eventDate || "未填寫"}
            </Typography>
          </Box>

          {/* 回饋與補充說明 */}
          <Box sx={{ backgroundColor:"#f9f9f9", p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InfoIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">補充說明與回饋</Typography>
            </Box>
            <Typography variant="body2" gutterBottom>
              {post.cooperationReturn || "未提供回饋方案"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {post.eventDescription || "無補充說明"}
            </Typography>
          </Box>

          {/* 按鈕區塊：發送訊息與收藏 */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            {/* 收藏按鈕 */}
            <Box sx={{ textAlign: "left" }}>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleAddToFavorites}
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <FavoriteIcon sx={{ color: "#f44336" }} />
              </Button>
            </Box>

            {/* 發送訊息按鈕 */}
            <Box sx={{ textAlign: "right" }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={messageSent}
                sx={{ width: 200 }} // 按鈕變長
              >
                {messageSent ? "已發送訊息" : "發送合作訊息"}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
