"use client";

import BusinessIcon from "@mui/icons-material/Business";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Pagination from "@mui/material/Pagination";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";

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
  const [selectedTag] = useState<string>("全部");
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
          where("isDraft", "!=", true),
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
          postType: "enterprise",
          title: post.title,
          content: post.content,
          companyName: post.companyName ?? "未知企業",
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setFavorites((prev) => ({ ...prev, [postId]: true }));

        // 顯示簡短提示而不跳轉頁面
        alert("已成功加入收藏！");
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

  // Add scroll effect when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const filteredPosts = posts.filter((post) => {
    return (
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.companyName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Navbar />
      <Box
        sx={{
          pt: "84px",
          pb: 8,
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              fontWeight="bold"
              color="primary"
              gutterBottom
            >
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
            {" "}
            <TextField
              fullWidth
              placeholder="搜尋企業名稱或合作內容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              // Use modern approach instead of deprecated InputProps
              slotProps={{
                input: {
                  startAdornment: (
                    <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
                  ),
                },
              }}
              sx={{ bgcolor: "background.paper" }}
            />
          </Paper>{" "}
          {/* 貼文列表 */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={3}>
              {currentPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                >
                  <Card
                    sx={{
                      borderRadius: "16px",
                      p: 3,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        transform: "translateY(-4px)",
                        transition: "all 0.3s ease",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Main information section */}
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color: "primary.main",
                            fontWeight: "bold",
                            mb: 1.5,
                          }}
                        >
                          {post.title}
                        </Typography>

                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {post.companyName ?? "未知企業"}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {post.content}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", mt: 1 }}
                        >
                          發布時間：
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString(
                                "zh-TW"
                              )
                            : "未知"}
                        </Typography>
                      </Box>

                      {/* Actions section */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "flex-end",
                          ml: 2,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(post);
                          }}
                          sx={{ mb: 1 }}
                          color={favorites[post.id] ? "error" : "default"}
                        >
                          {favorites[post.id] ? (
                            <FavoriteIcon />
                          ) : (
                            <FavoriteBorderIcon />
                          )}
                        </IconButton>

                        <Button
                          variant="outlined"
                          component={Link}
                          href={`/Enterprise/${post.id}`}
                          size="small"
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          查看更多
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              ))}
            </Stack>
          )}
          {/* 分頁 */}
          {!loading && filteredPosts.length > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              {" "}
              <Pagination
                count={Math.ceil(filteredPosts.length / itemsPerPage)}
                page={currentPage}
                onChange={(_, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
