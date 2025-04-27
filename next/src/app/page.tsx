"use client";

import ArticleIcon from "@mui/icons-material/Article";
import EventIcon from "@mui/icons-material/Event";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Typography,
} from "@mui/material";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../assets/globals.module.css";
import Navbar from "../components/Navbar";
import { db } from "../firebase/config";

// Add proper interface for the post data
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
  createdAt?: any;
  isDraft?: boolean;
}

export default function Index() {
  const [recentDemands, setRecentDemands] = useState<Post[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDemandsAndActivities = async () => {
      setLoading(true);
      try {
        // Fetch recent demands
        const demandsQuery = query(
          collection(db, "posts"),
          where("isDraft", "==", false),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const demandsSnapshot = await getDocs(demandsQuery);
        // Filter for demands in JavaScript instead
        const demands = demandsSnapshot.docs
          .map(
            (doc) =>
              ({
                id: doc.id,
                ...doc.data(),
              } as Post)
          )
          .filter((post) => post.postType === "demand")
          .slice(0, 3);
        setRecentDemands(demands);

        // Fetch upcoming activities
        const now = Timestamp.now();
        const activitiesQuery = query(
          collection(db, "activities"),
          where("date", ">=", now),
          orderBy("date", "asc"),
          limit(3)
        );

        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activities = activitiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUpcomingActivities(activities);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentDemandsAndActivities();
  }, []);

  return (
    <Box className={styles.page}>
      <Navbar />

      <main>
        {/* 封面區塊 */}
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            mb: 6,
            pt: { xs: 14, sm: 16 }, // 增加頂部距離，為navbar預留更多空間
            pb: 5,
            maxWidth: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background:
              "linear-gradient(180deg, rgba(236,246,253,1) 0%, rgba(255,255,255,1) 100%)",
            borderRadius: { xs: 0, md: "0 0 24px 24px" },
            boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
          }}
        >
          <img
            src="/image/index_picture.png"
            alt="首頁封面圖"
            style={{
              maxHeight: "240px",
              objectFit: "contain",
              marginBottom: "24px",
              animation: "float 6s ease-in-out infinite",
            }}
          />
          <Box sx={{ maxWidth: "90%", mx: "auto" }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                fontSize: { xs: "1.8rem", sm: "2.5rem" },
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 2,
              }}
            >
              找資源、找合作，從這裡開始！
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mt: 1.5,
                mb: 3,
                fontSize: { xs: "1rem", sm: "1.1rem" },
                color: "text.secondary",
                maxWidth: "80%",
                mx: "auto",
              }}
            >
              一站式媒合平台，串聯企業與社團，共創雙贏
            </Typography>
            <Box
              sx={{
                mt: 2,
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "center",
                gap: 2,
                width: "100%",
                maxWidth: "400px",
                mx: "auto",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                component={Link}
                href="/Artical/DemandList"
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: "50px",
                  boxShadow: "0 4px 10px rgba(33, 150, 243, 0.3)",
                  fontSize: "1rem",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                瀏覽需求牆
              </Button>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                href="/Profile"
                sx={{
                  px: 4,
                  py: 1.2,
                  borderRadius: "50px",
                  fontSize: "1rem",
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                個人資料
              </Button>
            </Box>
          </Box>
        </Box>

        {/* 最新公告區塊 */}
        <Container
          maxWidth="lg"
          sx={{
            mb: 8,
            mt: 2,
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Grid container spacing={4}>
            {/* 最新需求牆文章 */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    color: "primary.main",
                  }}
                >
                  <ArticleIcon sx={{ mr: 1 }} />
                  最新需求
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recentDemands.length > 0 ? (
                recentDemands.map((demand) => (
                  <Card
                    key={demand.id}
                    variant="outlined"
                    sx={{
                      mb: 3,
                      transition: "0.3s",
                      "&:hover": {
                        boxShadow: 3,
                        transform: "translateY(-2px)",
                      },
                      borderRadius: 2,
                      overflow: "hidden", // 改為 hidden 以處理溢出內容
                      height: "220px", // 設置固定高度
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: "100%",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        pb: 1,
                        px: 2.5,
                        pt: 2,
                        overflow: "hidden", // 確保內容不會溢出
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1,
                          fontSize: { xs: "1rem", sm: "1.1rem" },
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {demand.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          color: "text.secondary",
                          fontWeight: 500,
                        }}
                      >
                        {demand.organizationName ?? "未知組織"}
                      </Typography>{" "}
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.8,
                          maxHeight: "32px", // 限制標籤區域高度
                          overflow: "hidden", // 超出的標籤將被隱藏
                        }}
                      >
                        {(demand.selectedDemands ?? [])
                          .slice(0, 2) // 最多顯示2個標籤以節省空間
                          .map((item: string, i: number) => (
                            <Chip
                              key={i}
                              label={item}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{
                                maxWidth: "100%",
                                overflow: "hidden",
                                borderRadius: "16px",
                                fontSize: "0.75rem",
                              }}
                            />
                          ))}{" "}
                        {(demand.selectedDemands ?? []).length > 2 && (
                          <Chip
                            label={`+${
                              (demand.selectedDemands ?? []).length - 2
                            }`}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderRadius: "16px",
                            }}
                          />
                        )}
                      </Box>
                    </CardContent>{" "}
                    <CardActions
                      sx={{
                        p: 2,
                        pt: 0,
                        justifyContent: "flex-end",
                        mt: "auto", // 使按鈕總是位於底部
                      }}
                    >
                      <Button
                        size="small"
                        component={Link}
                        href={`/Artical/${demand.id}`}
                        sx={{
                          borderRadius: "20px",
                          textTransform: "none",
                          px: 2,
                        }}
                      >
                        查看詳情
                      </Button>
                    </CardActions>
                  </Card>
                ))
              ) : (
                <Typography
                  sx={{ p: 2, textAlign: "center", color: "text.secondary" }}
                >
                  目前沒有需求文章
                </Typography>
              )}

              <Box sx={{ mt: 3, textAlign: "right" }}>
                <Button
                  variant="text"
                  color="primary"
                  component={Link}
                  href="/Artical/DemandList"
                  sx={{
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.04)",
                    },
                  }}
                >
                  查看更多需求 ›
                </Button>
              </Box>
            </Grid>
            {/* 即將到來的活動 */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    color: "primary.main",
                  }}
                >
                  <EventIcon sx={{ mr: 1 }} />
                  近期活動
                </Typography>
                <Divider sx={{ mb: 3 }} />
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : upcomingActivities.length > 0 ? (
                upcomingActivities.map((activity) => (
                  <Card
                    key={activity.id}
                    variant="outlined"
                    sx={{
                      mb: 3,
                      transition: "0.3s",
                      "&:hover": {
                        boxShadow: 3,
                        transform: "translateY(-2px)",
                      },
                      borderRadius: 2,
                      overflow: "hidden", // 改為 hidden 以處理溢出內容
                      height: "220px", // 設定與需求卡片相同的固定高度
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: "100%",
                      border: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        pb: 1,
                        px: 2.5,
                        pt: 2,
                        overflow: "hidden", // 確保內容不會溢出
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1,
                          fontSize: { xs: "1rem", sm: "1.1rem" },
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {activity.name}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 1,
                          mb: 1,
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            color: "text.secondary",
                          }}
                        >
                          <Box
                            component="span"
                            sx={{ fontWeight: 500, mr: 0.5 }}
                          >
                            日期:
                          </Box>
                          {activity.date && activity.date.toDate
                            ? activity.date.toDate().toLocaleDateString()
                            : "未知日期"}
                        </Typography>
                        <Chip
                          label={activity.type ?? "活動"}
                          size="small"
                          color="primary"
                          sx={{
                            borderRadius: "16px",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                          }}
                        />
                      </Box>{" "}
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1.5,
                          color: "text.secondary",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 1, // 限制為一行
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        <Box component="span" sx={{ fontWeight: 500 }}>
                          參與人數:
                        </Box>{" "}
                        {activity.participants ?? "未知"}
                      </Typography>
                    </CardContent>{" "}
                    <CardActions
                      sx={{
                        p: 2,
                        pt: 0,
                        justifyContent: "flex-end",
                        mt: "auto", // 使按镽總是位於底部
                      }}
                    >
                      <Button
                        size="small"
                        component={Link}
                        href={`/Activities/${activity.id}`}
                        sx={{
                          borderRadius: "20px",
                          textTransform: "none",
                          px: 2,
                        }}
                      >
                        查看詳情
                      </Button>
                    </CardActions>
                  </Card>
                ))
              ) : (
                <Typography
                  sx={{ p: 2, textAlign: "center", color: "text.secondary" }}
                >
                  目前沒有近期活動
                </Typography>
              )}

              <Box sx={{ mt: 3, textAlign: "right" }}>
                <Button
                  variant="text"
                  color="primary"
                  component={Link}
                  href="/Activities"
                  sx={{
                    fontWeight: 500,
                    "&:hover": {
                      backgroundColor: "rgba(25, 118, 210, 0.04)",
                    },
                  }}
                >
                  查看更多活動 ›
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </main>
    </Box>
  );
}
