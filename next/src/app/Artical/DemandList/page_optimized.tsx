"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EventIcon from "@mui/icons-material/Event";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SearchIcon from "@mui/icons-material/Search";
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import HydratedNavbar from "../../../components/NavbarHydrated";
import { auth, db } from "../../../firebase/config";
import { clubServices } from "../../../firebase/services/club-service";
import { ClientOnly } from "../../../hooks/useHydration";
import { DemandFilters, DemandPost } from "../../../types/demand";

export default function DemandListPage() {
  // 首先分離 Material-UI 樣式創建
  const [isMounted, setIsMounted] = useState(false);

  // 在客戶端掛載完成後設置標誌
  useEffect(() => {
    setIsMounted(true);
    document.title = "需求牆 - 社團企業媒合平台";
  }, []);

  const [posts, setPosts] = useState<DemandPost[]>([]);
  const [loading, setLoading] = useState(true);

  // 使用完整的 DemandFilters 類型
  const [filters, setFilters] = useState<DemandFilters>({
    selectedDemand: "",
    selectedEventType: "",
    selectedEventNature: "",
    startDate: "",
    endDate: "",
    minParticipants: "",
    itemType: "",
    moneyMinAmount: "",
    moneyMaxAmount: "",
    speakerType: "",
  });

  // 新增篩選條件的狀態
  const [demandType, setDemandType] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [materialCategory, setMaterialCategory] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [speakerType, setSpeakerType] = useState<string>("");
  const [keywordEvent, setKeywordEvent] = useState<string>("");
  const [keywordOrg, setKeywordOrg] = useState<string>("");
  const [eventStartDate, setEventStartDate] = useState<string>("");
  const [eventEndDate, setEventEndDate] = useState<string>("");
  const [eventNature, setEventNature] = useState<string>("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("全部");
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 每頁顯示8筆資料
  const [isClub, setIsClub] = useState(false); // 添加社團權限檢查狀態
  // 分別篩選收起
  const [selectedFilterType, setSelectedFilterType] = useState<string>("");

  // Snackbar 通知狀態
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning",
  });

  const handleDemandTypeClick = (type: string) => {
    setDemandType(type === "全部" ? "" : type);
    setSelectedFilterType(type === "全部" ? "" : type);
    setCurrentPage(1); // 重置到第一頁
  };

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
          // 同時支持 postId 和 articleId 字段
          if (data.postId) {
            favMap[data.postId] = true;
          } else if (data.articleId) {
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
          const results: DemandPost[] = indexedSnapshot.docs
            .filter((doc) => !doc.data().deleted)
            .map((doc) => {
              const data = doc.data();
              return {
                id: doc.id,
                title: data.title ?? "(無標題)",
                ...data,
                createdAt: formatCreatedAt(data),
              } as DemandPost;
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
        const results: DemandPost[] = snapshot.docs
          .filter((doc) => !doc.data().isDraft && !doc.data().deleted)
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: formatCreatedAt(data),
            } as DemandPost;
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
  }, [filters, currentPage, itemsPerPage, searchTerm, demandType]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setCurrentPage(1); // 重置到第一頁
  };

  // 當搜尋詞變化時也重置頁碼
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, demandType]);

  // Filter posts
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
      selectedTag === "全部" ? true : post.purposeType === selectedTag;

    return matchSearch && matchTag;
  });

  // Calculate pagination
  const totalItems = filteredPosts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle page change
  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get current page data
  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Toggle favorite
  const toggleFavorite = async (post: DemandPost) => {
    if (!auth.currentUser) {
      // 使用 Snackbar 通知替代 alert
      setSnackbar({
        open: true,
        message: "請先登入後再收藏文章",
        severity: "info",
      });
      return;
    }

    try {
      const postId = post.id;
      const userId = auth.currentUser.uid;

      // 同時檢查 articleId 和 postId 字段
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("postId", "==", postId)
      );

      const snapshot = await getDocs(q);

      // 如果沒找到，再檢查舊版的 articleId 欄位
      if (snapshot.empty) {
        const oldQuery = query(
          collection(db, "favorites"),
          where("userId", "==", userId),
          where("articleId", "==", postId)
        );

        const oldSnapshot = await getDocs(oldQuery);

        if (oldSnapshot.empty) {
          // 不在收藏中 -> 添加到收藏
          const favoriteData = {
            userId,
            postId: postId, // 使用新字段
            articleId: postId, // 保留舊字段以兼容
            createdAt: new Date().toISOString(),
            postType: "demand",
            title: post.title,
            content: post.content,
            organizationName: post.organizationName || "未知組織",
          };

          await addDoc(collection(db, "favorites"), favoriteData);
          setFavorites((prev) => ({ ...prev, [postId]: true }));
          // 顯示已加入收藏的通知
          setSnackbar({
            open: true,
            message: "已加入收藏",
            severity: "success",
          });
        } else {
          // 已在收藏中 (舊格式) -> 移除
          const favoriteDoc = oldSnapshot.docs[0];
          await deleteDoc(doc(db, "favorites", favoriteDoc.id));
          setFavorites((prev) => {
            const newFavorites = { ...prev };
            delete newFavorites[postId];
            return newFavorites;
          });
          setSnackbar({
            open: true,
            message: "已從收藏中移除",
            severity: "info",
          });
        }
      } else {
        // 已在收藏中 -> 移除
        const favoriteDoc = snapshot.docs[0];
        await deleteDoc(doc(db, "favorites", favoriteDoc.id));
        setFavorites((prev) => {
          const newFavorites = { ...prev };
          delete newFavorites[postId];
          return newFavorites;
        });
        setSnackbar({
          open: true,
          message: "已從收藏中移除",
          severity: "info",
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setSnackbar({
        open: true,
        message: "操作失敗，請稍後再試",
        severity: "error",
      });
    }
  };

  // 在组件顶部添加一个更可靠的格式化函數
  const formatCreatedAt = (data: any): string => {
    try {
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          // Firestore Timestamp
          return data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === "string") {
          // 已經是字符串格式
          return data.createdAt;
        } else {
          // 其他日期對象
          return new Date(data.createdAt).toISOString();
        }
      }

      // 默認日期 - 使用固定日期而不是當前時間避免hydration不匹配
      return "2023-01-01T00:00:00.000Z";
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return "2023-01-01T00:00:00.000Z"; // 錯誤時使用固定日期
    }
  };

  // Helper function to apply filters to posts
  const applyFilters = (posts: DemandPost[]): DemandPost[] => {
    let filteredResults = [...posts];

    // ✅ 篩選：贊助類型（物資／金錢／講師）
    if (demandType) {
      filteredResults = filteredResults.filter(
        (post) => post.demandType === demandType
      );
    }

    // 篩選：selectedDemand
    if (filters.selectedDemand) {
      filteredResults = filteredResults.filter((post) => {
        return (
          Array.isArray(post.selectedDemands) &&
          post.selectedDemands?.includes(filters.selectedDemand)
        );
      });
    }

    // 篩選：eventType
    if (filters.selectedEventType) {
      filteredResults = filteredResults.filter(
        (post) => post.eventType === filters.selectedEventType
      );
    }

    // 篩選：eventNature
    if (filters.selectedEventNature) {
      filteredResults = filteredResults.filter(
        (post) => post.eventNature === filters.selectedEventNature
      );
    }

    // 篩選：活動日期範圍
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

    // 篩選：參與人數
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

    // 篩選：關鍵字
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

  // 檢查用戶角色
  useEffect(() => {
    // 首先檢查 sessionStorage 中是否有保存的狀態
    if (typeof window !== "undefined") {
      const savedClubStatus = sessionStorage.getItem("isClub");
      if (savedClubStatus) {
        setIsClub(savedClubStatus === "true");
        return;
      }
    }

    const checkClubRole = async () => {
      if (!auth.currentUser) {
        setIsClub(false);
        return;
      }

      try {
        // 使用 getClubByUserId 方法代替不存在的 checkIfUserHasClub 方法
        const clubData = await clubServices.getClubByUserId(
          auth.currentUser.uid
        );
        const isUserClub = !!clubData; // 轉換為布爾值
        setIsClub(isUserClub);

        // 保存到 sessionStorage 以避免重複檢查
        if (typeof window !== "undefined") {
          sessionStorage.setItem("isClub", isUserClub ? "true" : "false");
        }
      } catch (error) {
        console.error("檢查用戶角色出錯:", error);
        setIsClub(false);
      }
    };

    checkClubRole();
  }, []);

  // 清除所有篩選器
  const clearAllFilters = () => {
    setSearchTerm("");
    setDemandType("");
    setSelectedFilterType("");
    setMaterialCategory("");
    setMinAmount("");
    setMaxAmount("");
    setSpeakerType("");
    setKeywordEvent("");
    setKeywordOrg("");
    setEventStartDate("");
    setEventEndDate("");
    setEventNature("");
    setFilters({
      selectedDemand: "",
      selectedEventType: "",
      selectedEventNature: "",
      startDate: "",
      endDate: "",
      minParticipants: "",
      itemType: "",
      moneyMinAmount: "",
      moneyMaxAmount: "",
      speakerType: "",
    });
  };

  return (
    <ClientOnly>
      <HydratedNavbar />
      {!isMounted ? (
        // 靜態加載骨架，避免 Material UI 組件在掛載前渲染
        <Box
          sx={{
            backgroundColor: "#f5f7fa",
            width: "100%",
            pt: "84px",
            pb: "40px",
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <Box
          sx={{
            backgroundColor: "#f5f7fa",
            width: "100%",
            pt: "84px",
            pb: "40px",
            minHeight: "100vh",
          }}
        >
          <Container maxWidth="lg">
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
              {/* 🔍 搜尋需求欄位在最上方 */}
              <TextField
                fullWidth
                placeholder="搜尋文章…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />

              {/* 🔘 類型篩選按鈕 */}
              <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                {["全部", "物資", "金錢", "講師"].map((type) => (
                  <Button
                    key={type}
                    variant={
                      demandType === type ||
                      (type === "全部" && demandType === "")
                        ? "contained"
                        : "outlined"
                    }
                    color={
                      type === "金錢"
                        ? "error"
                        : type === "講師"
                        ? "success"
                        : "primary"
                    }
                    onClick={() => handleDemandTypeClick(type)}
                  >
                    {type}
                  </Button>
                ))}
              </Box>

              {/* ⛔ 尚未選擇任何類型時不顯示表單 */}
              {selectedFilterType && (
                <>
                  {/* ✅ 以下根據 selectedFilterType 顯示對應篩選表單 */}
                  {selectedFilterType === "物資" && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        select
                        label="物資類別"
                        value={materialCategory}
                        onChange={(e) => {
                          setMaterialCategory(e.target.value);
                          setCurrentPage(1); // 重置到第一頁
                        }}
                        SelectProps={{ native: true }}
                      >
                        <option value=""></option>
                        {["飲料", "食物", "生活用品", "戶外用品", "其他"].map(
                          (option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          )
                        )}
                      </TextField>
                    </Box>
                  )}

                  {selectedFilterType === "金錢" && (
                    <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                      <TextField
                        label="金額下限（元）"
                        type="number"
                        fullWidth
                        value={minAmount}
                        onChange={(e) => {
                          setMinAmount(e.target.value);
                          setCurrentPage(1); // 重置到第一頁
                        }}
                      />
                      <TextField
                        label="金額上限（元）"
                        type="number"
                        fullWidth
                        value={maxAmount}
                        onChange={(e) => {
                          setMaxAmount(e.target.value);
                          setCurrentPage(1); // 重置到第一頁
                        }}
                      />
                    </Box>
                  )}

                  {selectedFilterType === "講師" && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        select
                        fullWidth
                        label="講師主題"
                        value={speakerType}
                        onChange={(e) => {
                          setSpeakerType(e.target.value);
                          setCurrentPage(1); // 重置到第一頁
                        }}
                        SelectProps={{ native: true }}
                      >
                        <option value=""></option>
                        {[
                          "專業技能（如行銷、程式）",
                          "職涯分享",
                          "產業趨勢",
                          "其他",
                        ].map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </TextField>
                    </Box>
                  )}
                </>
              )}

              {/* 📅 進階篩選 - 活動時間 */}
              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                進階篩選
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                {/* 篩選：活動性質 */}
                <TextField
                  select
                  label="活動性質"
                  value={eventNature}
                  onChange={(e) => {
                    setEventNature(e.target.value);
                    setCurrentPage(1); // 重置到第一頁
                  }}
                  sx={{ flexGrow: 1, minWidth: "200px" }}
                  SelectProps={{ native: true }}
                >
                  <option value=""></option>
                  {["迎新", "講座", "比賽", "營隊", "其他"].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </TextField>{" "}
                <TextField
                  fullWidth
                  type="date"
                  label="活動開始日期"
                  value={eventStartDate}
                  onChange={(e) => {
                    setEventStartDate(e.target.value);
                    // 如果結束日期已經設定，且新的開始日期晚於結束日期，則自動更新結束日期
                    if (eventEndDate && e.target.value > eventEndDate) {
                      setEventEndDate(e.target.value);
                    }
                    setCurrentPage(1); // 重置到第一頁
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: eventEndDate || undefined,
                  }}
                  helperText={
                    eventStartDate && eventStartDate > eventEndDate
                      ? "開始日期不能晚於結束日期"
                      : ""
                  }
                  error={
                    !!(
                      eventStartDate &&
                      eventEndDate &&
                      eventStartDate > eventEndDate
                    )
                  }
                  sx={{ flexGrow: 1, minWidth: "200px" }}
                />
                <TextField
                  fullWidth
                  type="date"
                  label="活動結束日期"
                  value={eventEndDate}
                  onChange={(e) => {
                    setEventEndDate(e.target.value);
                    setCurrentPage(1); // 重置到第一頁
                  }}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: eventStartDate || undefined,
                  }}
                  helperText={
                    eventStartDate && eventStartDate > eventEndDate
                      ? "結束日期不能早於開始日期"
                      : ""
                  }
                  error={!!(eventStartDate && eventStartDate > eventEndDate)}
                  sx={{ flexGrow: 1, minWidth: "200px" }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="最少參與人數"
                  value={filters.minParticipants}
                  onChange={handleFilterChange}
                  name="minParticipants"
                  sx={{ flexGrow: 1, minWidth: "150px" }}
                />
              </Box>

              {/* 清除篩選按鈕 */}
              {(searchTerm ||
                filters.selectedDemand ||
                filters.selectedEventType ||
                filters.startDate ||
                filters.endDate ||
                filters.minParticipants ||
                demandType) && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={clearAllFilters}
                  sx={{ mt: 2 }}
                >
                  清除所有篩選條件
                </Button>
              )}
            </Paper>
            {/* 文章列表 */}
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
                    找不到符合的需求
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchTerm ||
                    filters.selectedDemand ||
                    filters.selectedEventType ||
                    filters.startDate ||
                    filters.endDate ||
                    filters.minParticipants ||
                    demandType
                      ? "沒有找到符合篩選條件的需求文章，請嘗試調整篩選條件"
                      : "目前還沒有任何需求文章"}
                  </Typography>
                  {(searchTerm ||
                    filters.selectedDemand ||
                    filters.selectedEventType ||
                    filters.startDate ||
                    filters.endDate ||
                    filters.minParticipants ||
                    demandType) && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={clearAllFilters}
                      sx={{ mt: 2 }}
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
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        window.location.href = `/Artical/${post.id}`;
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        {/* 主資訊區 */}
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
                            sx={{
                              mb: 1.5,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {/* 活動性質標籤 */}
                            {post.eventNature && (
                              <Button
                                size="small"
                                variant="contained"
                                color="info"
                                disableElevation
                                sx={{
                                  fontSize: "0.7rem",
                                  py: 0.2,
                                  textTransform: "none",
                                  borderRadius: "12px",
                                }}
                              >
                                {post.eventNature || "一般活動"}
                              </Button>
                            )}

                            {/* 需求類型標籤 */}
                            {post.demandType === "物資" && (
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                disableElevation
                                sx={{
                                  fontSize: "0.7rem",
                                  py: 0.2,
                                  textTransform: "none",
                                  borderRadius: "12px",
                                }}
                              >
                                物資需求
                              </Button>
                            )}
                            {post.demandType === "金錢" && (
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                disableElevation
                                sx={{
                                  fontSize: "0.7rem",
                                  py: 0.2,
                                  textTransform: "none",
                                  borderRadius: "12px",
                                }}
                              >
                                資金需求
                              </Button>
                            )}
                            {post.demandType === "講師" && (
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disableElevation
                                sx={{
                                  fontSize: "0.7rem",
                                  py: 0.2,
                                  textTransform: "none",
                                  borderRadius: "12px",
                                }}
                              >
                                講師需求
                              </Button>
                            )}
                          </Box>
                          {/* 組織名稱 */}
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Link
                              href={
                                post.authorId
                                  ? `/public-profile/${post.authorId}`
                                  : "#"
                              }
                              style={{ textDecoration: "none" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Typography
                                variant="subtitle1"
                                color="text.primary"
                                sx={{
                                  cursor: "pointer",
                                  fontWeight: "medium",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                              >
                                {post.organizationName || "未知組織"}
                              </Typography>
                            </Link>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ ml: 2 }}
                            >
                              預估參與人數：{post.estimatedParticipants ?? "0"}
                              人
                            </Typography>
                          </Box>
                          {/* 需求詳情 */}
                          {post.demandType === "物資" && (
                            <Typography variant="body2" color="text.secondary">
                              物資類型：
                              {post.itemType
                                ? post.itemType
                                : post.customItems &&
                                  post.customItems.length > 0
                                ? post.customItems.join(", ")
                                : "未指定"}
                            </Typography>
                          )}
                          {post.demandType === "金錢" && (
                            <Typography variant="body2" color="text.secondary">
                              金額區間：{post.moneyLowerLimit || "未指定"} -{" "}
                              {post.moneyUpperLimit || "未指定"} 元
                            </Typography>
                          )}
                          {post.demandType === "講師" && (
                            <Typography variant="body2" color="text.secondary">
                              講師類型：{post.speakerType || "未指定"}
                            </Typography>
                          )}{" "}
                          {/* 活動時間 */}{" "}
                          <Box
                            sx={{
                              mt: 1,
                              display: "flex",
                              alignItems: "center",
                            }}
                          >
                            <EventIcon fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              活動日期：
                              {post.eventStart &&
                              post.eventStart !== "undefined" &&
                              post.eventStart !== "null"
                                ? new Date(post.eventStart).toLocaleDateString(
                                    "zh-TW",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    }
                                  ) +
                                  (post.eventEnd &&
                                  post.eventEnd !== "undefined" &&
                                  post.eventEnd !== "null"
                                    ? " ~ " +
                                      new Date(
                                        post.eventEnd
                                      ).toLocaleDateString("zh-TW", {
                                        year: "numeric",
                                        month: "2-digit",
                                        day: "2-digit",
                                      })
                                    : "")
                                : post.eventDate &&
                                  post.eventDate !== "undefined" &&
                                  post.eventDate !== "null"
                                ? new Date(post.eventDate).toLocaleDateString(
                                    "zh-TW",
                                    {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    }
                                  )
                                : "未設定"}
                            </Typography>
                          </Box>
                          {/* 回饋方式 */}
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            回饋方式：{post.feedbackDetails || "未指定"}
                          </Typography>
                          {/* 截止時間 */}{" "}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 1 }}
                          >
                            贊助截止時間：
                            {post.sponsorDeadline
                              ? new Date(post.sponsorDeadline)
                                  .toISOString()
                                  .split("T")[0]
                              : "未設定"}
                          </Typography>
                        </Box>

                        {/* 右側操作區 */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "flex-end",
                            ml: 2,
                          }}
                        >
                          {" "}
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(post);
                            }}
                            sx={{ mb: 1 }}
                          >
                            {favorites[post.id] ? (
                              <FavoriteIcon color="primary" />
                            ) : (
                              <FavoriteBorderIcon />
                            )}
                          </IconButton>
                          <Button
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/Artical/${post.id}`;
                            }}
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
            </Stack>{" "}
            {/* 分頁控制 */}
            {!loading && filteredPosts.length > 0 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                {" "}
                <Pagination
                  count={Math.ceil(filteredPosts.length / itemsPerPage)}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </Container>

          {/* 浮動發布需求按鈕 - 只有社團用戶能看到 */}
          {isClub && (
            <Box
              sx={{
                position: "fixed",
                bottom: 30,
                right: 30,
                zIndex: 999,
                display: "block", // 確保按鈕一定顯示
              }}
            >
              <Button
                component={Link}
                href="/Artical"
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddCircleOutlineIcon />}
                sx={{
                  borderRadius: 30,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  "&:hover": {
                    boxShadow: "0 6px 25px rgba(0,0,0,0.15)",
                    transform: "translateY(-2px)",
                    transition: "all 0.3s ease",
                  },
                  px: 3,
                  py: 1.5,
                }}
              >
                發布需求
              </Button>
            </Box>
          )}

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              severity={snackbar.severity}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Box>
      )}
    </ClientOnly>
  );
}
