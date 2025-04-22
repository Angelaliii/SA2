"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../assets/Plat.module.css";
import Navbar from "../components/Navbar";
import { getAllPosts, PostData } from "../firebase/services/post-service";



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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>("全部");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>(["全部"]);

  // Fetch posts from Firebase
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsData = await getAllPosts();
        setPosts(postsData);

        // Extract unique tags from all posts
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
    // 確保 post 和必要字段存在，避免空值引起的錯誤
    if (!post || !post.title || !post.content) return false;

    const matchSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTag =
      selectedTag === "全部"
        ? true
        : post.tags && Array.isArray(post.tags)
        ? post.tags.includes(selectedTag || "")
        : false;

    return matchSearch && matchTag;
  });

  return (
    <Box className={styles.page}>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* 封面區塊 */}
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            mb: 4,
            py: 4,
            maxWidth: "100%",
            height: "300"
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
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
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
          <TextField
            fullWidth
            label="搜尋文章"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Container>

        {/* Tags */}
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

        {/* Posts */}
        <Container
          sx={{ my: 3, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {filteredPosts.map((post) => (
                <Card key={post.id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {post.title}
                    </Typography>
                    {/* 文章內容只顯示 40 字 + "..." */}
                    <Typography variant="body2" color="text.secondary">
                      {post.content.length > 40
                        ? post.content.slice(0, 40) + "..."
                        : post.content}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
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
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      {post.location}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Link href={`/post/${post.id}`}>
                      <Button size="small">閱讀更多 </Button>{" "}
                    </Link>
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
