// PublicProfilePage.tsx
"use client";

import ArticleIcon from "@mui/icons-material/Article";
import HandshakeIcon from "@mui/icons-material/Handshake";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import SideNavbar from "../../../components/SideNavbar";
import CollaborationList from "../../../components/collaboration/CollaborationList";
import ClubProfileForm from "../../../components/profile/ClubProfileForm";
import CompanyProfileForm from "../../../components/profile/CompanyProfileForm";
import { auth, db } from "../../../firebase/config";
import { subscriptionServices } from "../../../firebase/services/subscription-service";
import { getUserById } from "../../../firebase/services/user-service";

export default function PublicProfilePage() {
  const { id } = useParams();
  const [userData, setUserData] = useState<any>(null);
  const [userType, setUserType] = useState<"club" | "company" | "unknown">(
    "unknown"
  );
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>("個人檔案");
  const [searchTerm, setSearchTerm] = useState("0");
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const drawerWidth = 240;
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  // 檢查是否為當前用戶自己的資料
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      console.log("嘗試獲取組織資料，ID:", id);

      if (!id) {
        console.error("無效的組織 ID");
        setUserType("unknown");
        setLoading(false);
        return;
      }

      try {
        const data = await getUserById(id as string);
        console.log("獲取到的組織資料:", data);

        if (data) {
          setUserData(data);
          // 確保類型安全
          if (data.type === "club" || data.type === "company") {
            setUserType(data.type);
          } else {
            setUserType("unknown");
          }

          // 檢查是否為當前用戶
          if (auth.currentUser) {
            setIsCurrentUser(auth.currentUser.uid === id);
          }
        } else {
          setUserType("unknown");
          console.error("未找到對應的組織資料");
        }
      } catch (error) {
        console.error("獲取組織資料時出錯:", error);
        setUserType("unknown");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!auth.currentUser) return;

      try {
        const currentUserId = auth.currentUser.uid;
        // 使用新的訂閱服務
        const isAlreadySubscribed =
          await subscriptionServices.checkSubscription(
            currentUserId,
            id as string
          );
        setIsSubscribed(isAlreadySubscribed);
      } catch (error) {
        console.error("檢查訂閱狀態失敗:", error);
      }
    };

    checkSubscriptionStatus();
  }, [id]);

  useEffect(() => {
    const fetchActivities = async () => {
      if (selectedTag !== "活動資訊") return;
      setActivitiesLoading(true);
      try {
        const q = query(collection(db, "activities"), where("uid", "==", id));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setActivitiesLoading(false);
      }
    };
    if (id) fetchActivities();
  }, [selectedTag, id]);
  useEffect(() => {
    const fetchPublishedArticles = async () => {
      // 無論當前選中的是哪個標籤，都預先加載文章數據
      setLoadingArticles(true);
      try {
        // 定義更具體的類型
        interface ArticleType {
          id: string;
          title?: string;
          content?: string;
          demandDescription?: string;
          authorId?: string;
          postType: string;
          createdAt?: any; // Firebase 的 Timestamp 或日期字符串
          isDraft?: boolean;
        }

        // 從需求文章(posts)集合中獲取文章
        const demandsQuery = query(
          collection(db, "posts"),
          where("authorId", "==", id),
          where("isDraft", "==", false)
        );
        const demandsSnapshot = await getDocs(demandsQuery);
        console.log(`獲取到 ${demandsSnapshot.docs.length} 篇需求文章`);
        const demandArticles = demandsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          postType: "demand", // 標記為需求文章類型
        })) as ArticleType[];

        // 從企業公告(enterprisePosts)集合中獲取文章
        const enterpriseQuery = query(
          collection(db, "enterprisePosts"),
          where("authorId", "==", id),
          where("isDraft", "==", false)
        );
        const enterpriseSnapshot = await getDocs(enterpriseQuery);
        console.log(`獲取到 ${enterpriseSnapshot.docs.length} 篇企業公告`);
        const enterpriseArticles = enterpriseSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          postType: "enterprise", // 標記為企業公告類型
        })) as ArticleType[];

        // 合併兩種類型的文章並按發布時間排序
        const allArticles = [...demandArticles, ...enterpriseArticles].sort(
          (a, b) => {
            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(a.createdAt ?? 0);
            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(b.createdAt ?? 0);
            return dateB.getTime() - dateA.getTime(); // 新的排前面
          }
        );

        setPublishedArticles(allArticles);
      } catch (err) {
        console.error("Error fetching articles:", err);
      } finally {
        setLoadingArticles(false);
      }
    };

    if (id) fetchPublishedArticles();
  }, [selectedTag, id]);

  // 新增console.log追蹤變數狀態
  useEffect(() => {
    console.log("Profile page state:", {
      id,
      userType,
      authUser: auth.currentUser?.uid,
      userData: userData?.type,
    });
  }, [id, userType, userData]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Box sx={{ pt: "64px", px: 3 }}>
          <Container>
            <Typography>載入中...</Typography>
          </Container>
        </Box>
      </>
    );
  }
  const handleSubscribe = async () => {
    if (!auth.currentUser) {
      setSnackbarMessage("請先登入才能訂閱");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    // 檢查是否是訂閱自己的組織
    const currentUserId = auth.currentUser.uid;
    if (currentUserId === id) {
      setSnackbarMessage("無法訂閱自己的組織");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setSubscribing(true);
    try {
      if (isSubscribed) {
        // 使用新的服務取消訂閱
        await subscriptionServices.unsubscribeFromOrganization(
          currentUserId,
          id as string
        );
        setIsSubscribed(false);
        setSnackbarMessage("取消訂閱成功");
        setSnackbarSeverity("success");
      } else {
        // 使用新的服務添加訂閱
        const organizationType = userType === "club" ? "club" : "company";
        const targetName = getDisplayName();

        await subscriptionServices.subscribeToOrganization(
          currentUserId,
          id as string,
          organizationType as "club" | "company"
        );

        setIsSubscribed(true);
        setSnackbarMessage(`成功訂閱 ${targetName}`);
        setSnackbarSeverity("success");
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error("訂閱操作失敗:", error);
      setSnackbarMessage("操作失敗，請稍後再試");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setSubscribing(false);
    }
  };

  const getDisplayName = () => {
    if (!userData) return "使用者";

    // 根據類型挑正確欄位名稱
    if (userData.type === "club") return userData.clubName ?? "使用者";
    if (userData.type === "company") return userData.companyName ?? "使用者";

    // fallback
    return userData.name ?? "使用者";
  };

  // 格式化日期的輔助函數
  const getFormattedDate = (dateValue: any): string => {
    if (!dateValue) return "未知時間";

    if (dateValue.toDate && typeof dateValue.toDate === "function") {
      return dateValue.toDate().toLocaleDateString("zh-TW");
    }

    try {
      return new Date(dateValue).toLocaleDateString("zh-TW");
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return "未知時間";
    }
  };

  // 獲取按鈕文字的輔助函數
  const getButtonText = (): string => {
    if (subscribing) return "處理中...";
    if (isSubscribed) return "取消訂閱";
    return "訂閱";
  };
  // 移除renderArticlesContent函數，因為沒有使用到，可能是之前的編輯錯誤導致的
  // 移除renderActivitiesContent函數，因為沒有使用到

  // 渲染個人檔案部分
  const renderProfileContent = () => {
    if (userType === "club") {
      return (
        <ClubProfileForm
          clubData={userData}
          readonly
          onSubmit={async () => {}} // 提供空的onSubmit函數以滿足必要prop
        />
      );
    }

    if (userType === "company") {
      return (
        <CompanyProfileForm
          companyData={userData}
          readonly
          onSubmit={async () => {}} // 提供空的onSubmit函數以滿足必要prop
        />
      );
    }

    return <Typography>找不到使用者資料，請確認連結是否正確</Typography>;
  };

  // 渲染文章內容部分
  const renderPublishedArticlesContent = () => {
    if (loadingArticles) {
      return (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      );
    }

    if (publishedArticles.length === 0) {
      return <Typography>尚無已發佈文章</Typography>;
    }

    return renderArticlesList();
  };

  // 渲染文章部分
  const renderPublishedArticles = () => {
    return (
      <>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center" }}
        >
          <ArticleIcon sx={{ mr: 1 }} />
          已發佈文章
        </Typography>
        {renderPublishedArticlesContent()}
      </>
    );
  };

  // 渲染文章列表
  const renderArticlesList = () => {
    return publishedArticles.map((article) => (
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
          <Box sx={{ flex: 1 }}>
            <Link
              href={
                article.postType === "enterprise"
                  ? `/Enterprise/${article.id}`
                  : `/Artical/${article.id}`
              }
              passHref
            >
              <Typography
                variant="h6"
                component="span" // Changed from "a" to "span" to avoid nesting <a> tags
                sx={{
                  textDecoration: "none",
                  color: "primary.main",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {article.title ?? "(未命名文章)"}
              </Typography>
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {article.postType === "enterprise"
                ? article.content
                : article.demandDescription ?? "(無內容)"}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              發布日期：
              {getFormattedDate(article.createdAt)}
            </Typography>
          </Box>
        </Box>
        {article.postType === "demand" &&
          userType === "company" &&
          article.participationType && (
            <Box
              sx={{ mt: 2, pt: 2, borderTop: "1px solid rgba(0, 0, 0, 0.08)" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                企業參與方式：
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {article.participationType}
              </Typography>
            </Box>
          )}
      </Paper>
    ));
  };

  // 渲染活動資訊部分
  const renderActivities = () => {
    if (activitiesLoading) {
      return <CircularProgress />;
    }

    if (activities.length === 0) {
      return <Typography>尚無活動資料</Typography>;
    }

    return (
      <Box>
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
            <Link href={`/Activities/${activity.id}`} passHref>
              <Typography
                variant="h6"
                component="span" // Changed from "a" to "span" to avoid nesting <a> tags
                sx={{
                  textDecoration: "none",
                  color: "primary.main",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                {activity.title ?? activity.name}
              </Typography>
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {activity.description ?? activity.content}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
              建立日期：
              {getFormattedDate(activity.createdAt)}
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  };
  // 主要內容渲染函數 - 優化
  const renderContent = () => {
    switch (selectedTag) {
      case "個人檔案":
        return (
          <>
            {renderProfileContent()}
            {/* 在個人檔案頁面底部顯示已發佈文章 */}
            <Box sx={{ mt: 4 }}>
              <Divider sx={{ my: 3 }} />
              {renderPublishedArticles()}
            </Box>
          </>
        );
      case "已發佈文章":
        return renderPublishedArticles();
      case "活動資訊":
        return (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <ArticleIcon sx={{ mr: 1 }} />
              活動資訊
            </Typography>
            {renderActivities()}
          </>
        );
      case "合作記錄":
        return (
          <>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              <HandshakeIcon sx={{ mr: 1 }} />
              合作記錄
            </Typography>
            <CollaborationList
              userId={id as string}
              visibleTabs={["complete", "cancel"]}
            />
          </>
        );
      default:
        return null;
    }
  };

  // 檢查條件並顯示詳細的 debug 資訊
  const showSubscribeButton =
    (userType === "club" || userType === "company") &&
    !!auth.currentUser &&
    auth.currentUser.uid !== id;

  console.log("Button display conditions:", {
    userTypeCondition: userType === "club" || userType === "company",
    loggedInCondition: !!auth.currentUser,
    notSameUserCondition: auth.currentUser?.uid !== id,
    finalResult: showSubscribeButton,
  });

  return (
    <>
      <Navbar />
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
          hideTabs={["我的收藏", "已訂閱組織"]}
        />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 4 },
            width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
            ml: { xs: 0, md: `${drawerWidth}px` },
          }}
        >
          <Container sx={{ pb: 5 }}>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "50vh",
                  flexDirection: "column",
                }}
              >
                <CircularProgress size={60} />
                <Typography variant="h6" color="text.secondary" sx={{ mt: 3 }}>
                  載入組織資料中...
                </Typography>
              </Box>
            ) : !userData ? (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                  backgroundColor: "#fff",
                  textAlign: "center",
                  py: 8,
                }}
              >
                <Typography variant="h5" color="error" gutterBottom>
                  找不到組織資料
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  找不到 ID 為「{id}」的組織。請確認連結是否正確。
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  href="/OrganizationList"
                  sx={{ mt: 4 }}
                >
                  返回組織列表
                </Button>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  borderRadius: 3,
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                  backgroundColor: "#fff",
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
                  {" "}
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                  >
                    {isCurrentUser ? "您的個人檔案" : `${getDisplayName()}`}
                  </Typography>
                </Box>{" "}
                {/* 訂閱按鈕只在查看其他組織時顯示 */}
                {userData?.type && auth.currentUser && !isCurrentUser && (
                  <Button
                    variant={isSubscribed ? "outlined" : "contained"}
                    color="primary"
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    startIcon={
                      isSubscribed ? (
                        <NotificationsOffIcon />
                      ) : (
                        <NotificationsActiveIcon />
                      )
                    }
                    sx={{
                      minWidth: "120px",
                      boxShadow: isSubscribed ? "none" : 2,
                    }}
                  >
                    {getButtonText()}
                  </Button>
                )}
                {isCurrentUser && (
                  <Typography variant="subtitle1" color="primary">
                    這是您的資料頁面
                  </Typography>
                )}
                <Divider sx={{ my: 2 }} />
                {renderContent()}
              </Paper>
            )}
          </Container>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
