"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
  Grid,
  CircularProgress,
  TextField,
  MenuItem,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";
import Navbar from "../../../components/Navbar";

const demandItems = ["零食", "飲料", "生活用品", "戶外用品", "其他"];

export default function DemandListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchQuery: "",
    selectedDemand: "",
    eventDate: "",
    minParticipants: "",
  });

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "posts"),
          where("postType", "==", "demand"),
          where("isDraft", "==", false)
        );

        if (filters.searchQuery) {
          q = query(
            q,
            where("title", ">=", filters.searchQuery),
            where("title", "<=", filters.searchQuery + "\uf8ff")
          );
        }

        if (filters.selectedDemand) {
          q = query(q, where("selectedDemands", "array-contains", filters.selectedDemand));
        }

        if (filters.eventDate) {
          q = query(q, where("eventDate", "==", filters.eventDate));
        }

        if (filters.minParticipants) {
          q = query(q, where("estimatedParticipants", ">=", Number(filters.minParticipants)));
        }

        const snapshot = await getDocs(q);
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(results);
      } catch (err) {
        console.error("讀取貼文失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          所有需求牆貼文
        </Typography>

        {/* 搜尋篩選條件 */}
        <Box sx={{ marginBottom: 3 }}>
          {/* 第一列：搜尋標題 */}
          <Box sx={{ marginBottom: 2 }}>
            <TextField
              fullWidth
              label="搜尋需求標題"
              value={filters.searchQuery}
              onChange={handleFilterChange}
              name="searchQuery"
            />
          </Box>

          {/* 第二列：活動日期、最低參與人數、需求物資 */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            <TextField
              label="活動日期"
              type="date"
              value={filters.eventDate}
              onChange={handleFilterChange}
              name="eventDate"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1, minWidth: 180 }}
            />
            <TextField
              label="最低參與人數"
              type="number"
              value={filters.minParticipants}
              onChange={handleFilterChange}
              name="minParticipants"
              sx={{ flex: 1, minWidth: 180 }}
            />
            <TextField
              label="需求物資"
              select
              value={filters.selectedDemand}
              onChange={handleFilterChange}
              name="selectedDemand"
              sx={{ flex: 1, minWidth: 180 }}
            >
              <MenuItem value="">全部</MenuItem>
              {demandItems.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Box>

        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Typography>目前尚無需求貼文。</Typography>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} sm={6} key={post.id}>
                <Link
                  href={`/Artical/${post.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      transition: "0.3s",
                      "&:hover": { boxShadow: 4 },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {post.title || "(未命名文章)"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.organizationName || "(無機構名稱)"}
                      </Typography>
                      <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {(post.selectedDemands || []).map(
                          (item: string, index: number) => (
                            <Chip key={index} label={item} color="primary" size="small" />
                          )
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
