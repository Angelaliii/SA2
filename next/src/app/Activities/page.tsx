"use client";

import { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Typography,
  Container,
  CircularProgress,
  Pagination,
  Box,
  Button,
} from "@mui/material";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  startAfter,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import Navbar from "../../components/Navbar";
import Link from "next/link";

const activityTypes = ["迎新", "講座", "比賽", "展覽", "其他"];
const participantOptions = [
  { label: "全部", value: "" },
  { label: "50 以內", value: "50" },
  { label: "100 以內", value: "100" },
  { label: "200 以內", value: "200" },
];

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
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 6;

  const fetchActivities = async (reset = false) => {
    setLoading(true);
    try {
      let q = query(
        collection(db, "activities"),
        orderBy("date", "desc"),
        limit(itemsPerPage)
      );
  
      if (filters.searchQuery.trim()) {
        q = query(
          q,
          where("name", ">=", filters.searchQuery.trim()),
          where("name", "<=", filters.searchQuery.trim() + "\uf8ff")
        );
      }
  
      if (filters.type) {
        q = query(q, where("type", "==", filters.type));
      }
  
      if (filters.participants && !isNaN(parseInt(filters.participants))) {
        q = query(q, where("participants", "<=", parseInt(filters.participants)));
      }
  
      if (filters.date) {
        try {
          const date = new Date(filters.date);
          if (!isNaN(date.getTime())) {
            q = query(q, where("date", "==", Timestamp.fromDate(date)));
          }
        } catch (e) {
          console.warn("無效的日期格式:", filters.date);
        }
      }
  
      if (!reset && lastVisible && currentPage > 1) {
        q = query(q, startAfter(lastVisible));
      }
  
      const snapshot = await getDocs(q);
      const result = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "未知活動",
          date: data.date || Timestamp.fromDate(new Date()),
          participants: data.participants || 0,
          type: data.type || "其他",
          content: data.content || "",
          partnerCompany: data.partnerCompany || "",
        };
      });
  
      setActivities(reset ? result : [...activities, ...result]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setTotalPages(Math.ceil((activities.length + result.length) / itemsPerPage));
    } catch (err: any) {
      console.error("Firestore 查詢錯誤:", err);
      if (err.code === "failed-precondition" && err.message.includes("index")) {
        setError(
          "查詢需要索引，請檢查控制台中的錯誤訊息並創建索引。"
        );
      } else if (err.code === "permission-denied") {
        setError("無權訪問資料，請檢查 Firestore 規則設置。");
      } else {
        setError("資料讀取失敗，請稍後再試");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterApply = () => {
    setCurrentPage(1);
    setActivities([]);
    setLastVisible(null);
    fetchActivities(true);
  };

  useEffect(() => {
    fetchActivities();
  }, [currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, searchQuery: e.target.value });
    setCurrentPage(1);
    setActivities([]);
    setLastVisible(null);
    fetchActivities(true);
  };

  const handlePageChange = (e: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
  };

  return (
    <Container>
      <Navbar />
      <Typography variant="h4" mt={4} mb={2}>
        活動總覽
      </Typography>

      <TextField
        fullWidth
        label="搜尋活動名稱"
        value={filters.searchQuery}
        onChange={handleSearchChange}
        sx={{ marginBottom: 2 }}
      />

      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="活動日期"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="參與人數"
            select
            value={filters.participants}
            onChange={(e) =>
              setFilters({ ...filters, participants: e.target.value })
            }
          >
            {participantOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
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
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleFilterApply}
            sx={{ height: "100%" }}
          >
            篩選
          </Button>
        </Grid>
      </Grid>

      {loading && (
        <CircularProgress size={50} sx={{ display: "block", margin: "auto" }} />
      )}

      {error && (
        <Typography color="error" variant="h6" align="center">
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        {!loading && activities.length === 0 && !error && (
          <Typography variant="h6" align="center" sx={{ width: "100%" }}>
            目前沒有符合條件的活動
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
                <Link href={`/Activities/${act.id}`} passHref>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{ cursor: "pointer" }}
                  >
                    查看詳細內容
                  </Typography>
                </Link>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
        <Pagination
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          variant="outlined"
          shape="rounded"
        />
      </Box>
    </Container>
  );
}