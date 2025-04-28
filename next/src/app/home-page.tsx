"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArticleIcon from "@mui/icons-material/Article";
import BusinessIcon from "@mui/icons-material/Business";
import EventIcon from "@mui/icons-material/Event";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../assets/globals.module.css";
import Navbar from "../components/Navbar";
import { db } from "../firebase/config";
import { formatDate, timestampToDate } from "../utils/firebaseDataUtils";

// 允許更寬鬆的型別定義
interface Post {
  id: string;
  title?: string;
  content?: string;
  postType?: string;
  author?: string;
  authorId?: string;
  organizationName?: string;
  eventDate?: any;
  estimatedParticipants?: string;
  tags?: string[];
  selectedDemands?: string[];
  createdAt?: any;
  isDraft?: boolean;
}

interface Activity {
  id: string;
  name?: string;
  content?: string;
  date?: any;
  type?: string;
  participants?: number;
  createdAt?: any;
}

interface EnterprisePost {
  id: string;
  title?: string;
  content?: string;
  createdAt?: any;
  status?: string;
}

export default function HomePage() {
  const [recentDemands, setRecentDemands] = useState<Post[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<Activity[]>([]);
  const [recentEnterprises, setRecentEnterprises] = useState<EnterprisePost[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 修改: 不使用 initialized 狀態，而是使用 isMounted 和延遲
  const [isMounted, setIsMounted] = useState(false);

  // Separate data fetching function
  const fetchRecentContent = async () => {
    try {
      console.log("Starting to fetch data...");

      // 1. 獲取需求文章 - 放寬條件
      const demandsRef = collection(db, "posts");
      const demandQuery = query(
        demandsRef,
        where("isDraft", "==", false),
        orderBy("createdAt", "desc"),
        limit(3)
      );

      const demandsSnapshot = await getDocs(demandQuery);
      const demands = demandsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: timestampToDate(data.createdAt),
        };
      });

      setRecentDemands(demands);

      // 2. 獲取活動
      const activitiesRef = collection(db, "activities");
      const activityQuery = query(
        activitiesRef,
        orderBy("createdAt", "desc"),
        limit(3)
      );

      const activitiesSnapshot = await getDocs(activityQuery);
      const activities = activitiesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          content: data.content || "",
          date: data.date,
          type: data.type,
          participants: data.participants,
          createdAt: timestampToDate(data.createdAt),
        };
      });

      setUpcomingActivities(activities);

      // 3. 獲取企業公告
      const enterpriseRef = collection(db, "enterprisePosts");
      const enterpriseQuery = query(
        enterpriseRef,
        where("isDraft", "!=", true),
        orderBy("createdAt", "desc"),
        limit(3)
      );

      const enterpriseSnapshot = await getDocs(enterpriseQuery);
      const enterprises = enterpriseSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          status: data.status,
          createdAt: timestampToDate(data.createdAt),
        };
      });

      setRecentEnterprises(enterprises);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error instanceof Error) {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 改進水合問題的關鍵修改：使用 useEffect 確保僅在客戶端執行
  useEffect(() => {
    // 標記元件已掛載（只在客戶端執行）
    setIsMounted(true);

    // 設置一個更長的延遲，以確保水合完成後再獲取數據
    const timer = setTimeout(() => {
      fetchRecentContent();
    }, 300); // 增加延遲時間以確保完全水合

    return () => clearTimeout(timer);
  }, []);

  // 優化：使用一個確定性的初始渲染，避免水合不匹配
  if (!isMounted) {
    return (
      <Box className={styles.page} suppressHydrationWarning>
        <Navbar />
        <main>
          <Box
            sx={{
              position: "relative",
              textAlign: "center",
              backgroundColor: "#f5f7fa",
              pt: { xs: 12, sm: 14 },
              pb: { xs: 10, sm: 12 },
              borderBottom: "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <Container maxWidth="lg">
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <img
                  src="/image/index_picture.png"
                  alt="首頁封面圖"
                  style={{
                    maxHeight: "350px",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
                <Box sx={{ maxWidth: "800px" }}>
                  <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
                    找資源、找合作，從這裡開始！
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "text.secondary", mb: 4 }}
                  >
                    一站式媒合平台，串聯企業與社團，共創雙贏
                  </Typography>
                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      color="primary"
                      component={Link}
                      href="/Artical/DemandList"
                      size="large"
                    >
                      瀏覽需求牆
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      component={Link}
                      href="/Enterprise/EnterpriseList"
                      size="large"
                    >
                      查看企業合作
                    </Button>
                  </Stack>
                </Box>
              </Box>
            </Container>
          </Box>
          <Box sx={{ py: { xs: 10, sm: 12 }, backgroundColor: "white" }}>
            <Container maxWidth="lg">
              <Typography
                variant="h4"
                component="h2"
                sx={{
                  fontWeight: "bold",
                  mb: { xs: 6, sm: 8 },
                  mt: { xs: 2, sm: 3 },
                  textAlign: "center",
                  color: "primary.main",
                }}
              >
                最新消息
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                      <ArticleIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h5" fontWeight="bold">
                        最新需求
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                      <EventIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h5" fontWeight="bold">
                        近期活動
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      height: "100%",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 2,
                    }}
                  >
                    <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                      <BusinessIcon sx={{ mr: 1, color: "primary.main" }} />
                      <Typography variant="h5" fontWeight="bold">
                        企業公告
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </main>
      </Box>
    );
  }

  return (
    <Box className={styles.page}>
      <Navbar />
      <main>
        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            backgroundColor: "#f5f7fa",
            pt: { xs: 12, sm: 14 },
            pb: { xs: 10, sm: 12 },
            borderBottom: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <img
                src="/image/index_picture.png"
                alt="首頁封面圖"
                style={{
                  maxHeight: "350px",
                  width: "auto",
                  objectFit: "contain",
                }}
              />
              <Box sx={{ maxWidth: "800px" }}>
                <Typography variant="h3" sx={{ fontWeight: "bold", mb: 2 }}>
                  找資源、找合作，從這裡開始！
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "text.secondary", mb: 4 }}
                >
                  一站式媒合平台，串聯企業與社團，共創雙贏
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    href="/Artical/DemandList"
                    size="large"
                  >
                    瀏覽需求牆
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={Link}
                    href="/Enterprise/EnterpriseList"
                    size="large"
                  >
                    查看企業合作
                  </Button>
                </Stack>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* 最新消息 */}
        <Box sx={{ py: { xs: 10, sm: 12 }, backgroundColor: "white" }}>
          <Container maxWidth="lg">
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: "bold",
                mb: { xs: 6, sm: 8 },
                mt: { xs: 2, sm: 3 },
                textAlign: "center",
                color: "primary.main",
              }}
            >
              最新消息
            </Typography>

            <Grid container spacing={4}>
              {/* 需求牆最新消息 */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                    <ArticleIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h5" fontWeight="bold">
                      最新需求
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : recentDemands.length > 0 ? (
                    <Stack spacing={2}>
                      {recentDemands.map((demand) => (
                        <Paper
                          key={demand.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            transition: "all 0.3s ease",
                            border: "1px solid",
                            borderColor: "divider",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            },
                          }}
                        >
                          <Box sx={{ mb: 1.5 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                color: "primary.main",
                                mb: 1,
                              }}
                            >
                              {demand.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {demand.organizationName}
                            </Typography>
                          </Box>

                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {(demand.selectedDemands ?? [])
                              .slice(0, 3)
                              .map((item: string) => (
                                <Chip
                                  key={item}
                                  label={item}
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                />
                              ))}
                          </Box>

                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Button
                              component={Link}
                              href={`/Artical/${demand.id}`}
                              size="small"
                              endIcon={<ArrowForwardIcon />}
                            >
                              查看詳情
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ p: 2, textAlign: "center" }}>
                      目前沒有需求文章
                    </Typography>
                  )}

                  <Box sx={{ mt: 3, textAlign: "right" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      component={Link}
                      href="/Artical/DemandList"
                      endIcon={<ArrowForwardIcon />}
                    >
                      查看更多需求
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* 活動牆最新消息 */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                    <EventIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h5" fontWeight="bold">
                      近期活動
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : upcomingActivities.length > 0 ? (
                    <Stack spacing={2}>
                      {upcomingActivities.map((activity) => (
                        <Paper
                          key={activity.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            transition: "all 0.3s ease",
                            border: "1px solid",
                            borderColor: "divider",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            },
                          }}
                        >
                          <Box sx={{ mb: 1.5 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                color: "primary.main",
                                mb: 1,
                              }}
                            >
                              {activity.name}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={2}
                              alignItems="center"
                            >
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatDate(
                                  activity.date
                                    ? timestampToDate(activity.date)
                                    : null
                                )}
                              </Typography>
                              <Chip
                                label={activity.type || "活動"}
                                size="small"
                                color="primary"
                              />
                            </Stack>
                          </Box>

                          <Typography variant="body2" color="text.secondary">
                            參與人數: {activity.participants || "未指定"}
                          </Typography>

                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Button
                              component={Link}
                              href={`/Activities/${activity.id}`}
                              size="small"
                              endIcon={<ArrowForwardIcon />}
                            >
                              查看詳情
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ p: 2, textAlign: "center" }}>
                      目前沒有近期活動
                    </Typography>
                  )}

                  <Box sx={{ mt: 3, textAlign: "right" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      component={Link}
                      href="/Activities"
                      endIcon={<ArrowForwardIcon />}
                    >
                      查看更多活動
                    </Button>
                  </Box>
                </Paper>
              </Grid>

              {/* 企業公告最新消息 */}
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
                    <BusinessIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography variant="h5" fontWeight="bold">
                      企業公告
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  {loading ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", p: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  ) : recentEnterprises.length > 0 ? (
                    <Stack spacing={2}>
                      {recentEnterprises.map((enterprise) => (
                        <Paper
                          key={enterprise.id}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: 2,
                            bgcolor: "background.paper",
                            transition: "all 0.3s ease",
                            border: "1px solid",
                            borderColor: "divider",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                            },
                          }}
                        >
                          <Box sx={{ mb: 1.5 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                color: "primary.main",
                                mb: 1,
                              }}
                            >
                              {enterprise.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {enterprise.companyName || "未知企業"}
                            </Typography>
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
                            {enterprise.content}
                          </Typography>

                          <Box
                            sx={{
                              mt: 2,
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <Button
                              component={Link}
                              href={`/Enterprise/${enterprise.id}`}
                              size="small"
                              endIcon={<ArrowForwardIcon />}
                            >
                              查看詳情
                            </Button>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ p: 2, textAlign: "center" }}>
                      目前沒有企業公告
                    </Typography>
                  )}

                  <Box sx={{ mt: 3, textAlign: "right" }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      component={Link}
                      href="/Enterprise/EnterpriseList"
                      endIcon={<ArrowForwardIcon />}
                    >
                      查看更多公告
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>
      </main>
    </Box>
  );
}
