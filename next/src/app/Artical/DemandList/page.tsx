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
  query,
  setDoc,
  where,
  orderBy,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
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
  eventType?: string; // 添加缺失的 eventType 欄位
  deleted?: boolean; // 添加缺失的 deleted 欄位
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
        // 使用直接的 orderBy 查詢，避免手動排序的不一致性
        // 注意：這需要 Firestore 索引支持
        try {
          // 嘗試使用複合索引查詢（如果已建立索引）
          const indexedQuery = query(
            collection(db, "posts"),
            where("postType", "==", "demand"),
            where("isDraft", "==", false),
            orderBy("createdAt", "desc")
          );
          
          const indexedSnapshot = await getDocs(indexedQuery);
          console.log(`使用索引查詢成功獲取 ${indexedSnapshot.docs.length} 篇文章`);
          
          // 轉換資料並設定到狀態
          const results = indexedSnapshot.docs
            .filter(doc => !doc.data().deleted) // 過濾掉已刪除的文章
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title || "(無標題)", // 確保 title 屬性存在
                ...data,
                // 確保 createdAt 是字串格式
                createdAt: data.createdAt ? 
                  (data.createdAt.toDate ? 
                    data.createdAt.toDate().toISOString() : 
                    typeof data.createdAt === 'string' ? 
                      data.createdAt : 
                      new Date(data.createdAt).toISOString()
                  ) : 
                  new Date().toISOString()
              } as Post; // Explicitly type the object as Post
            });
          
          console.log("使用索引直接排序的結果:");
          results.forEach((post, idx) => 
            console.log(`${idx + 1}. ${(post as Post).title} (${post.createdAt})`));
          
          // 應用額外的篩選條件
          let filteredResults = [...results];
          
          // 需求物資類型篩選
          if (filters.selectedDemand) {
            filteredResults = filteredResults.filter(post => {
              const typedPost = post as Post;
              return Array.isArray(typedPost.selectedDemands) && 
                typedPost.selectedDemands?.includes(filters.selectedDemand);
            });
            console.log(`過濾需求類型 "${filters.selectedDemand}" 後剩餘 ${filteredResults.length} 篇`);
          }
          
          // 活動類型篩選
          if (filters.selectedEventType) {
            filteredResults = filteredResults.filter(post => 
              (post as Post).eventType === filters.selectedEventType
            );
            console.log(`過濾活動類型 "${filters.selectedEventType}" 後剩餘 ${filteredResults.length} 篇`);
          }
          
          // 日期範圍篩選
          if (filters.startDate || filters.endDate) {
            filteredResults = filteredResults.filter(post => {
              if (!(post as Post).eventDate) return false;
              
              try {
                const postDate = (post as Post).eventDate ? new Date(post.eventDate as string) : new Date(NaN);
                if (isNaN(postDate.getTime())) return false;
                
                if (filters.startDate && filters.endDate) {
                  const start = new Date(filters.startDate);
                  const end = new Date(filters.endDate);
                  end.setHours(23, 59, 59, 999); // 設為當天最後一毫秒
                  return postDate >= start && postDate <= end;
                } else if (filters.startDate) {
                  const start = new Date(filters.startDate);
                  return postDate >= start;
                } else if (filters.endDate) {
                  const end = new Date(filters.endDate);
                  end.setHours(23, 59, 59, 999);
                  return postDate <= end;
                }
              } catch (e) {
                console.error("日期篩選出錯:", e);
                return false;
              }
              
              return false;
            });
            console.log(`過濾日期範圍後剩餘 ${filteredResults.length} 篇`);
          }
          
          // 參與人數篩選
          if (filters.minParticipants && filters.minParticipants !== "0") {
            filteredResults = filteredResults.filter(post => {
              try {
                const minRequired = parseInt(filters.minParticipants);
                const actual = parseInt((post as Post).estimatedParticipants || "0");
                return !isNaN(actual) && actual >= minRequired;
              } catch (e) {
                return false;
              }
            });
            console.log(`過濾最低參與人數 ${filters.minParticipants} 後剩餘 ${filteredResults.length} 篇`);
          }
          
          // 搜尋詞篩選 (如果有)
          if (searchTerm) {
            filteredResults = filteredResults.filter(post => 
              (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (post.organizationName && post.organizationName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            console.log(`搜尋「${searchTerm}」後剩餘 ${filteredResults.length} 篇`);
          }
          
          setPosts(filteredResults);
          return; // 如果索引查詢成功，就不執行後續的備用查詢
        } catch (indexError) {
          console.warn("索引查詢失敗，將使用備用查詢方法:", indexError);
        }
        
        // 備用查詢：不使用複合索引
        console.log("使用備用查詢方法...");
        const backupQuery = query(
          collection(db, "posts"),
          where("postType", "==", "demand")
        );
        
        const snapshot = await getDocs(backupQuery);
        console.log(`備用查詢獲取到 ${snapshot.docs.length} 篇需求文章`);
        
        // 將文檔資料轉換為文章物件
        let results = snapshot.docs
          .filter(doc => !doc.data().isDraft && !doc.data().deleted)
          .map((doc) => {
            const data = doc.data();
            // 處理 createdAt 欄位，確保日期格式統一
            let createdAtStr = null;
            if (data.createdAt) {
              if (data.createdAt.toDate) { // Firestore Timestamp
                createdAtStr = data.createdAt.toDate().toISOString();
              } else if (typeof data.createdAt === 'string') { // 已經是字串
                createdAtStr = data.createdAt;
              } else if (data.createdAt instanceof Date) { // Date 物件
                createdAtStr = data.createdAt.toISOString();
              } else {
                // 嘗試轉換其他可能的格式
                try {
                  createdAtStr = new Date(data.createdAt).toISOString();
                } catch (e) {
                  console.error(`無法轉換文章 ${doc.id} 的日期:`, e);
                }
              }
            }
            
            return {
              id: doc.id,
              ...data,
              createdAt: createdAtStr || new Date().toISOString() // 確保每篇文章都有 createdAt
            };
          });
        
        console.log(`過濾與轉換後的文章數: ${results.length}`);
        
        // 確保按創建時間排序（新的在上面）
        results.sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          
          try {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;
            
            return dateB - dateA;
          } catch (e) {
            console.error("排序出錯:", e);
            return 0;
          }
        });
        
        console.log("排序後前5篇文章:");
        results.slice(0, 5).forEach((post, idx) => 
          console.log(`${idx + 1}. ${(post as Post).title} (${post.createdAt})`));
        
        // 應用篩選條件
        let filteredResults = [...results];
        
        // 需求物資類型篩選
        if (filters.selectedDemand) {
          filteredResults = filteredResults.filter((post: Post) => 
            Array.isArray(post.selectedDemands) && 
            post.selectedDemands?.includes(filters.selectedDemand)
          );
        }
        
        // 活動類型篩選
        if (filters.selectedEventType) {
          filteredResults = filteredResults.filter(post => 
            (post as Post).eventType === filters.selectedEventType
          );
        }
        
        // 日期範圍篩選
        if (filters.startDate || filters.endDate) {
          filteredResults = filteredResults.filter(post => {
            if (!(post as Post).eventDate) return false;
            
            try {
              const postDate = new Date((post as Post).eventDate ?? NaN);
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
            } catch (e) {
              return false;
            }
            
            return false;
          });
        }
        
        // 參與人數篩選
        if (filters.minParticipants && filters.minParticipants !== "0") {
          filteredResults = filteredResults.filter(post => {
            try {
              const minRequired = parseInt(filters.minParticipants);
              const actual = parseInt((post as Post).estimatedParticipants || "0");
              return !isNaN(actual) && actual >= minRequired;
            } catch (e) {
              return false;
            }
          });
        }
        
        setPosts(filteredResults);
        
        // 重置頁碼（如果必要）
        if (filteredResults.length > 0 && 
            Math.ceil(filteredResults.length / itemsPerPage) < currentPage) {
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

  // 篩選貼文
  const filteredPosts = posts.filter((post: Post) => {
    // 必須有標題或內容
    if (!post?.title && !post?.content) return false;

    // 搜尋詞篩選 - 更精確的字串匹配
    const matchSearch = !searchTerm || (
      (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.organizationName && post.organizationName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 標籤篩選
    const matchTag = selectedTag === "全部" ? true : (
      Array.isArray(post.selectedDemands) && 
      post.selectedDemands.includes(selectedTag || "")
    );

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
                <Typography variant="body2" color="text.secondary" paragraph>
                  {searchTerm || filters.selectedDemand || filters.selectedEventType || filters.startDate || filters.endDate || filters.minParticipants ? 
                    "沒有找到符合篩選條件的需求文章，請嘗試調整篩選條件" : 
                    "目前還沒有任何需求文章"}
                </Typography>
                {(searchTerm || filters.selectedDemand || filters.selectedEventType || filters.startDate || filters.endDate || filters.minParticipants) && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={() => {
                      setSearchTerm('');
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
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          來自：{post.organizationName ?? "未知組織"}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary">
                          發布時間：{post.createdAt ? new Date(post.createdAt).toLocaleDateString("zh-TW") : "未知"}
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
