"use client";

import EventIcon from "@mui/icons-material/Event";
import GroupIcon from "@mui/icons-material/Group";
import InventoryIcon from "@mui/icons-material/Inventory";
import RedeemIcon from "@mui/icons-material/Redeem";
import SearchIcon from "@mui/icons-material/Search";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import {
  Box,
  Card,
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
import { ClientOnly } from "../../../hooks/useHydration";
import {
  DocumentData,
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
import { useCallback, useEffect, useState } from "react";
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

interface PostData extends DocumentData {
  createdAt?: FirebaseTimestamp | string | Date;
}

interface FirebaseTimestamp {
  toDate: () => Date;
}

const demandItems = ["零食", "飲料", "生活用品", "戶外用品", "其他"];
const eventTypes = ["講座", "工作坊", "表演", "比賽", "展覽", "營隊", "其他"];

export default function DemandListPage() {
  // Initialize all state with consistent values
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
  const [selectedTag] = useState<string>("全部");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Helper function to format createdAt date with proper typing
  const formatCreatedAt = (data: PostData): string => {
    if (!data.createdAt) return new Date().toISOString();

    try {
      if (typeof data.createdAt === "object" && "toDate" in data.createdAt) {
        return data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === "string") {
        return data.createdAt;
      } else if (data.createdAt instanceof Date) {
        return data.createdAt.toISOString();
      }
    } catch (error) {
      console.error("Error formatting date:", error);
    }
    return new Date().toISOString();
  };

  // Memoize applyFilters to avoid dependency issues
  const applyFilters = useCallback((postList: Post[]): Post[] => {
    let filteredResults = [...postList];

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
  }, [filters, searchTerm]);

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
          const results = indexedSnapshot.docs
            .filter((doc) => !doc.data().deleted)
            .map((doc) => ({
              id: doc.id,
              title: doc.data().title ?? "(無標題)",
              ...doc.data(),
              createdAt: formatCreatedAt(doc.data()),
            } as Post));

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
        const results = snapshot.docs
          .filter((doc) => !doc.data().isDraft && !doc.data().deleted)
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: formatCreatedAt(doc.data()),
          } as Post));

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
  }, [filters, currentPage, itemsPerPage, searchTerm, applyFilters]);

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

  return (
    <>
      <Navbar />
      <ClientOnly
        fallback={
          <Box
            sx={{
              backgroundColor: "#f5f7fa",
              width: "100%",
              pt: "84px",
              pb: "40px",
              minHeight: "100vh",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"    
            }}
          >
            <CircularProgress />
          </Box>
        }
      >
        <Box
          sx={{
            backgroundColor: "#f5f7fa",
            width: "100%",
            pt: "84px",
            pb: "40px",
            minHeight: "100vh",
          }}
        >
          {/* Filter section */}
          <Container maxWidth="lg" sx={{ mb: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: "bold" }}>
                  需求文章列表
                </Typography>
                <TextField
                  placeholder="搜尋需求文章..."
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 200 }}
                />
              </Box>

              <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
                <TextField
                  select
                  label="需求物資"
                  name="selectedDemand"
                  value={filters.selectedDemand}
                  onChange={handleFilterChange}
                  sx={{ minWidth: 120 }}
                  size="small"
                >
                  <MenuItem value="">全部</MenuItem>
                  {demandItems.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="活動類型"
                  name="selectedEventType"
                  value={filters.selectedEventType}
                  onChange={handleFilterChange}
                  sx={{ minWidth: 120 }}
                  size="small"
                >
                  <MenuItem value="">全部</MenuItem>
                  {eventTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="開始日期"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />

                <TextField
                  label="結束日期"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />

                <TextField
                  label="最少參與人數"
                  type="number"
                  name="minParticipants"
                  value={filters.minParticipants}
                  onChange={handleFilterChange}
                  InputProps={{ inputProps: { min: 0 } }}
                  sx={{ width: 120 }}
                  size="small"
                />
              </Stack>
            </Paper>
          </Container>

          {/* Posts grid */}
          <Container maxWidth="lg">
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50vh",
                }}
              >
                <CircularProgress />
              </Box>
            ) : currentPosts.length === 0 ? (
              <Typography
                variant="h6"
                sx={{ textAlign: "center", color: "text.secondary", mt: 4 }}
              >
                沒有找到符合條件的需求文章
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                    lg: "repeat(4, 1fr)",
                  },
                  gap: 3,
                }}
              >
                {currentPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: (theme) => theme.shadows[4],
                        },
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      <Box sx={{ p: 2, flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          component={Link}
                          href={`/Artical/${post.id}`}
                          sx={{
                            textDecoration: "none",
                            color: "inherit",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            mb: 1,
                            "&:hover": {
                              color: "primary.main",
                            },
                          }}
                        >
                          {post.title}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          {post.organizationName}
                        </Typography>

                        <Stack spacing={1}>
                          {post.selectedDemands && post.selectedDemands.length > 0 && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <InventoryIcon
                                sx={{ fontSize: 20, color: "primary.main" }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                需求物資：{post.selectedDemands.join("、")}
                              </Typography>
                            </Box>
                          )}

                          {post.eventType && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <EventIcon
                                sx={{ fontSize: 20, color: "primary.main" }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                活動類型：{post.eventType}
                              </Typography>
                            </Box>
                          )}

                          {post.estimatedParticipants && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <GroupIcon
                                sx={{ fontSize: 20, color: "primary.main" }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                預估人數：{post.estimatedParticipants}人
                              </Typography>
                            </Box>
                          )}

                          {post.cooperationReturn && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <RedeemIcon
                                sx={{ fontSize: 20, color: "primary.main" }}
                              />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                回饋方案：{post.cooperationReturn}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      </Box>

                      <Box
                        sx={{
                          p: 2,
                          pt: 0,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          發布時間：
                          {new Date(formatCreatedAt(post)).toLocaleDateString()}
                        </Typography>
                        <IconButton
                          onClick={() => toggleFavorite(post)}
                          color={favorites[post.id] ? "primary" : "default"}
                        >
                          {favorites[post.id] ? (
                            <BookmarkIcon />
                          ) : (
                            <BookmarkBorderIcon />
                          )}
                        </IconButton>
                      </Box>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            )}

            {/* Pagination */}
            {!loading && currentPosts.length > 0 && (
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
      </ClientOnly>
    </>
  );
}
