"use client";

import FavoriteIcon from "@mui/icons-material/Favorite"; // 實心愛心
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"; // 空心愛心
import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar"; // 套用你的共用 Navbar
import { getPostById, PostData } from "../../firebase/services/post-service";

export default function PostDetailPage() {
  const router = useRouter(); // 取得網址參數 id
  const { id } = router.query;
  const [post, setPost] = useState<PostData | null>(null); // 儲存文章資料
  const [loading, setLoading] = useState(true); // 載入狀態
  const [liked, setLiked] = useState(false); // 收藏狀態

  // 取得文章資料
  useEffect(() => {
    if (id) {
      getPostById(id as string).then((data) => {
        setPost(data);
        setLoading(false);
      });
    }
  }, [id]);

  // 收藏按鈕點擊
  const handleLike = () => {
    setLiked(!liked);
    // 🚀 這裡之後可以接 Firebase 收藏功能
  };

  // 如果載入中
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  // 找不到文章
  if (!post) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h6" align="center">
          找不到文章
        </Typography>
      </Container>
    );
  }

  return (
    <>
      {/* 共用 Navbar */}
      <Navbar />

      {/* 內容區塊，淡藍背景 */}
      <Box
        sx={{
          bgcolor: "#f0f7ff", // 背景色
          minHeight: "100vh",
          pt: 10, // 推開 Navbar
          pb: 4,
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={0} // 無陰影
            sx={{
              p: 4,
              borderRadius: 2,
              bgcolor: "white", // 卡片白色
              border: "1px solid #d0e2ff", // 藍色邊框
            }}
          >
            {/* 標題 */}
            <Typography variant="h5" fontWeight={700}>
              {post.title}
            </Typography>{" "}
            {/* 發布位置 */}
            <Typography variant="subtitle1" color="primary" sx={{ mt: 1 }}>
              發布位置：{post.location}
            </Typography>{" "}
            {/* 作者ID */}
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              發布者：{post.authorId || "匿名發布者"}
            </Typography>
            {/* 發布時間，只顯示日期 */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              發布時間：{post.createdAt.slice(0, 10)}
            </Typography>
            {/* 分隔線 */}
            <Divider sx={{ my: 2 }} />
            {/* 文章內容 */}
            <Typography variant="body1" sx={{ mb: 2 }}>
              {post.content}
            </Typography>
            {/* 標籤 */}
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 2 }}>
              {post.tags.map((tag) => (
                <Chip key={tag} label={tag} variant="outlined" />
              ))}
            </Box>
            {/* 收藏按鈕 */}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
              <IconButton onClick={handleLike} color="primary">
                {liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
