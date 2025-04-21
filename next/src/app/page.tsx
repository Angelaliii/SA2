"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // ✅ 注意：使用 app router 要用這個
import styles from "../assets/Plat.module.css";
import Navbar from "../components/Navbar";
import { getAllPosts, permanentlyDeletePost, PostData } from "../firebase/services/post-service";
import { auth } from "../firebase/config"; // ✅ 要拿目前使用者 uid

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

export default function Index() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>("全部");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>(["全部"]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 取得使用者 ID（登入後）
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // 抓文章
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
    if (!post || !post.title || !post.content) return false;

    const matchSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTag =
      selectedTag === "全部"
        ? true
        : post.tags?.includes(selectedTag || "") ?? false;

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
        <Container sx={{ my: 6 }}>
          <TextField
            fullWidth
            label="搜尋文章"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Container>

        <Container sx={{ my: 0 }}>
          <Box sx={{ px: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                color={selectedTag === tag ? "primary" : "default"}
                onClick={() => setSelectedTag(tag)}
                clickable
              />
            ))}
          </Box>
        </Container>

        <Container sx={{ my: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {filteredPosts.map((post) => (
                <Card key={post.id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6">{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.content.length > 40 ? post.content.slice(0, 40) + "..." : post.content}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {post.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                      {post.location}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Link href={`/post/${post.id}`}>
                      <Button size="small">閱讀更多</Button>
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
              ))}
              {filteredPosts.length === 0 && !loading && (
                <Typography variant="body1">找不到符合的文章</Typography>
              )}
            </>
          )}
        </Container>
      </main>
    </Box>
  );
}
