"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../../firebase/config";
import { TextField, Button, Container, Box, CircularProgress, Snackbar, Alert, Typography } from "@mui/material";
import Navbar from "../../../components/Navbar";

export default function EditActivityPage() {
  const { id } = useParams();  // 獲取 URL 中的活動 id
  const router = useRouter();  // 使用 useRouter 來進行頁面跳轉
  const auth = getAuth();  // 獲取 Firebase 認證
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(0);
  const [partnerCompany, setPartnerCompany] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");  // 用來顯示錯誤訊息
  const [success, setSuccess] = useState(false);  // 用來顯示發布成功訊息

  useEffect(() => {
    if (!id) {
      setError("活動 ID 無效");
      return;
    }

    const fetchActivity = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "activities", id as string);  // 使用 doc() 時確保 id 是有效的
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const activityData = docSnap.data();
          setActivity(activityData);
          setName(activityData.name);
          setContent(activityData.content);
          setDate(activityData.date.toDate().toLocaleDateString());
          setParticipants(activityData.participants);
          setPartnerCompany(activityData.partnerCompany || "");
          setType(activityData.type);
          
          // 檢查當前用戶是否是活動的創建者
          const currentUser = auth.currentUser;
          if (currentUser && activityData.userId !== currentUser.uid) {
            setError("您無權編輯此活動");
          }
        } else {
          setError("該活動不存在");
        }
      } catch (err) {
        console.error("錯誤:", err);
        setError("獲取活動資料失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, auth]);

  const handleSave = async () => {
    if (!name || !content || !date || participants <= 0 || !type) {
      setError("請確保所有欄位都有填寫");
      return;
    }

    try {
      const docRef = doc(db, "activities", id as string);
      await updateDoc(docRef, {
        name,
        content,
        date: new Date(date),  // 儲存為 Date 類型
        participants,
        partnerCompany,
        type,
      });
      setSuccess(true);  // 成功後顯示成功訊息
      setTimeout(() => {
        router.push("/Activities");  // 跳轉到 Activities 頁面
      }, 1500);
    } catch (err) {
      console.error("更新活動資料時發生錯誤:", err);
      setError("更新活動資料失敗");
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
          編輯活動
        </Typography>
        {error && <Typography color="error">{error}</Typography>} {/* 顯示錯誤訊息 */}

        <Box sx={{ marginBottom: 3 }}>
          <TextField
            fullWidth
            label="活動名稱"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="活動日期"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            sx={{ marginBottom: 2 }}
            type="date"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            fullWidth
            label="活動內容"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ marginBottom: 2 }}
            multiline
            rows={4}
          />
          <TextField
            fullWidth
            label="參與人數"
            type="number"
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="活動性質"
            value={type}
            onChange={(e) => setType(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <TextField
            fullWidth
            label="合作企業"
            value={partnerCompany}
            onChange={(e) => setPartnerCompany(e.target.value)}
            sx={{ marginBottom: 2 }}
          />
          <Button variant="contained" onClick={handleSave} disabled={loading}>
            {loading ? "儲存中..." : "儲存"}
          </Button>
        </Box>
      </Container>

      {/* 成功提示 */}
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          ✅ 活動更新成功！
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
