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

export default function Index() {
  const [recentDemands, setRecentDemands] = useState<any[]>([]);
  const [upcomingActivities, setUpcomingActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentDemandsAndActivities = async () => {
      setLoading(true);
      try {
        // Fetch recent demands
        const demandsQuery = query(
          collection(db, "posts"),
          where("postType", "==", "demand"),
          where("isDraft", "==", false),
          orderBy("createdAt", "desc"),
          limit(3)
        );

        const demandsSnapshot = await getDocs(demandsQuery);
        const demands = demandsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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
            mb: 4,
            py: 4,
            maxWidth: "100%",
            height: 300,
          }}
        >
          <img
            src="/image/index_picture.png"
            alt="首頁封面圖"
            style={{
              height: "350px",
              objectFit: "contain",
            }}
          />
          <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold" }}>
            找資源、找合作，從這裡開始！
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            一站式媒合平台，串聯企業與社團，共創雙贏
          </Typography>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/Artical/DemandList"
            >
              需求牆
            </Button>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/Profile"
            >
              個人資料
            </Button>
          </Box>
        </Box>

        {/* 最新公告區塊 */}
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          <Grid container spacing={4}>
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
                      mb: 2,
                      transition: "0.3s",
                      "&:hover": { boxShadow: 3 },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{demand.title}</Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {demand.organizationName || "未知組織"}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                        }}
                      >
                        {(demand.selectedDemands || [])
                          .slice(0, 3)
                          .map((item: string, i: number) => (
                            <Chip
                              key={i}
                              label={item}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        component={Link}
                        href={`/Artical/${demand.id}`}
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
                      mb: 2,
                      transition: "0.3s",
                      "&:hover": { boxShadow: 3 },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{activity.name}</Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mt: 1,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          日期:{" "}
                          {activity.date && activity.date.toDate
                            ? activity.date.toDate().toLocaleDateString()
                            : "未知日期"}
                        </Typography>
                        <Chip
                          label={activity.type || "活動"}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        參與人數: {activity.participants || "未知"}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        component={Link}
                        href={`/Activities/${activity.id}`}
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
