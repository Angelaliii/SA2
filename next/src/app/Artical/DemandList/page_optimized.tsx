"use client"; // 指定為前端元件

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // 新增圖示
import EventIcon from "@mui/icons-material/Event"; // 活動圖示
import FavoriteIcon from "@mui/icons-material/Favorite"; // 已收藏圖示
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder"; // 未收藏圖示
import SearchIcon from "@mui/icons-material/Search"; // 搜尋圖示
import {
  Alert, // 提示訊息元件
  Box, // 版面配置元件
  Button, // 按鈕元件
  Card, // 卡片元件
  CircularProgress, // 載入中動畫
  Container, // 容器元件
  IconButton, // 圖示按鈕
  InputAdornment, // 輸入框裝飾
  Pagination, // 分頁元件
  Paper, // 紙張樣式元件
  Snackbar, // 提示條元件
  Stack, // 垂直堆疊元件
  TextField, // 輸入框元件
  Typography, // 文字元件
} from "@mui/material"; // MUI 元件庫
import {
  addDoc, // 新增文件
  collection, // 取得集合
  deleteDoc, // 刪除文件
  doc, // 取得文件
  getDocs, // 取得多個文件
  orderBy, // 排序
  query, // 查詢
  where, // 條件查詢
} from "firebase/firestore"; // Firebase Firestore 函式
import { motion } from "framer-motion"; // 動畫庫
import Link from "next/link"; // Next.js 連結
import { useEffect, useState } from "react"; // React hooks
import HydratedNavbar from "../../../components/NavbarHydrated"; // 導覽列元件
import { auth, db } from "../../../firebase/config"; // Firebase 認證與資料庫
import { clubServices } from "../../../firebase/services/club-service"; // 社團服務
import { ClientOnly } from "../../../hooks/useHydration"; // 僅客戶端渲染元件
import { DemandFilters, DemandPost } from "../../../types/demand"; // 型別定義

export default function DemandListPage() { // 需求列表頁元件
  const [isMounted, setIsMounted] = useState(false); // 掛載狀態

  useEffect(() => {
    setIsMounted(true); // 設定已掛載
    document.title = "需求牆 - 社團企業媒合平台"; // 設定頁面標題
  }, []);

  const [posts, setPosts] = useState<DemandPost[]>([]); // 文章列表狀態
  const [loading, setLoading] = useState(true); // 載入狀態

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
  }); // 篩選條件

  const [demandType, setDemandType] = useState<string>(""); // 需求類型
  const [location, setLocation] = useState<string>(""); // 地點
  const [materialCategory, setMaterialCategory] = useState<string>(""); // 物資類別
  const [minAmount, setMinAmount] = useState<string>(""); // 金額下限
  const [maxAmount, setMaxAmount] = useState<string>(""); // 金額上限
  const [speakerType, setSpeakerType] = useState<string>(""); // 講師主題
  const [keywordEvent, setKeywordEvent] = useState<string>(""); // 活動關鍵字
  const [keywordOrg, setKeywordOrg] = useState<string>(""); // 組織關鍵字
  const [eventStartDate, setEventStartDate] = useState<string>(""); // 活動開始日期
  const [eventEndDate, setEventEndDate] = useState<string>(""); // 活動結束日期
  const [eventNature, setEventNature] = useState<string>(""); // 活動性質

  const [searchTerm, setSearchTerm] = useState(""); // 搜尋詞
  const [selectedTag, setSelectedTag] = useState<string>("全部"); // 選擇的標籤
  const [favorites, setFavorites] = useState<Record<string, boolean>>({}); // 收藏狀態
  const [currentPage, setCurrentPage] = useState(1); // 當前頁碼
  const itemsPerPage = 8; // 每頁顯示8筆資料
  const [isClub, setIsClub] = useState(false); // 添加社團權限檢查狀態
  const [selectedFilterType, setSelectedFilterType] = useState<string>(""); // 當前篩選類型

  const [snackbar, setSnackbar] = useState({
    open: false, // 是否開啟
    message: "", // 訊息內容
    severity: "success" as "success" | "error" | "info" | "warning", // 類型
  }); // Snackbar 通知狀態

  const handleDemandTypeClick = (type: string) => { // 點擊需求類型按鈕
    setDemandType(type === "全部" ? "" : type); // 設定需求類型
    setSelectedFilterType(type === "全部" ? "" : type); // 設定篩選類型
    setCurrentPage(1); // 重置到第一頁
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth.currentUser) return; // 未登入不查詢

      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", auth.currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const favMap: Record<string, boolean> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.postId) {
            favMap[data.postId] = true;
          } else if (data.articleId) {
            favMap[data.articleId] = true;
          }
        });

        setFavorites(favMap); // 設定收藏狀態
      } catch (err) {
        console.error("Error fetching favorites:", err);
      }
    };

    fetchFavorites();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true); // 開始載入
      try {
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

          const filteredResults = applyFilters(results);

          setPosts(filteredResults); // 設定文章
          setLoading(false); // 結束載入
          return;
        } catch (indexError) {
          console.warn("索引查詢失敗，將使用備用查詢方法:", indexError);
        }

        const backupQuery = query(
          collection(db, "posts"),
          where("postType", "==", "demand")
        );

        const snapshot = await getDocs(backupQuery);
        console.log(`備用查詢獲取到 ${snapshot.docs.length} 篇需求文章`);

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

        const filteredResults = applyFilters(results);

        setPosts(filteredResults); // 設定文章

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, demandType]);

  const filteredPosts = posts.filter((post) => {
    if (!post?.title && !post?.content) return false;

    const matchSearch =
      !searchTerm ||
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.organizationName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTag =
      selectedTag === "全部" ? true : post.purposeType === selectedTag;

    return matchSearch && matchTag;
  });

  const totalItems = filteredPosts.length; // 總筆數
  const totalPages = Math.ceil(totalItems / itemsPerPage); // 總頁數

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value); // 設定當前頁碼
    window.scrollTo({ top: 0, behavior: "smooth" }); // 捲動到頂部
  };

  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleFavorite = async (post: DemandPost) => {
    if (!auth.currentUser) {
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

      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("postId", "==", postId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        const oldQuery = query(
          collection(db, "favorites"),
          where("userId", "==", userId),
          where("articleId", "==", postId)
        );

        const oldSnapshot = await getDocs(oldQuery);

        if (oldSnapshot.empty) {
          const favoriteData = {
            userId,
            postId: postId,
            articleId: postId,
            createdAt: new Date().toISOString(),
            postType: "demand",
            title: post.title,
            content: post.content,
            organizationName: post.organizationName || "未知組織",
          };

          await addDoc(collection(db, "favorites"), favoriteData);
          setFavorites((prev) => ({ ...prev, [postId]: true }));
          setSnackbar({
            open: true,
            message: "已加入收藏",
            severity: "success",
          });
        } else {
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

  const formatCreatedAt = (data: any): string => {
    try {
      if (data.createdAt) {
        if (data.createdAt.toDate) {
          return data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === "string") {
          return data.createdAt;
        } else {
          return new Date(data.createdAt).toISOString();
        }
      }

      return "2023-01-01T00:00:00.000Z";
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return "2023-01-01T00:00:00.000Z";
    }
  };

  const applyFilters = (posts: DemandPost[]): DemandPost[] => {
    let filteredResults = [...posts];

    if (demandType) {
      filteredResults = filteredResults.filter(
        (post) => post.demandType === demandType
      );
    }

    if (filters.selectedDemand) {
      filteredResults = filteredResults.filter((post) => {
        return (
          Array.isArray(post.selectedDemands) &&
          post.selectedDemands?.includes(filters.selectedDemand)
        );
      });
    }

    if (filters.selectedEventType) {
      filteredResults = filteredResults.filter(
        (post) => post.eventType === filters.selectedEventType
      );
    }

    if (filters.selectedEventNature) {
      filteredResults = filteredResults.filter(
        (post) => post.eventNature === filters.selectedEventNature
      );
    }

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

  useEffect(() => {
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
        const clubData = await clubServices.getClubByUserId(
          auth.currentUser.uid
        );
        const isUserClub = !!clubData;
        setIsClub(isUserClub);

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
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                需求列表
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                瀏覽所有合作需求，找到適合您的合作機會
              </Typography>
            </Box>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: "12px",
              }}
            >
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

              {selectedFilterType && (
                <>
                  {selectedFilterType === "物資" && (
                    <Box sx={{ mb: 2 }}>
                      <TextField
                        fullWidth
                        select
                        label="物資類別"
                        value={materialCategory}
                        onChange={(e) => {
                          setMaterialCategory(e.target.value);
                          setCurrentPage(1);
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
                          setCurrentPage(1);
                        }}
                      />
                      <TextField
                        label="金額上限（元）"
                        type="number"
                        fullWidth
                        value={maxAmount}
                        onChange={(e) => {
                          setMaxAmount(e.target.value);
                          setCurrentPage(1);
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
                          setCurrentPage(1);
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

              <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                進階篩選
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
                <TextField
                  select
                  label="活動性質"
                  value={eventNature}
                  onChange={(e) => {
                    setEventNature(e.target.value);
                    setCurrentPage(1);
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
                    if (eventEndDate && e.target.value > eventEndDate) {
                      setEventEndDate(e.target.value);
                    }
                    setCurrentPage(1);
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
                    setCurrentPage(1);
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
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1 }}
                          >
                            回饋方式：{post.feedbackDetails || "未指定"}
                          </Typography>
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

          {isClub && (
            <Box
              sx={{
                position: "fixed",
                bottom: 30,
                right: 30,
                zIndex: 999,
                display: "block",
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
