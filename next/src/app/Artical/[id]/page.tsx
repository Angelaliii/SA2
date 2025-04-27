"use client";

import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import InventoryIcon from "@mui/icons-material/Inventory";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
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
  const [messageSent, setMessageSent] = useState(false); // 控制訊息是否已發送
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // 新增Snackbar相關狀態
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
      const data = await postService.getPostById(id as string);
      setPost(data);

      if (data?.authorId) {
        const club = await clubServices.getClubById(data.authorId);
        setClubInfo(club);

        // 直接使用 clubInfo 的 email 作為聯絡信箱
        if (club && club.email) {
          setPost((prev: any) => ({ ...prev, authorEmail: club.email }));
        }
      }
    };

    fetchPost();

    return () => unsubscribe();
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

      setMessageSent(true); // 訊息發送成功後，設置狀態
      // 顯示成功訊息
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
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
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
                post.organizationName ?? "未知社團"
              )}
            </Typography>

            {/* 🕒 發文時間 */}
            <Typography variant="body2" color="text.secondary">
              發文時間：{formattedDate}
            </Typography>

            {/* 📧 社團信箱 */}
            <Typography variant="body2" color="text.secondary">
              聯絡信箱：
              {post.authorEmail ?? "未提供"}
            </Typography>
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
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              {post.selectedDemands?.length > 0 ? (
                post.selectedDemands.map((item: string, index: number) => (
                  <Chip key={index} label={item} color="primary" />
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

          {/* 按鈕區塊：發送訊息 */}
          {isLoggedIn && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              {/* 發送訊息按鈕 */}
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
