"use client";

import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline"; // 添加 Icon
import BusinessIcon from "@mui/icons-material/Business";
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
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";
import { companyServices } from "../../../firebase/services/company-service";
import { enterpriseService } from "../../../firebase/services/enterprise-service";
import useHydration, { ClientOnly } from "../../../hooks/useHydration";

interface EnterprisePost {
  id: string;
  title: string;
  content: string;
  companyName?: string;
  email?: string;
  createdAt?: string;
  status?: string;
  authorId?: string;
  isDraft?: boolean;
  announcementType?:
    | "specialOfferPartnership"
    | "activityCooperation"
    | "internshipCooperation";
}

// 只在客戶端環境中使用 sessionStorage，改用 useHydration

export default function EnterpriseListPage() {
  const [posts, setPosts] = useState<EnterprisePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isCompany, setIsCompany] = useState(false); // 添加公司權限檢查狀態

  // 修改：添加篩選類型狀態，預設為「全部」
  const [selectedType, setSelectedType] = useState<string | null>(null);

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
        // 使用 enterpriseService 獲取資料以確保資料處理一致性
        const postsData = await enterpriseService.getAllPosts();
        setPosts(postsData as EnterprisePost[]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // 檢查當前用戶是否為企業用戶
  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsCompany(false);
        return;
      }

      try {
        // 檢查用戶是否是企業用戶
        const companies = await companyServices.getCompaniesByUserId(user.uid);
        console.log(
          "企業用戶檢查:",
          user.uid,
          "找到企業:",
          companies.length > 0 ? "是" : "否"
        );
        setIsCompany(companies.length > 0);

        // 將企業用戶狀態保存到 sessionStorage，防止頁面刷新後丟失狀態
        if (typeof window !== "undefined") {
          if (companies.length > 0) {
            sessionStorage.setItem("isCompanyUser", "true");
          } else {
            sessionStorage.removeItem("isCompanyUser");
          }
        }
      } catch (error) {
        console.error("檢查用戶類型時出錯:", error);
        setIsCompany(false);
      }
    };

    // 從伺服器獲取最新狀態
    checkUserRole();
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

  // 搜索过滤
  const filteredPosts = posts.filter((post) => {
    // 過濾掉 null 或 undefined 值和草稿文章
    if (!post || post.isDraft === true) return false;

    // 應用公告類型篩選
    if (selectedType && post.announcementType !== selectedType) {
      return false;
    }

    // 如果搜尋詞為空，顯示所有符合類型篩選的非草稿文章
    if (!searchTerm.trim()) return true;

    // 搜尋邏輯，確保即使屬性為空也能正確處理
    return (
      (post.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.content || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.companyName || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const currentPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 格式化日期 - 修改為使用ISO字符串確保伺服器端與客戶端一致
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "未知日期";
    try {
      // Use a consistent format that doesn't depend on locale settings
      const date = new Date(dateStr);
      // During hydration, return a simple string to avoid mismatches
      return date.toISOString().split("T")[0];
    } catch (e) {
      return "日期格式錯誤";
    }
  };

  // 使用 useHydration 來確保客戶端hydration完成
  const hydrated = useHydration();

  // 設置頁面標題
  useEffect(() => {
    document.title = "企業牆 - 社團企業媒合平台";
  }, []);

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
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <TextField
                sx={{ flexGrow: 1 }}
                placeholder="搜尋企業名稱或合作內容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                  ),
                }}
              />
            </Box>
          </Paper>
          {/* 公告類型篩選按鈕 */}
          <Box sx={{ mb: 4, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              公告類型篩選
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant={selectedType === null ? "contained" : "outlined"}
                onClick={() => {
                  setSelectedType(null);
                  setCurrentPage(1);
                }}
                size="medium"
              >
                全部公告
              </Button>
              <Button
                variant={
                  selectedType === "specialOfferPartnership"
                    ? "contained"
                    : "outlined"
                }
                onClick={() => {
                  setSelectedType("specialOfferPartnership");
                  setCurrentPage(1);
                }}
                size="medium"
                color="primary"
              >
                特約商店
              </Button>
              <Button
                variant={
                  selectedType === "activityCooperation"
                    ? "contained"
                    : "outlined"
                }
                onClick={() => {
                  setSelectedType("activityCooperation");
                  setCurrentPage(1);
                }}
                size="medium"
                color="secondary"
              >
                活動合作
              </Button>
              <Button
                variant={
                  selectedType === "internshipCooperation"
                    ? "contained"
                    : "outlined"
                }
                onClick={() => {
                  setSelectedType("internshipCooperation");
                  setCurrentPage(1);
                }}
                size="medium"
                color="success"
              >
                實習合作
              </Button>
            </Box>
          </Box>
          {/* 貼文列表 */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredPosts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                目前沒有符合條件的企業公告
              </Typography>
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
                  {" "}
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
                      window.location.href = `/Enterprise/${post.id}`;
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

                        {/* 顯示公告類型標籤 */}
                        {post.announcementType && (
                          <Box sx={{ mb: 1.5 }}>
                            {post.announcementType ===
                              "specialOfferPartnership" && (
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
                                  mr: 1,
                                }}
                              >
                                特約商店
                              </Button>
                            )}
                            {post.announcementType ===
                              "activityCooperation" && (
                              <Button
                                size="small"
                                variant="contained"
                                color="secondary"
                                disableElevation
                                sx={{
                                  fontSize: "0.7rem",
                                  py: 0.2,
                                  textTransform: "none",
                                  borderRadius: "12px",
                                  mr: 1,
                                }}
                              >
                                活動合作
                              </Button>
                            )}
                            {post.announcementType ===
                              "internshipCooperation" && (
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
                                  mr: 1,
                                }}
                              >
                                實習合作
                              </Button>
                            )}
                          </Box>
                        )}

                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <BusinessIcon fontSize="small" sx={{ mr: 1 }} />

                          <Link href={`/public-profile/${post.authorId}`}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "primary.main", // 藍色字
                                cursor: "pointer",
                              }}
                            >
                              {post.companyName ?? "未知企業"}
                            </Typography>
                          </Link>
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
                          <ClientOnly>
                            發布時間：{formatDate(post.createdAt?.toString())}
                          </ClientOnly>
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
                        {" "}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(post);
                          }}
                          sx={{ mb: 1 }}
                        >
                          {favorites[post.id] ? "❤️" : "🤍"}
                        </IconButton>{" "}
                        <Button
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/Enterprise/${post.id}`;
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

      {/* 浮動發布企業公告按鈕 - 只有企業用戶能看到 */}
      {isCompany && (
        <Box
          sx={{
            position: "fixed",
            bottom: 30,
            right: 30,
            zIndex: 999,
          }}
        >
          <Button
            component={Link}
            href="/Enterprise"
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
            發布企業公告
          </Button>
        </Box>
      )}
    </>
  );
}
