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
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
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
            mb: 4, // 縮小底部間距
            pt: { xs: 10, sm: 12 }, // 從頂部增加適當的間距，根據螢幕尺寸自適應
            pb: 3, // 減少底部間距
            maxWidth: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
            height: "auto",
            minHeight: { xs: 350, sm: 400 }, // 縮小最小高度，響應式設計
              }}
            >
              <img
                src="/image/index_picture.png"
                alt="首頁封面圖"
                style={{
              maxHeight: "220px", // 稍微縮小圖片
                  objectFit: "contain",
              marginBottom: "16px", // 減少圖片下方間距
                }}
              />
          <Box sx={{ maxWidth: "80%", mx: "auto" }}>
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                  找資源、找合作，從這裡開始！
                </Typography>
            <Typography variant="body1" sx={{ mt: 1.5, mb: 2 }}>
              {" "}
              {/* 減少文字間的間距 */}
                  一站式媒合平台，串聯企業與社團，共創雙贏
                </Typography>
            <Box
              sx={{ mt: 2, display: "flex", justifyContent: "center", gap: 2 }}
            >
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    href="/Artical/DemandList"
                sx={{ px: 3, py: 1 }}
                  >
                需求牆
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    component={Link}
                href="/Profile"
                sx={{ px: 3, py: 1 }}
                  >
                個人資料
                  </Button>
            </Box>
          </Box>
        </Box>

        {/* 最新公告區塊 */}
        <Container maxWidth="lg" sx={{ mb: 6, mt: 2 }}>
          {" "}
          {/* 減少上下間距 */}
          <Grid container spacing={3}>
            {" "}
            {/* 減少格線間距 */}
            {/* 最新需求牆文章 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
            <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ display: "flex", alignItems: "center", mb: 2 }}
                >
                  <ArticleIcon sx={{ mr: 1 }} />
                      最新需求
                    </Typography>
                <Divider />
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
                      "&:hover": { boxShadow: 3 },
                      overflow: "visible",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: "100%", // 確保卡片不會超出容器
                          }}
                        >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        pb: 1,
                        px: 2, // 減少左右內邊距
                        pt: 1.5, // 減少頂部內邊距
                      }}
                    >
                            <Typography
                              variant="h6"
                              sx={{
                          mb: 0.5, // 減少標題下方間距
                          fontSize: "1.1rem", // 稍微縮小標題字體
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
                        color="text.secondary"
                        gutterBottom
                        sx={{ mb: 0.5 }} // 減少段落間距
                      >
                        {demand.organizationName ?? "未知組織"}
                            </Typography>
                      <Box
                        sx={{
                          mt: 0.5, // 減少上方間距
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        {(demand.selectedDemands ?? [])
                          .slice(0, 3)
                          .map((item: string, i: number) => (
                              <Chip
                              key={i}
                                label={item}
                                size="small"
                                color="primary"
                              variant="outlined"
                              sx={{ maxWidth: "100%", overflow: "hidden" }}
                              />
                            ))}
                        {(demand.selectedDemands ?? []).length > 3 && (
                          <Chip
                            label={`+${demand.selectedDemands.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                          </Box>
                    </CardContent>
                    <CardActions sx={{ p: 1.5, pt: 0 }}>
                            <Button
                        size="small"
                              component={Link}
                              href={`/Artical/${demand.id}`}
                        sx={{ ml: 0.5 }}
                            >
                              查看詳情
                            </Button>
                    </CardActions>
                  </Card>
                ))
                  ) : (
                    <Typography sx={{ p: 2, textAlign: "center" }}>
                      目前沒有需求文章
                    </Typography>
                  )}

              <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button
                  variant="text"
                      color="primary"
                      component={Link}
                      href="/Artical/DemandList"
                    >
                  查看更多 ›
                    </Button>
                  </Box>
              </Grid>
            {/* 即將到來的活動 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ display: "flex", alignItems: "center", mb: 2 }}
                >
                  <EventIcon sx={{ mr: 1 }} />
                      近期活動
                    </Typography>
                <Divider />
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
                      "&:hover": { boxShadow: 3 },
                      overflow: "visible",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      maxWidth: "100%", // 確保卡片不會超出容器
                          }}
                        >
                    <CardContent
                      sx={{
                        flexGrow: 1,
                        pb: 1,
                        px: 2, // 減少左右內邊距
                        pt: 1.5, // 減少頂部內邊距
                      }}
                    >
                            <Typography
                              variant="h6"
                              sx={{
                          mb: 0.5, // 減少標題下方間距
                          fontSize: "1.1rem", // 稍微縮小標題字體
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
                          mt: 0.5, // 減少上方間距
                          mb: 0.5, // 減少下方間距
                          flexWrap: "wrap",
                          gap: 0.5, // 減少間隙
                        }}
                      >
                              <Typography variant="body2" color="text.secondary">
                          日期:{" "}
                          {activity.date && activity.date.toDate
                            ? activity.date.toDate().toLocaleDateString()
                            : "未知日期"}
                              </Typography>
                              <Chip
                          label={activity.type ?? "活動"}
                                size="small"
                                color="primary"
                              />
                          </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        參與人數: {activity.participants ?? "未知"}
                          </Typography>
                    </CardContent>
                    <CardActions sx={{ p: 1.5, pt: 0 }}>
                            <Button
                        size="small"
                              component={Link}
                              href={`/Activities/${activity.id}`}
                        sx={{ ml: 0.5 }}
                            >
                              查看詳情
                            </Button>
                    </CardActions>
                  </Card>
                ))
                  ) : (
                    <Typography sx={{ p: 2, textAlign: "center" }}>
                      目前沒有近期活動
                    </Typography>
                  )}

              <Box sx={{ mt: 2, textAlign: "right" }}>
                    <Button
                  variant="text"
                      color="primary"
                      component={Link}
                      href="/Activities"
                    >
                  查看更多 ›
                    </Button>
                  </Box>
              </Grid>
            </Grid>
          </Container>
      </main>
    </Box>
  );
}
