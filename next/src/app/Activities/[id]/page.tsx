// 📁 src/app/activities/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // 使用 useParams 獲取動態路由的 id 參數
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { Typography, Container, Box, CircularProgress, Card, CardContent, Divider, Chip } from "@mui/material";
import { blue, green, red } from "@mui/material/colors";
import Navbar from "../../../components/Navbar"; // 引入 Navbar 元件

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
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ paddingTop: 8 }}>
      {/* Navbar 加入到詳細頁面中 */}
      <Navbar />

      {/* 內容區域 */}
      <Container sx={{ paddingTop: 4 }}>
        <Card sx={{ maxWidth: 800, margin: "auto", boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h4" component="div" gutterBottom color={blue[700]}>
              {activity?.name}
            </Typography>
            <Divider sx={{ marginBottom: 2 }} />
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="body1" color="textSecondary">
                活動日期:
              </Typography>
              <Typography variant="h6" color={green[600]}>
                {activity?.date.toDate().toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="body1" color="textSecondary">
                參與人數:
              </Typography>
              <Typography variant="h6">{activity?.participants}</Typography>
            </Box>
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="body1" color="textSecondary">
                活動性質:
              </Typography>
              <Chip label={activity?.type} color="primary" />
            </Box>
            <Box sx={{ marginBottom: 2 }}>
              <Typography variant="body1" color="textSecondary">
                內容:
              </Typography>
              <Typography variant="body2">{activity?.content}</Typography>
            </Box>
            {activity?.partnerCompany && (
              <Box sx={{ marginBottom: 2 }}>
                <Typography variant="body1" color="textSecondary">
                  合作企業:
                </Typography>
                <Typography variant="body2" color={red[600]}>
                  {activity.partnerCompany}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
