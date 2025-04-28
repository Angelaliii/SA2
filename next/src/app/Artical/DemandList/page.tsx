"use client";

import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import RedeemIcon from "@mui/icons-material/Redeem";
import SearchIcon from "@mui/icons-material/Search";
import {
  Box,
  Button,
  Card,
  Chip,
  Container,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Stack,
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

// Add interfaces for proper typing
interface Post {
  id: string;
  title?: string;
  content?: string;
  postType?: string;
  author?: string;
  authorId?: string;
  organizationName?: string;
  eventDate?: string;
  estimatedParticipants?: string;
  tags?: string[];
  selectedDemands?: string[];
  location?: string;
  isDraft?: boolean;
  cooperationReturn?: string;
  createdAt?: string;
}

const demandItems = ["零食", "飲料", "生活用品", "戶外用品", "其他"];
const eventTypes = ["講座", "工作坊", "表演", "比賽", "展覽", "營隊", "其他"];

export default function DemandListPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    selectedDemand: "",
    selectedEventType: "",
    startDate: "",
    endDate: "",
    minParticipants: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>("全部");
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
        })) as Post[];

        // Sort posts by creation date (newest first)
        results.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA; // Descending order (newest first)
        });

        // Manual filter for event type
        if (filters.selectedEventType) {
          results = results.filter((post) => {
            return post.eventType === filters.selectedEventType;
          });
        }

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
            const participants = parseInt(post.estimatedParticipants ?? "0");
            return participants >= parseInt(filters.minParticipants);
          });
        }

        setPosts(results);
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
        : (post.selectedDemands ?? []).includes(selectedTag ?? "");

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
      <Box sx={{ 
        backgroundColor: "#f5f7fa", 
        width: "100%",
        pt: "84px",
        pb: "40px"
      }}>
        <Container maxWidth="md">
          {/* 頁首區塊 */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" color="primary.main">
              需求列表
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              瀏覽所有合作需求，找到適合您的合作機會
            </Typography>
          </Box>

          {/* 篩選條件區塊 */}
          <Paper 
            elevation={1} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: "12px" 
            }}
          >
            {/* 搜尋欄位 */}
            <TextField
              fullWidth
              placeholder="搜尋需求…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* 日期篩選區域 */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="開始日期"
                type="date"
                value={filters.startDate}
                onChange={handleFilterChange}
                name="startDate"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                label="結束日期"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                name="endDate"
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {/* 需求物資和人數篩選 */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="需求物資類型"
                select
                value={filters.selectedDemand}
                onChange={handleFilterChange}
                name="selectedDemand"
              >
                <option value="">全部</option>
                {demandItems.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="最低參與人數"
                type="number"
                value={filters.minParticipants}
                onChange={handleFilterChange}
                name="minParticipants"
              />
            </Box>
          </Paper>

          {/* 貼文卡片列表區塊 */}
          <Stack spacing={3}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <Typography>載入中...</Typography>
              </Box>
            ) : currentPosts.length === 0 ? (
              <Typography align="center" color="text.secondary">
                找不到符合的文章
              </Typography>
            ) : (
              currentPosts.map((post, index) => (
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
                      {/* 卡片中間區域（主資訊區） */}
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: "primary.main", 
                            fontWeight: "bold",
                            mb: 1.5 
                          }}
                        >
                          {post.title ?? "(無標題)"}
                        </Typography>
                        
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <EventIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {post.eventDate ? new Date(post.eventDate).toISOString().split('T')[0] : "未設定日期"}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                          <GroupIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {post.estimatedParticipants ?? "0"}人
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          來自：{post.organizationName ?? "未知組織"}
                        </Typography>
                      </Box>
                      
                      {/* 卡片右側區域（補充資訊區） */}
                      <Box sx={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "flex-start",
                        ml: 2,
                        width: "30%" 
                      }}>
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <InventoryIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">需求物資</Typography>
                          </Box>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {(post.selectedDemands ?? []).map((item) => (
                              <Chip 
                                key={`${post.id}-${item}`} 
                                label={item} 
                                size="small" 
                                color="primary"
                              />
                            ))}
                          </Box>
                        </Box>
                        
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <RedeemIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">回饋方式</Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              fontSize: "0.875rem",
                              lineHeight: 1.43,
                              maxWidth: "100%",
                            }}
                          >
                            {post.cooperationReturn || "未提供回饋方式"}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* 卡片右邊操作區 */}
                      <Box sx={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        justifyContent: "center",
                        alignItems: "flex-end", 
                        ml: 2
                      }}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(post);
                          }}
                          sx={{ mb: 1 }}
                        >
                          {favorites[post.id] ? "❤️" : "🤍"}
                        </IconButton>
                        
                        <Button
                          variant="outlined"
                          component={Link}
                          href={`/Artical/${post.id}`}
                          size="small"
                          sx={{ whiteSpace: "nowrap" }}
                        >
                          查看更多
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                </motion.div>
              ))
            )}
          </Stack>
          
          {/* 分頁控制 */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
