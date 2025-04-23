"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../firebase/config";
import { TextField, Button, Container, Box, CircularProgress, Snackbar, Alert, Typography } from "@mui/material";
import Navbar from "../../../components/Navbar";

export default function EditArticalPage() {
  const { id } = useParams();  // 獲取 URL 中的需求文章 id
  const router = useRouter();  // 使用 useRouter 來進行頁面跳轉
  const auth = getAuth();  // 獲取 Firebase 認證
  const [artical, setArtical] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [demandDescription, setDemandDescription] = useState("");
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [cooperationReturn, setCooperationReturn] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [error, setError] = useState("");  // 用來顯示錯誤訊息
  const [success, setSuccess] = useState(false);  // 用來顯示發布成功訊息

  useEffect(() => {
    if (!id) {
      setError("需求文章 ID 無效");
      return;
    }

    const fetchArtical = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "posts", id as string);  // 使用 doc() 時確保 id 是有效的
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const articalData = docSnap.data();
          setArtical(articalData);
          setTitle(articalData.title);
          setDemandDescription(articalData.demandDescription);
          setSelectedDemands(articalData.selectedDemands || []);
          setCooperationReturn(articalData.cooperationReturn);
          setEstimatedParticipants(articalData.estimatedParticipants || "");
          setEventDate(articalData.eventDate);
          setEventDescription(articalData.eventDescription);
          
          // 檢查當前用戶是否是該需求文章的創建者
          const currentUser = auth.currentUser;
          if (currentUser && articalData.authorId !== currentUser.uid) {
            setError("您無權編輯此需求文章");
          }
        } else {
          setError("該需求文章不存在");
        }
      } catch (err) {
        console.error("錯誤:", err);
        setError("獲取需求文章資料失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchArtical();
  }, [id, auth]);

  const handleSave = async () => {
    if (!title || !demandDescription || !eventDate) {
      setError("請確保所有欄位都有填寫");
      return;
    }

    try {
      const docRef = doc(db, "posts", id as string);
      await updateDoc(docRef, {
        title,
        demandDescription,
        selectedDemands,
        cooperationReturn,
        estimatedParticipants,
        eventDate,
        eventDescription,
      });
      setSuccess(true);  // 成功後顯示成功訊息
      setTimeout(() => {
        router.push("/ArticalUser");  // 跳轉到我的需求文章頁面
      }, 1500);
    } catch (err) {
      console.error("更新需求文章資料時發生錯誤:", err);
      setError("更新需求文章資料失敗");
    }
  };

  if (loading) {
    return <CircularProgress size={50} sx={{ display: "block", margin: "auto" }} />;
  }

  return (
    <Box sx={{ paddingTop: 8 }}>
      {/* Navbar 加入到編輯頁面中 */}
      <Navbar />

      <Container sx={{ paddingTop: 4 }}>
        <Typography variant="h4" component="div" gutterBottom>
          編輯需求文章
        </Typography>
        {error && <Typography color="error">{error}</Typography>} {/* 顯示錯誤訊息 */}

        <Box sx={{ marginBottom: 3 }}>
          <TextField
            fullWidth
            label="標題"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="需求描述"
            value={demandDescription}
            onChange={(e) => setDemandDescription(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={4}
          />
          <TextField
            fullWidth
            label="回饋方案"
            value={cooperationReturn}
            onChange={(e) => setCooperationReturn(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={4}
          />
          <TextField
            fullWidth
            label="預估參與人數"
            value={estimatedParticipants}
            onChange={(e) => setEstimatedParticipants(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="活動日期"
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="活動說明"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={4}
          />
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? "儲存中..." : "保存變更"}
          </Button>
        </Box>
      </Container>

      {/* 成功提示 */}
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          ✅ 需求文章更新成功！
        </Alert>
      </Snackbar>

      {/* 錯誤提示 */}
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}> 
        <Alert severity="error" sx={{ width: "100%" }}>
          ❌ {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
