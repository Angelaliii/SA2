"use client";

import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import FavoriteIcon from "@mui/icons-material/Favorite";
import HandshakeIcon from "@mui/icons-material/Handshake";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import ActivityDeleteDialog from "../../components/activities/ActivityDeleteDialog";
import ActivityEditDialog from "../../components/activities/ActivityEditDialog";
import ActivityFormDialog from "../../components/activities/ActivityFormDialog";
import ArticleDeleteDialog from "../../components/article/ArticleDeleteDialog";
import ArticleEditDialog from "../../components/article/ArticleEditDialog";
import EnterpriseDeleteDialog from "../../components/article/EnterpriseDeleteDialog";
import EnterpriseEditDialog from "../../components/article/EnterpriseEditDialog";
import FavoriteArticlesManager from "../../components/article/FavoriteArticlesManager";
import CollaborationList from "../../components/collaboration/CollaborationList";
import CollaborationReviewDialog from "../../components/collaboration/CollaborationReviewDialog";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import ClubProfileForm from "../../components/profile/ClubProfileForm";
import CompanyProfileForm from "../../components/profile/CompanyProfileForm";
import LogoutButton from "../../components/profile/LogoutButton";
import SubscribedOrganizations from "../../components/profile/SubscribedOrganizations";
import SideNavbar from "../../components/SideNavbar";
import { db } from "../../firebase/config";
import { authServices } from "../../firebase/services/auth-service";
import { Club, clubServices } from "../../firebase/services/club-service";
import {
  Company,
  companyServices,
} from "../../firebase/services/company-service";
import { ClientOnly } from "../../hooks/useHydration";

function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          <div>{children}</div>
        </Box>
      )}
    </div>
  );
}

export default function Profile() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [clubData, setClubData] = useState<Club | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [userType, setUserType] = useState<"club" | "company" | "unknown">(
    "unknown"
  );
  const [selectedTag, setSelectedTag] = useState<string | null>("個人檔案");
  const [searchTerm, setSearchTerm] = useState("0");
  const drawerWidth = 240;
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  // Activity edit and delete states
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activityEditDialogOpen, setActivityEditDialogOpen] = useState(false);
  const [activityDeleteDialogOpen, setActivityDeleteDialogOpen] =
    useState(false);
  // Track auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [
    publishedEnterpriseAnnouncements,
    setPublishedEnterpriseAnnouncements,
  ] = useState<any[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [announcementEditDialogOpen, setAnnouncementEditDialogOpen] =
    useState(false);
  const [announcementDeleteDialogOpen, setAnnouncementDeleteDialogOpen] =
    useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [articleEditDialogOpen, setArticleEditDialogOpen] = useState(false);
  const [articleDeleteDialogOpen, setArticleDeleteDialogOpen] = useState(false);
  // 合作請求相關狀態
  const [selectedCollaborationId, setSelectedCollaborationId] = useState<
    string | null
  >(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  const handleOpenReview = (id: string) => {
    setSelectedCollaborationId(id);
    setReviewDialogOpen(true);
  };

  const handleCloseReview = () => {
    setReviewDialogOpen(false);
    setSelectedCollaborationId(null);
  };
  // Combine all useEffect hooks into a single one to ensure consistent order
  useEffect(() => {
    // Auth state listener
    const unsubscribe = authServices.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
    });

    // 檢查是否需要刷新文章列表
    const refreshFlag = localStorage.getItem("refreshArticles");
    if (refreshFlag === "true") {
      // 清除標記
      localStorage.removeItem("refreshArticles");
      // 延遲執行以確保頁面加載完成
      setTimeout(() => {
        if (isAuthenticated) {
          fetchPublishedArticles();
        }
      }, 500);
    }

    // Fetch user profile
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);

      const currentUser = authServices.getCurrentUser();

      if (!currentUser) {
        setError("請先登入系統");
        setLoading(false);
        return;
      }

      try {
        const allClubs = await clubServices.getAllClubs();
        const userClub = allClubs.find(
          (club) => club.userId === currentUser.uid
        );
        if (userClub) {
          setClubData(userClub);
          setUserType("club");
          setLoading(false);
          return;
        }

        const allCompanies = await companyServices.getAllCompanies();
        const userCompany = allCompanies.find(
          (company) => company.email === currentUser.email
        );
        if (userCompany) {
          setCompanyData(userCompany);
          setUserType("company");
          setLoading(false);
          return;
        }

        setError("找不到您的用戶資料，請確認您已完成註冊流程");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("載入用戶資料時發生錯誤，請稍後再試");
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchUserProfile();
    }

    // Fetch user activities
    const fetchUserActivities = async () => {
      if (value !== 3) return; // 只有當選擇了活動資訊標籤時才獲取數據

      const currentUser = authServices.getCurrentUser();
      if (!currentUser) return;

      setActivitiesLoading(true);
      try {
        const q = query(
          collection(db, "activities"),
          where("uid", "==", currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setActivities(activitiesData);
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchUserActivities(); // Fetch published articles - 優化查詢方式同時獲取兩種文章類型
    const fetchPublishedArticles = async () => {
      const currentUser = authServices.getCurrentUser();
      if (!currentUser) return;

      setLoadingArticles(true);
      try {
        // 查詢普通文章
        const postsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", currentUser.uid),
          where("isDraft", "==", false) // Only fetch published articles
        );

        // 同時查詢企業公告
        const announcementsQuery = query(
          collection(db, "enterprisePosts"),
          where("authorId", "==", currentUser.uid)
        );

        // 並行執行兩個查詢
        const [postsSnapshot, announcementsSnapshot] = await Promise.all([
          getDocs(postsQuery),
          getDocs(announcementsQuery),
        ]);

        // 處理普通文章結果
        const articles = postsSnapshot.docs.map((doc) => ({
          id: doc.id,
          source: "posts", // 標記來源以便區分
          ...doc.data(),
        }));

        // 處理企業公告結果
        const announcements = announcementsSnapshot.docs.map((doc) => ({
          id: doc.id,
          source: "enterprisePosts", // 標記來源以便區分
          ...doc.data(),
        }));

        // 更新狀態
        setPublishedArticles(articles);
        setPublishedEnterpriseAnnouncements(announcements);
      } catch (err) {
        console.error("Error fetching published content:", err);
      } finally {
        setLoadingArticles(false);
      }
    };
    fetchPublishedArticles();

    return () => unsubscribe();
  }, [isAuthenticated, value]);

  // 定義獲取已發布文章的函數
  const fetchPublishedArticles = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setLoadingArticles(true);
    try {
      // 查詢普通文章
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", currentUser.uid),
        where("isDraft", "==", false) // Only fetch published articles
      );

      // 同時查詢企業公告
      const announcementsQuery = query(
        collection(db, "enterprisePosts"),
        where("authorId", "==", currentUser.uid)
      );

      // 並行執行兩個查詢
      const [postsSnapshot, announcementsSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(announcementsQuery),
      ]);

      // 處理普通文章結果
      const articles = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "posts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 處理企業公告結果
      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "enterprisePosts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 更新狀態
      setPublishedArticles(articles);
      setPublishedEnterpriseAnnouncements(announcements);
    } catch (err) {
      console.error("Error fetching published content:", err);
    } finally {
      setLoadingArticles(false);
    }
  };

  // 添加路由監聽，當用戶從發布頁面返回時刷新資料
  useEffect(() => {
    // 當頂部標籤是「我的文章與企業公告」時執行刷新
    if (value === 1) {
      // 檢查函數存在性
      if (typeof fetchPublishedArticles === "function") {
        fetchPublishedArticles();
      }
    }
  }, [value]);

  // When searchTerm changes, update the tab index
  useEffect(() => {
    if (searchTerm) {
      setValue(parseInt(searchTerm));
    }
  }, [searchTerm]);

  // Function to refresh activities after adding a new one
  const refreshActivities = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setActivitiesLoading(true);
    try {
      const q = query(
        collection(db, "activities"),
        where("uid", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const activitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActivities(activitiesData);
    } catch (err) {
      console.error("Error refreshing activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // 當新增活動成功後重新獲取活動列表
  const handleClubProfileUpdate = async (
    updatedData: Partial<Club>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!clubData?.id) throw new Error("無法找到社團資料");
      let logoURL = clubData.logoURL;
      if (logoFile) {
        logoURL = await clubServices.uploadClubLogo(clubData.id, logoFile);
      }
      await clubServices.updateClub(clubData.id, { ...updatedData, logoURL });
      const updatedClub = await clubServices.getClubById(clubData.id);
      if (updatedClub) setClubData(updatedClub);
      setSuccess("社團資料已成功更新");
      setSnackbarOpen(true);
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Error updating club profile:", err);
      setError("更新社團資料時發生錯誤，請稍後再試");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyProfileUpdate = async (
    updatedData: Partial<Company>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!companyData?.id) throw new Error("無法找到企業資料");
      let logoURL = companyData.logoURL;
      if (logoFile) {
        logoURL = await companyServices.uploadCompanyLogo(
          companyData.id,
          logoFile
        );
      }
      await companyServices.updateCompany(companyData.id, {
        ...updatedData,
        logoURL,
      });
      const updatedCompany = await companyServices.getCompanyById(
        companyData.id
      );
      if (updatedCompany) setCompanyData(updatedCompany);
      setSuccess("企業資料已成功更新");
      setSnackbarOpen(true);
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Error updating company profile:", err);
      setError("更新企業資料時發生錯誤，請稍後再試");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Handle activity edit
  const handleEditActivity = (activity: any) => {
    setSelectedActivity(activity);
    setActivityEditDialogOpen(true);
  };

  // Handle activity delete
  const handleDeleteActivity = (activity: any) => {
    setSelectedActivity(activity);
    setActivityDeleteDialogOpen(true);
  };

  // Handle announcement edit
  const handleEditAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementEditDialogOpen(true);
  };

  // Handle announcement delete
  const handleDeleteAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementDeleteDialogOpen(true);
  };
  // 重新獲取企業公告列表 - 使用綜合刷新函數
  const refreshAnnouncements = async () => {
    await refreshAllPublishedContent();
  };

  // 重新獲取需求文章列表 - 使用綜合刷新函數
  const refreshArticles = async () => {
    await refreshAllPublishedContent();
  }; // 綜合刷新所有文章(同時刷新普通文章和企業公告)
  const refreshAllPublishedContent = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setLoadingArticles(true);
    try {
      // 查詢普通文章
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", currentUser.uid),
        where("isDraft", "==", false) // Only fetch published articles
      );

      // 同時查詢企業公告
      const announcementsQuery = query(
        collection(db, "enterprisePosts"),
        where("authorId", "==", currentUser.uid)
      );

      // 並行執行兩個查詢
      const [postsSnapshot, announcementsSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(announcementsQuery),
      ]);

      // 處理普通文章結果
      const articles = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "posts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 處理企業公告結果
      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "enterprisePosts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 更新狀態
      setPublishedArticles(articles);
      setPublishedEnterpriseAnnouncements(announcements);
      setSuccess("內容已成功刷新！");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Error refreshing published content:", err);
      setError("刷新內容時發生錯誤，請稍後再試");
      setSnackbarOpen(true);
    } finally {
      setLoadingArticles(false);
    }
  };

  // 處理需求文章編輯
  const handleEditArticle = (article: any) => {
    setSelectedArticle(article);
    setArticleEditDialogOpen(true);
  };

  // 處理需求文章刪除
  const handleDeleteArticle = (article: any) => {
    setSelectedArticle(article);
    setArticleDeleteDialogOpen(true);
  };

  // 格式化日期顯示
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "未知日期";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      console.error("Date formatting error:", err);
      return "日期格式錯誤";
    }
  };

  // Basic loading fallback that matches the client structure exactly
  const LoadingFallback = () => (
    <Box
      sx={{
        display: "flex",
        pt: "64px",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#f2f2f7",
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    </Box>
  );

  // Show loading state during auth check
  if (isAuthenticated === null) {
    return (
      <>
        <Navbar />
        <LoadingFallback />
      </>
    );
  }

  // Redirect if not authenticated
  if (isAuthenticated === false) {
    return (
      <>
        <Navbar />
        <LoginPrompt />
      </>
    );
  }

  // Return a loading state when data is still being fetched
  if (loading) {
    return (
      <>
        <Navbar />
        <LoadingFallback />
      </>
    );
  }

  // The main UI with the client-side reactive components
  return (
    <>
      <Navbar />
      <ClientOnly fallback={<LoadingFallback />}>
        <Box
          sx={{
            display: "flex",
            pt: "64px",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f2f2f7",
          }}
        >
          <SideNavbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            drawerWidth={drawerWidth}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 4 },
              width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
              ml: { xs: 0, md: `${drawerWidth}px` },
              transition: (theme) =>
                theme.transitions.create(["margin", "width"], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
            }}
          >
            <Container
              maxWidth={false}
              sx={{
                pb: 5,
                maxWidth: { xs: "100%", lg: "90%", xl: "85%" },
                transition: "max-width 0.3s ease-in-out",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  mb: 4,
                  borderRadius: 3,
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                }}
              >
                <Box ref={contentRef}>
                  {" "}
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: (theme) => theme.palette.primary.main,
                    }}
                  >
                    您的個人檔案
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Box>{" "}
                <TabPanel value={value} index={0}>
                  {userType === "club" && clubData && (
                    <>
                      <ClubProfileForm
                        clubData={clubData}
                        onSubmit={handleClubProfileUpdate}
                      />
                      <LogoutButton />
                    </>
                  )}
                  {userType === "company" && companyData && (
                    <>
                      <CompanyProfileForm
                        companyData={companyData}
                        onSubmit={handleCompanyProfileUpdate}
                      />
                      <LogoutButton />
                    </>
                  )}
                  {userType === "unknown" && (
                    <>
                      <Typography>
                        請先完成註冊流程以管理您的個人資料
                      </Typography>
                      <LogoutButton />
                    </>
                  )}
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <ArticleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      我的文章與企業公告
                    </Typography>
                  </Box>

                  {loadingArticles ? (
                    <Box textAlign="center" mt={4}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      {publishedArticles.length === 0 &&
                      publishedEnterpriseAnnouncements.length === 0 ? (
                        <Typography>
                          目前尚無已發布的文章或企業公告。
                        </Typography>
                      ) : (
                        <>
                          {publishedArticles.map((article) => (
                            <Paper
                              key={article.id}
                              sx={{
                                p: 3,
                                mb: 2,
                                borderRadius: 2,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                }}
                              >
                                <Typography variant="h6">
                                  {article.title ?? "(未命名文章)"}
                                </Typography>
                                <Box>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleEditArticle(article)}
                                    title="編輯文章"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleDeleteArticle(article)}
                                    title="刪除文章"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mt: 1,
                                  whiteSpace: "pre-line",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                }}
                              >
                                {article.demandDescription ?? "(無內容)"}
                              </Typography>
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ mt: 2 }}
                              >
                                發布日期：{formatDate(article.createdAt)}
                              </Typography>
                            </Paper>
                          ))}

                          {publishedEnterpriseAnnouncements.map(
                            (announcement) => (
                              <Paper
                                key={announcement.id}
                                sx={{
                                  p: 3,
                                  mb: 2,
                                  borderRadius: 2,
                                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                  }}
                                >
                                  <Typography variant="h6">
                                    {announcement.title ?? "(未命名公告)"}
                                  </Typography>
                                  <Box>
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() =>
                                        handleEditAnnouncement(announcement)
                                      }
                                      title="編輯公告"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() =>
                                        handleDeleteAnnouncement(announcement)
                                      }
                                      title="刪除公告"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mt: 1,
                                    whiteSpace: "pre-line",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                  }}
                                >
                                  {announcement.content || "(無內容)"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  sx={{ mt: 2 }}
                                >
                                  發布日期：{formatDate(announcement.createdAt)}
                                </Typography>
                              </Paper>
                            )
                          )}
                        </>
                      )}
                    </Box>
                  )}
                </TabPanel>{" "}
                <TabPanel value={value} index={2}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <SubscriptionsIcon
                        sx={{ mr: 1, verticalAlign: "middle" }}
                      />
                      已訂閱組織
                    </Typography>
                  </Box>
                  <SubscribedOrganizations />
                </TabPanel>
                <TabPanel value={value} index={3}>
                  {" "}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <FavoriteIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      收藏的文章
                    </Typography>
                  </Box>
                  <FavoriteArticlesManager />
                </TabPanel>
                <TabPanel value={value} index={4}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      <EventIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      活動管理
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setActivityDialogOpen(true)}
                      sx={{ mt: 2 }}
                    >
                      新增活動
                    </Button>
                  </Box>

                  {activitiesLoading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", my: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ mt: 3 }}>
                      {activities.map((activity) => (
                        <Paper
                          key={activity.id}
                          sx={{
                            p: 3,
                            mb: 2,
                            borderRadius: 2,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <Typography variant="h6">
                              {activity.title ?? activity.name}
                            </Typography>
                            <Box>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleEditActivity(activity)}
                                title="編輯活動"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteActivity(activity)}
                                title="刪除活動"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>
                          <Typography color="text.secondary" sx={{ mt: 1 }}>
                            {activity.description ?? activity.content}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            活動日期：{formatDate(activity.date)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            活動類型：{activity.type ?? "未指定"}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            參與人數：{activity.participants ?? "未指定"}
                          </Typography>
                          {activity.partnerCompany && (
                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                              合作企業：{activity.partnerCompany}
                            </Typography>
                          )}
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 2 }}
                          >
                            建立日期：{formatDate(activity.createdAt)}
                          </Typography>
                        </Paper>
                      ))}
                      {activities.length === 0 && (
                        <Typography color="text.secondary">
                          目前還沒有任何活動
                        </Typography>
                      )}
                    </Box>
                  )}
                </TabPanel>{" "}
                <TabPanel value={value} index={5}>
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{ fontWeight: "bold" }}
                    >
                      <HandshakeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
                      合作記錄與請求
                    </Typography>
                  </Box>{" "}
                  {/* 合作記錄列表 - 使用ClientOnly確保避免水合錯誤 */}
                  <ClientOnly>
                    <CollaborationList
                      onOpenReview={handleOpenReview}
                      visibleTabs={[
                        "pending",
                        "active",
                        "review",
                        "complete",
                        "cancel",
                      ]}
                    />
                  </ClientOnly>
                  {/* 顯示合作請求評價對話框 */}
                  {selectedCollaborationId && (
                    <CollaborationReviewDialog
                      open={reviewDialogOpen}
                      onClose={handleCloseReview}
                      collaborationId={selectedCollaborationId}
                    />
                  )}
                </TabPanel>
              </Paper>
            </Container>
          </Box>
        </Box>
      </ClientOnly>

      <Snackbar
        open={snackbarOpen && (!!error || !!success)}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={error ? "error" : "success"}
          sx={{ width: "100%", boxShadow: 3 }}
          onClose={() => setSnackbarOpen(false)}
        >
          {error ?? success}
        </Alert>
      </Snackbar>

      {/* 活動相關對話框 */}
      <ActivityFormDialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        onSuccess={() => {
          setActivityDialogOpen(false);
          refreshActivities();
        }}
      />

      <ActivityEditDialog
        open={activityEditDialogOpen}
        onClose={() => setActivityEditDialogOpen(false)}
        onSuccess={() => {
          setActivityEditDialogOpen(false);
          refreshActivities();
        }}
        activity={selectedActivity}
      />

      <ActivityDeleteDialog
        open={activityDeleteDialogOpen}
        onClose={() => setActivityDeleteDialogOpen(false)}
        onSuccess={() => {
          setActivityDeleteDialogOpen(false);
          refreshActivities();
        }}
        activity={selectedActivity}
      />

      {/* 企業公告相關對話框 */}
      <EnterpriseEditDialog
        open={announcementEditDialogOpen}
        onClose={() => setAnnouncementEditDialogOpen(false)}
        onSuccess={() => {
          setAnnouncementEditDialogOpen(false);
          refreshAnnouncements();
        }}
        announcement={selectedAnnouncement}
      />

      <EnterpriseDeleteDialog
        open={announcementDeleteDialogOpen}
        onClose={() => setAnnouncementDeleteDialogOpen(false)}
        onSuccess={() => {
          setAnnouncementDeleteDialogOpen(false);
          refreshAnnouncements();
        }}
        announcement={selectedAnnouncement}
      />

      {/* 需求文章相關對話框 */}
      <ArticleEditDialog
        open={articleEditDialogOpen}
        onClose={() => setArticleEditDialogOpen(false)}
        onSuccess={() => {
          setArticleEditDialogOpen(false);
          refreshAllPublishedContent();
        }}
        article={selectedArticle}
      />

      <ArticleDeleteDialog
        open={articleDeleteDialogOpen}
        onClose={() => setArticleDeleteDialogOpen(false)}
        onSuccess={() => {
          setArticleDeleteDialogOpen(false);
          refreshAllPublishedContent();
        }}
        article={selectedArticle}
      />
    </>
  );
}
