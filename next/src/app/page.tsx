"use client";

import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../assets/globals.module.css";
import Navbar from "../components/Navbar";
import { auth } from "../firebase/config";
import {
  getAllPosts,
  permanentlyDeletePost,
  PostData,
} from "../firebase/services/post-service";

export default function Index() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>("全部");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>(["全部"]);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsData = await getAllPosts();
        setPosts(postsData);

        const tags = postsData.flatMap((post) => post.tags);
        const uniqueTags = ["全部", ...Array.from(new Set(tags))];
        setAvailableTags(uniqueTags);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    if (!post?.title ?? !post?.content) return false;

    const matchSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTag =
      selectedTag === "全部"
        ? true
        : post.tags?.includes(selectedTag ?? "") ?? false;

    return matchSearch && matchTag;
  });

  // 刪除文章
  const handleDelete = async (postId: string) => {
    const confirmDelete = confirm("你確定要刪除這篇文章嗎？此操作無法復原！");
    if (!confirmDelete) return;

    const result = await permanentlyDeletePost(postId);
    if (result.success) {
      alert("文章已成功刪除！");
      setPosts((prev) => prev.filter((p) => p.id !== postId)); // 本地先更新
    } else {
      alert("刪除失敗，請稍後再試");
    }
  };
  return (
    <Box className={styles.page}>
      <Navbar />

      <main>
        {/* 封面區塊 */}
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            mb: 4,
            py: 4,
            maxWidth: "100%",
            height: 300,
          }}
        >
          <img
            src="/image/index_picture.png"
            alt="首頁封面圖"
            style={{
              height: "350px",
              objectFit: "contain",
            }}
          />
          <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold" }}>
            找資源、找合作，從這裡開始！
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            一站式媒合平台，串聯企業與社團，共創雙贏
          </Typography>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              href="/explore" // ⬅ 替換為實際的合作探索頁
            >
              找合作
            </Button>
            <Button
              variant="outlined"
              color="primary"
              href="/edit-home" // ⬅ 替換為實際的編輯主頁頁面
            >
              編輯主頁
            </Button>
          </Box>
        </Box>

        {/* Search */}
        <Container sx={{ my: 6 }}>
          <Box sx={{ position: "relative", width: "100%" }}>
            <SearchIcon
              sx={{
                position: "absolute",
                left: 2,
                top: "50%",
                transform: "translateY(-50%)",
                color: "text.secondary",
                zIndex: 1,
                ml: 1,
              }}
            />
            <TextField
              fullWidth
              placeholder="搜尋文章..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                "& .MuiInputBase-root": {
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                  pl: 5,
                  pr: 2,
                },
              }}
            />
          </Box>
        </Container>

        {/* Tags */}
        <Container sx={{ mb: 2 }}>
          <Box sx={{ px: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {availableTags.map((tag) => (
              <motion.div key={tag} whileTap={{ scale: 0.95 }}>
                <Chip
                  label={tag}
                  color={selectedTag === tag ? "primary" : "default"}
                  onClick={() => setSelectedTag(tag)}
                  clickable
                  sx={{ borderRadius: 2, px: 1.5 }}
                />
              </motion.div>
            ))}
          </Box>
        </Container>

        <Container
          sx={{ my: 3, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    p: 2,
                    backgroundColor: "#ffffff",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.05)",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6">{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.content.length > 40
                        ? post.content.slice(0, 40) + "..."
                        : post.content}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        mb: 1,
                      }}
                    >
                      {post.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block" }}
                    >
                      {post.location}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Link href={`/post/${post.id}`}>
                      <Button
                        size="small"
                        sx={{
                          textTransform: "none",
                          fontWeight: 500,
                          borderRadius: 2,
                          px: 2,
                        }}
                      >
                        閱讀更多
                      </Button>
                    </Link>
                    {/* 刪除按鈕（只有當前使用者是作者才顯示） */}
                    {auth.currentUser?.uid === post.authorId && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleDelete(post.id!)}
                      >
                        刪除
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </motion.div>
            ))
          )}
          {filteredPosts.length === 0 && !loading && (
            <Typography variant="body1">找不到符合的文章</Typography>
          )}
        </Container>
      </main>
    </Box>
  );
}
