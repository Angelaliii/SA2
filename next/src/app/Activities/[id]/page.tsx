// 📁 src/app/activities/[id]/page.tsx
"use client";

import {
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { blue, green } from "@mui/material/colors";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation"; // 使用 useParams 獲取動態路由的 id 參數
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar"; // 引入 Navbar 元件
import { db } from "../../../firebase/config";

export default function ActivityDetailPage() {
  const { id } = useParams(); // 使用 useParams 獲取活動的 id 參數
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchActivity = async () => {
        const docRef = doc(db, "activities", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setActivity(docSnap.data());
        } else {
          console.log("沒有這個活動");
        }
        setLoading(false);
      };

      fetchActivity();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            pt: "64px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f2f2f7",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          pt: "64px", // 確保內容不被導航欄遮擋
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
          <Container maxWidth="md" sx={{ pb: 5, pt: 2 }}>
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
                活動資訊
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {activity?.name}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      sx={{ minWidth: 100 }}
                    >
                      活動日期:
                    </Typography>
                    <Typography
                      variant="body1"
                      color={green[700]}
                      fontWeight="medium"
                    >
                      {activity?.date?.toDate
                        ? activity.date.toDate().toLocaleDateString()
                        : new Date(activity?.date).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      sx={{ minWidth: 100 }}
                    >
                      參與人數:
                    </Typography>
                    <Typography variant="body1">
                      {activity?.participants}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      color="textSecondary"
                      sx={{ minWidth: 100 }}
                    >
                      活動性質:
                    </Typography>
                    <Chip label={activity?.type} color="primary" size="small" />
                  </Box>

                  {activity?.partnerCompany && (
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: { xs: "column", sm: "row" },
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        sx={{ minWidth: 100 }}
                      >
                        合作企業:
                      </Typography>
                      <Typography
                        variant="body1"
                        color={blue[700]}
                        fontWeight="medium"
                      >
                        {activity.partnerCompany}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="body1"
                    color="textSecondary"
                    gutterBottom
                  >
                    內容詳情:
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: "rgba(0,0,0,0.02)",
                      borderRadius: 2,
                      whiteSpace: "pre-line",
                    }}
                  >
                    <Typography variant="body1">{activity?.content}</Typography>
                  </Paper>
                </Box>
              </Box>
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
}
