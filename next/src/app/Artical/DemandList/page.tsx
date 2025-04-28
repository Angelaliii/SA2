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
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
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
import { scrollToTop } from "../../../utils/clientUtils";

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
  createdAt: string;
  eventType?: string;
  deleted?: boolean;
  demandDescription?: string;
  eventName?: string;
  eventDescription?: string;
  email?: string;
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
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const [selectedTag] = useState<string>("全部");
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
        // First try - Using compound index
        try {
          const indexedQuery = query(
            collection(db, "posts"),
            where("postType", "==", "demand"),
            where("isDraft", "==", false),
            orderBy("createdAt", "desc")
          );

          const indexedSnapshot = await getDocs(indexedQuery);
          console.log(
            `使用索引查詢成功獲取 ${indexedSnapshot.docs.length} 篇文章`
          );

          // Convert document data to Post objects
          const results: Post[] = indexedSnapshot.docs
            .filter((doc) => !doc.data().deleted)
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title ?? "(無標題)",
                ...data,
                createdAt: formatCreatedAt(data),
              } as Post;
            });

          // Apply filters
          const filteredResults = applyFilters(results);

          setPosts(filteredResults);
          setLoading(false);
          return;
        } catch (indexError) {
          console.warn("索引查詢失敗，將使用備用查詢方法:", indexError);
        }

        // Backup query method
        console.log("使用備用查詢方法...");
        const backupQuery = query(
          collection(db, "posts"),
          where("postType", "==", "demand")
        );

        const snapshot = await getDocs(backupQuery);
        console.log(`備用查詢獲取到 ${snapshot.docs.length} 篇需求文章`);

        // Convert to Post objects
        let results: Post[] = snapshot.docs
          .filter((doc) => !doc.data().isDraft && !doc.data().deleted)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: formatCreatedAt(data),
            } as Post;
          });

        // Sort by creation time (newest first)
        results.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;

          try {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();

            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;

            return dateB - dateA;
          } catch (error) {
            console.error("排序出錯:", error);
            return 0;
          }
        });

        // Apply filters
        const filteredResults = applyFilters(results);

        setPosts(filteredResults);

        // Reset page number if needed
        if (
          filteredResults.length > 0 &&
          Math.ceil(filteredResults.length / itemsPerPage) < currentPage
        ) {
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("獲取需求文章失敗:", err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filters, currentPage, itemsPerPage, searchTerm]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  // Filter posts (this is actually already done in the useEffect above, but kept for consistency)
  const filteredPosts = posts.filter((post) => {
    // Must have title or content
    if (!post?.title && !post?.content) return false;

    // Filter by search term - more accurate string matching
    const matchSearch =
      !searchTerm ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.organizationName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by tag
    const matchTag =
      selectedTag === "全部"
        ? true
        : Array.isArray(post.selectedDemands) &&
          post.selectedDemands.includes(selectedTag ?? "");

    return matchSearch && matchTag;
  });

  // Calculate pagination
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage); // Handle page change
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);

    // Use our client utility instead of inline window check
    scrollToTop(true, 10);
  };

  // Get current page data
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle favorite
  const toggleFavorite = async (post: Post) => {
    if (!auth.currentUser) {
      alert("請先登入");
      return;
    }

    try {
      const postId = post.id;
      const userId = auth.currentUser.uid;

      // Check if already favorited
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("articleId", "==", postId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Not favorited -> Add to favorites
        const favoriteData = {
          userId,
          articleId: postId,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setFavorites((prev) => ({ ...prev, [postId]: true }));
      } else {
        // Already favorited -> Remove from favorites
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

  // Helper function to format createdAt date
  const formatCreatedAt = (data: any): string => {
    if (data.createdAt) {
      if (data.createdAt.toDate) {
        return data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        return data.createdAt;
      } else {
        return new Date(data.createdAt).toISOString();
      }
    }
    return new Date().toISOString();
  };

  // Helper function to apply filters to posts
  const applyFilters = (posts: Post[]): Post[] => {
    let filteredResults = [...posts];

    // Filter by demand type
    if (filters.selectedDemand) {
      filteredResults = filteredResults.filter((post) => {
        return (
          Array.isArray(post.selectedDemands) &&
          post.selectedDemands?.includes(filters.selectedDemand)
        );
      });
    }

    // Filter by event type
    if (filters.selectedEventType) {
      filteredResults = filteredResults.filter(
        (post) => post.eventType === filters.selectedEventType
      );
    }

    // Filter by date range
    if (filters.startDate || filters.endDate) {
      filteredResults = filteredResults.filter((post) => {
        if (!post.eventDate) return false;

        try {
          const postDate = new Date(post.eventDate);
          if (isNaN(postDate.getTime())) return false;

          if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            return postDate >= start && postDate <= end;
          } else if (filters.startDate) {
            const start = new Date(filters.startDate);
            return postDate >= start;
          } else if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            return postDate <= end;
          }
          return true;
        } catch (error) {
          console.error("日期篩選出錯:", error);
          return false;
        }
      });
    }

    // Filter by participant count
    if (filters.minParticipants && filters.minParticipants !== "0") {
      filteredResults = filteredResults.filter((post) => {
        try {
          const minRequired = parseInt(filters.minParticipants);
          const actual = parseInt(post.estimatedParticipants ?? "0");
          return !isNaN(actual) && actual >= minRequired;
        } catch (error) {
          console.error("參與人數篩選出錯:", error);
          return false;
        }
      });
    }

    // Filter by search term
    if (searchTerm) {
      filteredResults = filteredResults.filter(
        (post) =>
          post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.organizationName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    return filteredResults;
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          backgroundColor: "#f5f7fa",
          width: "100%",
          pt: "84px",
          pb: "40px",
          minHeight: "100vh",
        }}
      >
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
              borderRadius: "12px",
            }}
          >
            {" "}
            {/* 搜尋欄位 */}
            <TextField
              fullWidth
              placeholder="搜尋需求…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
              // Using slotProps instead of deprecated InputProps
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
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
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                // We can use sx to replace InputLabelProps
                sx={{
                  "& .MuiInputLabel-root": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                }}
              />
              <TextField
                fullWidth
                label="結束日期"
                type="date"
                value={filters.endDate}
                onChange={handleFilterChange}
                name="endDate"
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{
                  "& .MuiInputLabel-root": {
                    transform: "translate(14px, -9px) scale(0.75)",
                  },
                }}
              />
            </Box>
            {/* 活動類型和需求物資篩選 */}
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="活動類型"
                select
                value={filters.selectedEventType}
                onChange={handleFilterChange}
                name="selectedEventType"
              >
                <MenuItem value="">全部</MenuItem>
                {eventTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="需求物資類型"
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
            </Box>
            {/* 參與人數篩選 */}
            <Box>
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
                <CircularProgress />
              </Box>
            ) : currentPosts.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 2,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  textAlign: "center",
                }}
              >
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  找不到符合的文章
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {searchTerm ||
                  filters.selectedDemand ||
                  filters.selectedEventType ||
                  filters.startDate ||
                  filters.endDate ||
                  filters.minParticipants
                    ? "沒有找到符合篩選條件的需求文章，請嘗試調整篩選條件"
                    : "目前還沒有任何需求文章"}
                </Typography>
                {(searchTerm ||
                  filters.selectedDemand ||
                  filters.selectedEventType ||
                  filters.startDate ||
                  filters.endDate ||
                  filters.minParticipants) && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setSearchTerm("");
                      setFilters({
                        selectedDemand: "",
                        selectedEventType: "",
                        startDate: "",
                        endDate: "",
                        minParticipants: "",
                      });
                    }}
                    sx={{ mt: 1 }}
                  >
                    清除所有篩選條件
                  </Button>
                )}
              </Paper>
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
                            mb: 1.5,
                          }}
                        >
                          {post.title ?? "(無標題)"}
                        </Typography>

                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <EventIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {post.eventDate
                              ? new Date(post.eventDate)
                                  .toISOString()
                                  .split("T")[0]
                              : "未設定日期"}
                          </Typography>
                        </Box>

                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <GroupIcon fontSize="small" sx={{ mr: 1 }} />
                          <Typography variant="body2">
                            {post.estimatedParticipants ?? "0"}人
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 0.5 }}
                        >
                          來自：{post.organizationName ?? "未知組織"}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          發布時間：
                          {post.createdAt
                            ? new Date(post.createdAt).toLocaleDateString(
                                "zh-TW"
                              )
                            : "未知"}
                        </Typography>
                      </Box>

                      {/* 卡片右側區域（補充資訊區） */}
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          ml: 2,
                          width: "30%",
                        }}
                      >
                        <Box sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <InventoryIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2">需求物資</Typography>
                          </Box>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
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
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
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
                            {post.cooperationReturn ?? "未提供回饋方式"}
                          </Typography>
                        </Box>
                      </Box>

                      {/* 卡片右邊操作區 */}
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
                size="large"
              />
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}
