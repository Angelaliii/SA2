"use client";

import {
  Box,
  Container,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BusinessIcon from '@mui/icons-material/Business';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Navbar from "../../../components/Navbar";
import { useState, useEffect } from "react";
import Pagination from "@mui/material/Pagination";
import { collection, getDocs, query, where, orderBy, deleteDoc, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase/config";

interface EnterprisePost {
  id: string;
  title: string;
  content: string;
  companyName?: string;
  email?: string;
  createdAt?: string;
  status?: string;
  authorId?: string;
}

export default function EnterpriseListPage() {
  const [posts, setPosts] = useState<EnterprisePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const itemsPerPage = 8;

  // 獲取收藏狀態
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth.currentUser) return;

      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);

        const favMap: Record<string, boolean> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.articleId) {
            favMap[data.articleId] = true;
          }
        });

        setFavorites(favMap);
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };

    fetchFavorites();
  }, []);

  // 加载企业公告
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "enterprisePosts"),
          orderBy("createdAt", "desc") // 按创建时间降序排序
        );
        const results = await getDocs(q);
        const postsData = results.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EnterprisePost[];
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 处理收藏
  const toggleFavorite = async (post: EnterprisePost) => {
    if (!auth.currentUser) {
      alert("請先登入");
      return;
    }

    try {
      const postId = post.id;
      const userId = auth.currentUser.uid;

      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("articleId", "==", postId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // 添加收藏
        const favoriteData = {
          userId,
          articleId: postId,
          createdAt: new Date().toISOString(),
          postType: "enterprise"
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setFavorites((prev) => ({ ...prev, [postId]: true }));
      } else {
        // 取消收藏
        const favoriteDoc = snapshot.docs[0];
        await deleteDoc(doc(db, "favorites", favoriteDoc.id));
        setFavorites((prev) => {
          const newFavorites = { ...prev };
          delete newFavorites[postId];
          return newFavorites;
        });
      }
    } catch (err) {
      console.error("收藏操作失敗", err);
      alert("操作失敗，請稍後再試");
    }
  };

  

  const filteredPosts = posts.filter((post) => {
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.companyName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Navbar />
      <Box sx={{ pt: "84px", pb: 8, minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary" gutterBottom>
              企業合作資訊
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              瀏覽企業合作機會，尋找適合的贊助夥伴
            </Typography>
          </Box>

          {/* 搜尋欄 */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <TextField
              fullWidth
              placeholder="搜尋企業名稱或合作內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
              }}
              sx={{ bgcolor: "background.paper" }}
            />
          </Paper>

          {/* 貼文列表 */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={2}>
              {currentPosts.map((post) => (
                <Paper
                  key={post.id}
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    transition: "all 0.3s ease",
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    },
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  {/* Left Section */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: "primary.main",
                        mb: 1,
                        cursor: "pointer",
                        "&:hover": { color: "primary.dark" },
                      }}
                      onClick={() => window.location.href = `/Enterprise/${post.id}`}
                    >
                      {post.title}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <BusinessIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      <Typography variant="body2" color="text.secondary">
                        {post.companyName || "未知企業"}
                      </Typography>
                    </Box>

                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mt: 2, 
                        color: "text.secondary",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {post.content}
                    </Typography>
                  </Box>

                  {/* Right Section */}
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(post);
                      }}
                      color={favorites[post.id] ? "error" : "default"}
                    >
                      {favorites[post.id] ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      endIcon={<ArrowForwardIcon />}
                      onClick={() => window.location.href = `/Enterprise/${post.id}`}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      查看詳情
                    </Button>

                  
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}

          {/* 分頁 */}
          {!loading && filteredPosts.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={Math.ceil(filteredPosts.length / itemsPerPage)}
                page={currentPage}
                onChange={(_, value) => {
                  setCurrentPage(value);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                color="primary"
              />
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
