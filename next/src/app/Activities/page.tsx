"use client";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

import Link from "next/link";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { db } from "../../firebase/config";

const activityTypes = ["迎新", "講座", "比賽", "展覽", "其他"];

export default function ActivityListPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    participants: "",
    type: "",
    searchQuery: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 每頁顯示的活動數量

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, "activities"), orderBy("date", "desc"));

        // 搜尋功能
        if (filters.searchQuery) {
          q = query(
            collection(db, "activities"),
            where("name", ">=", filters.searchQuery),
            where("name", "<=", filters.searchQuery + "\uf8ff"),
            orderBy("name")
          );
        }

        // 活動類型篩選
        if (filters.type) {
          q = query(
            collection(db, "activities"),
            where("type", "==", filters.type),
            orderBy("date", "desc")
          );
        }

        const snapshot = await getDocs(q);
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setActivities(result);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError("資料讀取失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filters.searchQuery, filters.type]);

  // 手動處理參與人數篩選
  const filteredActivities = activities.filter((act) => {
    // 參與人數篩選
    if (filters.participants && act.participants) {
      const minParticipants = parseInt(filters.participants);
      const actParticipants = parseInt(act.participants);
      if (actParticipants < minParticipants) return false;
    }

    return true;
  });

  // 計算分頁
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  // 當前頁的活動
  const currentActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchQuery: e.target.value });
    setCurrentPage(1); // 搜尋時重設回第 1 頁
  };
  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    // Delay scrolling to prevent hydration issues
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  };

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
              活動資訊
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              查看所有最新社團活動，尋找您感興趣的活動並參與其中
            </Typography>
          </Box>

          {/* 搜尋與篩選 */}
          <Box
            sx={{
              p: 3,
              mb: 4,
              borderRadius: 2,
              backgroundColor: "white",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="搜尋活動名稱"
                value={filters.searchQuery}
                onChange={handleSearchChange}
              />

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ width: "100%" }}
              >
                <TextField
                  fullWidth
                  label="最低參與人數"
                  type="number"
                  value={filters.participants}
                  onChange={(e) =>
                    setFilters({ ...filters, participants: e.target.value })
                  }
                />
                <TextField
                  fullWidth
                  label="活動性質"
                  select
                  value={filters.type}
                  onChange={(e) =>
                    setFilters({ ...filters, type: e.target.value })
                  }
                >
                  <MenuItem value="">全部</MenuItem>
                  {activityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>
          </Box>

          {/* Loading indicator */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress size={40} />
            </Box>
          )}

          {/* Error message */}
          {error && (
            <Typography
              color="error"
              variant="h6"
              align="center"
              sx={{ my: 4 }}
            >
              {error}
            </Typography>
          )}

          {/* Display Activities */}
          {!loading && (
            <>
              {currentActivities.length === 0 ? (
                <Typography variant="h6" align="center" sx={{ my: 4 }}>
                  目前沒有符合條件的活動資料
                </Typography>
              ) : (
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  spacing={3}
                  useFlexGap
                  sx={{ width: "100%" }}
                >
                  {currentActivities.map((act) => (
                    <Box
                      key={act.id}
                      sx={{
                        width: {
                          xs: "100%",
                          sm: "calc(50% - 12px)",
                          md: "calc(33.333% - 16px)",
                        },
                        mb: 3,
                      }}
                    >
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          transition: "transform 0.2s, box-shadow 0.2s",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          },
                        }}
                      >
                        <CardActionArea
                          component={Link}
                          href={`/Activities/${act.id}`}
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <CardContent sx={{ width: "100%", flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {act.name}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                                color: "text.secondary",
                              }}
                            >
                              <Typography variant="body2">
                                📅 {act.date.toDate().toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 1,
                                color: "text.secondary",
                              }}
                            >
                              <Typography variant="body2">
                                👥 {act.participants} 人
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 2,
                                color: "text.secondary",
                              }}
                            >
                              <Typography variant="body2">
                                🔖 {act.type}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {act.content}
                            </Typography>
                            {act.partnerCompany && (
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ mt: 2 }}
                              >
                                🤝 合作企業：{act.partnerCompany}
                              </Typography>
                            )}
                          </CardContent>
                        </CardActionArea>
                      </Card>
                    </Box>
                  ))}
                </Stack>
              )}

              {/* 分頁控制 */}
              {totalPages > 1 && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          )}
        </Container>
      </Box>
    </>
  );
}
