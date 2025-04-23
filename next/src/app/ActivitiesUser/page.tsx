// 📁 src/app/ActivitiesUser/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Card, CardContent, Typography, Button, Container, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useAuth } from "../../hooks/useAuth"; // 假設你已經創建了自定義的 useAuth hook
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function MyActivitiesPage() {
  const { user } = useAuth(); // 獲取當前登入的用戶
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<any>(null); // 用於存儲要刪除的活動

  useEffect(() => {
    const fetchUserActivities = async () => {
      if (!user) return; // 如果沒有用戶則不進行任何操作
      setLoading(true);

      try {
        // 查詢當前用戶所創建的所有活動
        const q = query(collection(db, "activities"), where("uid", "==", user.uid));
        const snapshot = await getDocs(q);
        const result = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setActivities(result);
      } catch (err) {
        console.error("錯誤:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserActivities();
  }, [user]);

  // 刪除活動
  const handleDelete = async () => {
    if (!activityToDelete) return;
    try {
      await deleteDoc(doc(db, "activities", activityToDelete.id)); // 刪除活動
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== activityToDelete.id)
      );
      setOpenDeleteDialog(false); // 關閉刪除確認框
    } catch (err) {
      console.error("刪除活動錯誤:", err);
    }
  };

  return (
    <Container sx={{ paddingTop: 4 }}>
      <Navbar/>
      <Typography variant="h4" mb={2}>
        我的活動
      </Typography>

      {/* Loading indicator */}
      {loading && <CircularProgress size={50} sx={{ display: "block", margin: "auto" }} />}

      {/* Display Activities */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 2 }}>
        {!loading && activities.length === 0 && (
          <Typography variant="h6" align="center">
            您尚未發布任何活動。
          </Typography>
        )}
        {activities.map((act) => (
          <Card key={act.id}>
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
              <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                {/* 修改按鈕 */}
                <Link href={`/ActivitiesEdit/${act.id}`} passHref>
                  <Button variant="contained" color="primary" size="small">
                    編輯
                  </Button>
                </Link>

                {/* 刪除按鈕 */}
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => {
                    setActivityToDelete(act);
                    setOpenDeleteDialog(true);
                  }}
                >
                  刪除
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* 刪除確認對話框 */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>確認刪除活動</DialogTitle>
        <DialogContent>
          <Typography>
            您確定要刪除活動 <strong>{activityToDelete?.name}</strong> 嗎？
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            取消
          </Button>
          <Button onClick={handleDelete} color="secondary" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
