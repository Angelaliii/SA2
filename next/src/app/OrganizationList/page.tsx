"use client";

import BusinessIcon from "@mui/icons-material/Business";
import GroupsIcon from "@mui/icons-material/Groups";
import InfoIcon from "@mui/icons-material/Info";
import LanguageIcon from "@mui/icons-material/Language";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import SearchIcon from "@mui/icons-material/Search";
import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { SyntheticEvent, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { authServices } from "../../firebase/services/auth-service";
import { clubServices } from "../../firebase/services/club-service";
import { companyServices } from "../../firebase/services/company-service";
import { subscriptionServices } from "../../firebase/services/subscription-service";
import { ClientOnly } from "../../hooks/useHydration";

// 組織資料類型
interface Organization {
  id: string;
  name: string;
  type: "club" | "company";
  description?: string;
  logoURL?: string;
  createdAt?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  userId?: string; // 新增 userId 字段
  additionalInfo?: Record<string, any>; // 額外資訊，根據組織類型不同
}

export default function OrganizationListPage() {
  // 組織類型選項卡
  const [tabValue, setTabValue] = useState(0);
  // 組織資料
  const [clubs, setClubs] = useState<Organization[]>([]);
  const [companies, setCompanies] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9; // 每頁顯示9個項目，形成3x3網格
  const [firebaseStatus, setFirebaseStatus] = useState<{ status: string }>({
    status: "連線中...",
  });
  const [subscribedOrganizations, setSubscribedOrganizations] = useState<
    string[]
  >([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>("");
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);

  // 簡單的日期格式化函數，安全處理各種日期格式
  const formatDisplayDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "無日期";
    try {
      return new Date(dateString).toLocaleDateString("zh-TW");
    } catch (error) {
      console.error("日期格式化錯誤:", error);
      return "日期格式錯誤";
    }
  };
  // 處理標籤切換
  const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1); // 切換標籤時重置到第一頁
  };
  // 處理分頁變更
  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    // 滾動到頂部以便用戶查看新頁內容
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleSubscription = async (
    orgId: string,
    orgType: "club" | "company"
  ) => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) {
      setSnackbarMessage("請先登入才能訂閱組織");
      setSnackbarOpen(true);
      return;
    }

    // 檢查是否是訂閱自己的組織
    if (currentUser.uid === orgId) {
      setSnackbarMessage("無法訂閱自己的組織");
      setSnackbarOpen(true);
      return;
    }

    try {
      // 檢查是否已訂閱
      const isSubscribed = subscribedOrganizations.includes(orgId);

      if (isSubscribed) {
        // 取消訂閱
        await subscriptionServices.unsubscribeFromOrganization(
          currentUser.uid,
          orgId
        );
        setSubscribedOrganizations((prev) => prev.filter((id) => id !== orgId));
        setSnackbarMessage("已取消訂閱組織");
      } else {
        // 添加訂閱前，再次檢查是否已訂閱，避免並發操作導致重複訂閱
        const checkResult = await subscriptionServices.checkSubscription(
          currentUser.uid,
          orgId
        );
        if (checkResult) {
          console.log("已經訂閱過此組織");
          setSnackbarMessage("您已經訂閱過此組織");
        } else {
          // 添加訂閱
          const result = await subscriptionServices.subscribeToOrganization(
            currentUser.uid,
            orgId,
            orgType
          );
          // 檢查返回值，如果是 "already-subscribed" 則表示已訂閱
          if (result === "already-subscribed") {
            console.log("已經訂閱過此組織，但UI狀態不同步");
            // 更新UI以反映實際狀態
            if (!subscribedOrganizations.includes(orgId)) {
              setSubscribedOrganizations((prev) => [...prev, orgId]);
            }
            setSnackbarMessage("您已經訂閱過此組織");
          } else {
            setSubscribedOrganizations((prev) => [...prev, orgId]);
            setSnackbarMessage("已成功訂閱組織");
          }
        }
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error("訂閱處理錯誤:", error);
      setSnackbarMessage("訂閱操作失敗，請稍後再試");
      setSnackbarOpen(true);
    }
  };

  // 獲取用戶訂閱的組織列表
  const fetchSubscribedOrganizations = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) {
      setSubscribedOrganizations([]);
      return;
    }

    try {
      const subscriptions = await subscriptionServices.getUserSubscriptions(
        currentUser.uid
      );
      const subscribedIds = subscriptions.map((sub) => sub.organizationId);
      setSubscribedOrganizations(subscribedIds);
    } catch (error) {
      console.error("獲取訂閱組織時出錯:", error);
    }
  };

  // 檢查登入狀態並獲取訂閱信息
  useEffect(() => {
    const checkAuth = async () => {
      const user = authServices.getCurrentUser();
      setIsAuthenticated(!!user);

      if (user) {
        await fetchSubscribedOrganizations();
      }
    };

    checkAuth();
  }, []);

  // 從 Firebase 獲取組織資料
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        console.log("從 Firebase 獲取組織資料...");

        // 檢查 Firebase 連線狀態
        try {
          // 增加延遲以確保頁面完全載入且 Firebase 初始化
          await new Promise((resolve) => setTimeout(resolve, 500));

          // 獲取社團資料
          const clubsData = await clubServices.getAllClubs();

          // 獲取企業資料
          const companiesData = await companyServices.getAllCompanies();

          console.log("獲取的社團數量:", clubsData.length);
          console.log("獲取的企業數量:", companiesData.length); // 將社團資料轉換為統一格式
          const clubOrganizations: Organization[] = clubsData.map((club) => ({
            id: club.id,
            name: club.clubName,
            type: "club",
            description: club.clubDescription,
            logoURL: club.logoURL,
            createdAt: club.registrationDate,
            contactName: club.contactName,
            contactPhone: club.contactPhone,
            email: club.email,
            userId: club.userId, // 添加 userId 字段
            additionalInfo: {
              clubType: club.clubType,
              schoolName: club.schoolName,
              status: club.status,
            },
          })); // 將企業資料轉換為統一格式
          const companyOrganizations: Organization[] = companiesData.map(
            (company) => ({
              id: company.id,
              name: company.companyName,
              type: "company",
              description: company.companyDescription,
              logoURL: company.logoURL,
              createdAt: company.registrationDate,
              contactName: company.contactName,
              contactPhone: company.contactPhone,
              email: company.email,
              userId: company.userId, // 添加 userId 字段
              additionalInfo: {
                industryType: company.industryType,
                businessId: company.businessId,
                status: company.status,
              },
            })
          );

          // 合併並排序（依建立時間）
          const allOrganizations = [
            ...clubOrganizations,
            ...companyOrganizations,
          ].sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });

          setClubs(clubOrganizations);
          setCompanies(companyOrganizations);
          setFirebaseStatus({
            status: "連線正常",
          });
        } catch (fetchErr) {
          console.error("Firebase 資料獲取失敗:", fetchErr);
          setFirebaseStatus({
            status: "連線失敗",
          });

          // 提供更詳細的錯誤信息
          let errorMessage = "無法從 Firebase 獲取資料";
          if (fetchErr instanceof Error) {
            errorMessage = `Firebase 錯誤: ${fetchErr.message}`;
          }

          // 如果是認證錯誤，給出更具體的提示
          if (
            fetchErr instanceof Error &&
            fetchErr.message.includes("permission-denied")
          ) {
            console.error(
              "您沒有訪問此數據的權限。請確保您已登入並有權訪問組織數據。"
            );
          }
        }
      } catch (err) {
        console.error("獲取組織資料時發生錯誤:", err);

        let errorMessage = "資料載入失敗";
        if (err instanceof Error) {
          errorMessage = `資料載入失敗: ${err.message}`;
        }
      } finally {
        setLoading(false);
      }
    };

    // 設定延遲等待組件完全掛載
    const timer = setTimeout(() => {
      fetchOrganizations();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // 設置頁面標題
  useEffect(() => {
    document.title = "組織列表 - 社團企業媒合平台";
  }, []); // 根據當前標籤和搜尋詞過濾組織
  const filteredOrganizations = [...clubs, ...companies]
    .filter((org) => {
      // 過濾標籤
      if (tabValue === 1 && org.type !== "club") return false;
      if (tabValue === 2 && org.type !== "company") return false;

      // 搜尋過濾
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          org.name.toLowerCase().includes(searchLower) ||
          (org.description &&
            org.description.toLowerCase().includes(searchLower)) ||
          (org.type === "club" &&
            org.additionalInfo?.clubType
              ?.toLowerCase()
              .includes(searchLower)) ||
          (org.type === "company" &&
            org.additionalInfo?.industryType
              ?.toLowerCase()
              .includes(searchLower))
        );
      }

      return true;
    })
    // 按照創建時間排序（最新的在前面）
    .sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  // 計算總頁數
  const pageCount = Math.ceil(filteredOrganizations.length / itemsPerPage);

  // 獲取當前頁的項目
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrganizations.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

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
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 4 },
          }}
        >
          <Container maxWidth="lg" sx={{ pb: 5 }}>
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
              <Box>
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
                  組織列表
                </Typography>
                <Typography
                  variant="subtitle1"
                  color="text.secondary"
                  gutterBottom
                >
                  查看平台上的所有社團和企業組織，尋找感興趣的合作夥伴
                </Typography>
                <Divider sx={{ my: 2 }} />

                {/* 組織統計 */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-around",
                    flexWrap: "wrap",
                    py: 2,
                    mb: 2,
                    backgroundColor: "#f9fbff",
                    borderRadius: 2,
                  }}
                >
                  <Box
                    sx={{
                      textAlign: "center",
                      px: { xs: 2, md: 3 },
                      py: 1,
                    }}
                  >
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {filteredOrganizations.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      總組織數
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      textAlign: "center",
                      px: { xs: 2, md: 3 },
                      py: 1,
                    }}
                  >
                    <Typography variant="h5" color="primary" fontWeight="bold">
                      {
                        filteredOrganizations.filter(
                          (org) => org.type === "club"
                        ).length
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      社團數量
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      textAlign: "center",
                      px: { xs: 2, md: 3 },
                      py: 1,
                    }}
                  >
                    <Typography
                      variant="h5"
                      color="secondary"
                      fontWeight="bold"
                    >
                      {
                        filteredOrganizations.filter(
                          (org) => org.type === "company"
                        ).length
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      企業數量
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {/* 搜尋和過濾區域 */}
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      placeholder="搜尋組織名稱、描述或類型..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <SearchIcon
                              sx={{ color: "text.secondary", mr: 1 }}
                            />
                          ),
                        },
                      }}
                      sx={{ bgcolor: "background.paper" }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Tabs
                      value={tabValue}
                      onChange={handleTabChange}
                      aria-label="組織類型標籤"
                      sx={{ minHeight: "48px" }}
                    >
                      <Tab
                        label="所有組織"
                        icon={<BusinessIcon />}
                        iconPosition="start"
                        sx={{ minHeight: "48px" }}
                      />
                      <Tab
                        label="社團"
                        icon={<SchoolIcon />}
                        iconPosition="start"
                        sx={{ minHeight: "48px" }}
                      />
                      <Tab
                        label="企業"
                        icon={<GroupsIcon />}
                        iconPosition="start"
                        sx={{ minHeight: "48px" }}
                      />
                    </Tabs>
                  </Grid>
                </Grid>
              </Box>
              {/* 組織顯示區域 */}
              <ClientOnly>
                {loading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", my: 5 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : filteredOrganizations.length === 0 ? (
                  <Box sx={{ textAlign: "center", my: 5 }}>
                    <Typography variant="h6" color="text.secondary">
                      目前沒有符合條件的組織
                    </Typography>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {currentItems.map((org) => (
                      <Grid item xs={12} sm={6} md={4} key={org.id}>
                        <Card
                          sx={{
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            transition: "transform 0.3s, box-shadow 0.3s",
                            borderRadius: 2,
                            overflow: "hidden",
                            border: "1px solid",
                            borderColor: "divider",
                            "&:hover": {
                              transform: "translateY(-4px)",
                              boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
                            },
                          }}
                        >
                          {" "}
                          <CardActionArea
                            component={Link}
                            href={`/public-profile/${org.userId || org.id}`}
                            sx={{
                              flexGrow: 1,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "stretch",
                              height: "100%",
                            }}
                          >
                            <Box
                              sx={{
                                p: 3,
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 2,
                                }}
                              >
                                <Avatar
                                  src={org.logoURL || ""}
                                  alt={org.name}
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    mr: 2,
                                    bgcolor:
                                      org.type === "club"
                                        ? "primary.main"
                                        : "secondary.main",
                                  }}
                                >
                                  {org.type === "club" ? (
                                    <SchoolIcon />
                                  ) : (
                                    <BusinessIcon />
                                  )}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      mb: 0.5,
                                      fontWeight: 600,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      display: "-webkit-box",
                                      WebkitLineClamp: 1,
                                      WebkitBoxOrient: "vertical",
                                    }}
                                  >
                                    {org.name}
                                  </Typography>
                                  <Chip
                                    label={
                                      org.type === "club" ? "社團" : "企業"
                                    }
                                    size="small"
                                    color={
                                      org.type === "club"
                                        ? "primary"
                                        : "secondary"
                                    }
                                    sx={{ height: 20, fontSize: "0.7rem" }}
                                  />
                                </Box>
                              </Box>

                              <Divider sx={{ mb: 2 }} />

                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 2,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: "vertical",
                                  minHeight: "4.5em",
                                  flex: "1 0 auto",
                                }}
                              >
                                {org.description || "此組織尚未提供詳細介紹"}
                              </Typography>

                              <Stack
                                direction="column"
                                spacing={1}
                                sx={{ mt: "auto" }}
                              >
                                {org.type === "club" && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <SchoolIcon
                                      fontSize="small"
                                      color="primary"
                                    />
                                    <Typography variant="body2">
                                      {org.additionalInfo?.clubType ||
                                        "未指定類型"}
                                    </Typography>
                                  </Box>
                                )}
                                {org.type === "company" && (
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <LanguageIcon
                                      fontSize="small"
                                      color="secondary"
                                    />
                                    <Typography variant="body2">
                                      {org.additionalInfo?.industryType ||
                                        "未指定產業"}
                                    </Typography>
                                  </Box>
                                )}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                  }}
                                >
                                  <PeopleIcon fontSize="small" color="action" />
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    聯絡人：{org.contactName || "未提供"}
                                  </Typography>
                                </Box>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1,
                                  }}
                                >
                                  <InfoIcon
                                    fontSize="small"
                                    color="action"
                                    sx={{ mt: 0.3 }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    註冊日期：
                                    {formatDisplayDate(org.createdAt)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Box>
                          </CardActionArea>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              p: 1.5,
                              borderTop: "1px solid",
                              borderColor: "divider",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {" "}
                            {/* 只對非自己的組織顯示訂閱按鈕 */}
                            {(!authServices.getCurrentUser() ||
                              authServices.getCurrentUser()?.uid !==
                                org.id) && (
                              <Tooltip
                                title={
                                  subscribedOrganizations.includes(org.id)
                                    ? "取消訂閱"
                                    : "訂閱組織"
                                }
                              >
                                <IconButton
                                  color="primary"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSubscription(org.id, org.type);
                                  }}
                                  disabled={!isAuthenticated}
                                >
                                  {subscribedOrganizations.includes(org.id) ? (
                                    <SubscriptionsIcon
                                      sx={{ color: "primary.main" }}
                                    />
                                  ) : (
                                    <SubscriptionsIcon
                                      sx={{ color: "text.disabled" }}
                                    />
                                  )}
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </ClientOnly>{" "}
              {/* 分頁器 */}
              <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                <Pagination
                  count={pageCount}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: 2,
                    },
                  }}
                />
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
}
