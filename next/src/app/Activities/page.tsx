// 📁 src/app/activities/page.tsx
"use client";

import { useEffect, useState } from "react";
import { TextField, MenuItem, Grid, Card, CardContent, Typography, Container } from "@mui/material";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../../components/Navbar";
import Link from "next/link"; // 用來實現跳轉到活動詳細頁面

const activityTypes = ["迎新", "講座", "比賽", "展覽", "其他"];

export default function ActivityListPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    date: "",
    participants: "",
    type: "",
    searchQuery: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastVisible, setLastVisible] = useState<any>(null); // 用來儲存最後一個文件的參考
  const [currentPage, setCurrentPage] = useState(1); // 分頁的當前頁碼

  const itemsPerPage = 6; // 每頁顯示的活動數量

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        let q = query(
          collection(db, "activities"),
          orderBy("date", "desc"),
          limit(itemsPerPage)
        );

        // 搜尋功能
        if (filters.searchQuery) {
          q = query(
            q,
            where("name", ">=", filters.searchQuery),
            where("name", "<=", filters.searchQuery + "\uf8ff")
          );
        }

        const snapshot = await getDocs(q);
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setActivities(result);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]); // 更新最後一個文件的參考
      } catch (err) {
        setError("資料讀取失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [filters.searchQuery, currentPage]);

  // 處理分頁
  const handleNextPage = async () => {
    if (!lastVisible) return; // 沒有更多資料則不進行操作
    setLoading(true);
    try {
      const nextQuery = query(
        collection(db, "activities"),
        orderBy("date", "desc"),
        startAfter(lastVisible),
        limit(itemsPerPage)
      );

      const snapshot = await getDocs(nextQuery);
      const result = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActivities((prevActivities) => [...prevActivities, ...result]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]); // 更新最後一個文件的參考
    } catch (err) {
      setError("資料讀取失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchQuery: e.target.value });
    setCurrentPage(1); // 搜尋時重設回第 1 頁
  };

  return (
    <Container>
      <Navbar />
      <Typography variant="h4" mt={4} mb={2}>
        活動總覽
      </Typography>

      {/* 搜尋框 */}
      <TextField
        fullWidth
        label="搜尋活動名稱"
        value={filters.searchQuery}
        onChange={handleSearchChange}
        sx={{ marginBottom: 2 }}
      />

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="活動日期"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="最低參與人數"
            type="number"
            value={filters.participants}
            onChange={(e) => setFilters({ ...filters, participants: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="活動性質"
            select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          >
            <MenuItem value="">全部</MenuItem>
            {activityTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Loading indicator */}
      {loading && (
        <CircularProgress size={50} sx={{ display: "block", margin: "auto" }} />
      )}

      {/* Error message */}
      {error && (
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      )}

      {/* Display Activities */}
      <Grid container spacing={2}>
        {!loading && activities.length === 0 && !error && (
          <Typography variant="h6" align="center">
            目前沒有活動資料
          </Typography>
        )}
        {activities.map((act) => (
          <Grid item xs={12} sm={6} md={4} key={act.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{act.name}</Typography>
                <Typography variant="body2">
                  📅 {act.date.toDate().toLocaleDateString()}
                </Typography>
                <Typography variant="body2">👥 {act.participants} 人</Typography>
                <Typography variant="body2">🔖 {act.type}</Typography>
                <Typography variant="body2" mt={1}>
                  {act.content}
                </Typography>
                {act.partnerCompany && (
                  <Typography variant="caption" display="block">
                    🤝 合作企業：{act.partnerCompany}
                  </Typography>
                )}
                {/* Link to Activity Detail Page */}
                <Link href={`/Activities/${act.id}`} passHref>
                  <Typography variant="body2" color="primary" sx={{ cursor: "pointer" }}>
                    查看詳細內容
                  </Typography>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* 分頁控制 */}
      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <Pagination
          count={Math.ceil(activities.length / itemsPerPage)}
          page={currentPage}
          onChange={(e, page) => setCurrentPage(page)}
          variant="outlined"
          shape="rounded"
        />
        <Button onClick={handleNextPage} disabled={loading}>
          下一頁
        </Button>
      </Box>
    </Container>
  );
}
