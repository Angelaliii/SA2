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
  Grid,
  MenuItem,
  Pagination,
  Paper,
  TextField,
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
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";

const demandItems = ["零食", "飲料", "生活用品", "戶外用品", "其他"];

export default function DemandListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    selectedDemand: "",
    startDate: "",
    endDate: "",
    minParticipants: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>("全部");
  const [availableTags, setAvailableTags] = useState<string[]>(["全部"]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 每頁顯示8筆資料

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

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "posts"),
          where("postType", "==", "demand"),
          where("isDraft", "==", false)
        );

        if (filters.selectedDemand) {
          q = query(
            q,
            where("selectedDemands", "array-contains", filters.selectedDemand)
          );
        }

        // Instead of an exact date match, we'll filter manually for date ranges
        const snapshot = await getDocs(q);
        let results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Manual date range filtering
        if (filters.startDate || filters.endDate) {
          results = results.filter((post) => {
            if (!post.eventDate) return true;

            const postDate = new Date(post.eventDate);

            if (filters.startDate && filters.endDate) {
              const start = new Date(filters.startDate);
              const end = new Date(filters.endDate);
              return postDate >= start && postDate <= end;
            } else if (filters.startDate) {
              const start = new Date(filters.startDate);
              return postDate >= start;
            } else if (filters.endDate) {
              const end = new Date(filters.endDate);
              return postDate <= end;
            }

            return true;
          });
        }

        // Manual filter for participants
        if (filters.minParticipants) {
          results = results.filter((post) => {
            const participants = parseInt(post.estimatedParticipants || "0");
            return participants >= parseInt(filters.minParticipants);
          });
        }

        setPosts(results);

        // Extract unique tags from posts
        const tags = results.flatMap((post) => post.tags || []);
        const uniqueTags = ["全部", ...Array.from(new Set(tags))];
        setAvailableTags(uniqueTags);
      } catch (err) {
        console.error("讀取貼文失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // 篩選貼文
  const filteredPosts = posts.filter((post) => {
    if (!post?.title && !post?.content) return false;

    const matchSearch =
      !searchTerm ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTag =
      selectedTag === "全部"
        ? true
        : post.tags?.includes(selectedTag ?? "") ?? false;

    return matchSearch && matchTag;
  });

  // 計算分頁
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // 處理頁碼變更
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 獲取當前頁的資料
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 收藏文章
  const toggleFavorite = async (post: any) => {
    if (!auth.currentUser) {
      alert("請先登入");
      return;
    }

    try {
      const postId = post.id;
      const userId = auth.currentUser.uid;

      // 檢查是否已收藏
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("articleId", "==", postId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // 未收藏 -> 收藏
        const favoriteData = {
          userId,
          articleId: postId,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setFavorites((prev) => ({ ...prev, [postId]: true }));
      } else {
        // 已收藏 -> 取消收藏
        const favoriteDoc = snapshot.docs[0];
        await deleteDoc(doc(db, "favorites", favoriteDoc.id));
        setFavorites((prev) => {
          const newFavorites = { ...prev };
          delete newFavorites[postId];
          return newFavorites;
        });
      }
    } catch (err) {
      console.error("操作收藏失敗", err);
      alert("操作失敗，請稍後再試");
    }
  };

  return (
    <>
      <Navbar />
      <Paper
        elevation={0}
        sx={{
          pt: { xs: 8, sm: 10 },
          pb: 6,
          borderRadius: 0,
          background:
            "linear-gradient(180deg, rgba(240,242,245,1) 0%, rgba(255,255,255,1) 100%)",
        }}
      >
        <Container maxWidth="md">
          {/* 搜尋區塊 */}
          <Box sx={{ position: "relative", width: "100%", mb: 4 }}>
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

          {/* 標籤篩選 */}
          <Box
            sx={{
              mb: 4,
              display: "flex",
              gap: 1,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
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

          {/* 進階篩選 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              進階篩選
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="活動開始日期"
                  type="date"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  name="startDate"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="活動結束日期"
                  type="date"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  name="endDate"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="最低參與人數"
                  type="number"
                  value={filters.minParticipants}
                  onChange={handleFilterChange}
                  name="minParticipants"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="需求物資"
                  select
                  value={filters.selectedDemand}
                  onChange={handleFilterChange}
                  name="selectedDemand"
                >
                  <MenuItem value="">全部</MenuItem>
                  {demandItems.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="md" sx={{ my: 4 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {currentPosts.length === 0 ? (
              <Typography align="center" color="text.secondary">
                找不到符合的文章
              </Typography>
            ) : (
              currentPosts.map((post, index) => (
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
                      <Typography variant="h6">
                        {post.title || "(未命名文章)"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {post.organizationName ||
                          post.author ||
                          "(無發布者資訊)"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.content &&
                          (post.content.length > 40
                            ? post.content.slice(0, 40) + "..."
                            : post.content)}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mb: 1,
                          mt: 1,
                        }}
                      >
                        {(post.tags || []).map((tag: string, idx: number) => (
                          <Chip
                            key={idx}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {(post.selectedDemands || []).map(
                          (item: string, index: number) => (
                            <Chip
                              key={`demand-${index}`}
                              label={item}
                              color="primary"
                              size="small"
                            />
                          )
                        )}
                      </Box>
                      {post.location && (
                        <Typography
                          variant="caption"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {post.location}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: "flex-start" }}>
                      <Link
                        href={`/Artical/${post.id}`}
                        style={{ textDecoration: "none" }}
                      >
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
                    </CardActions>
                  </Card>
                </motion.div>
              ))
            )}
          </Box>
        )}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      </Container>
    </>
  );
}
