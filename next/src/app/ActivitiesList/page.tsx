"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Container,
  Typography,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const activityTypes = ["迎新", "講座", "比賽", "展覽", "其他"];

export default function NewActivityPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    date: "",
    participants: "",
    type: "",
    content: "",
    partnerCompany: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!user) {
      setError("請先登入才能發布活動！");
      return;
    }
    if (loading) return;
  
    const requiredFields = ["name", "date", "participants", "type", "content"];
    for (const key of requiredFields) {
      if (!formData[key as keyof typeof formData]) {
        setError("請完整填寫所有欄位！");
        return;
      }
    }
  
    const parsedDate = new Date(formData.date);
    if (isNaN(parsedDate.getTime())) {
      setError("請輸入正確的活動日期");
      return;
    }
  
    setLoading(true);
    try {
      await addDoc(collection(db, "activities"), {
        ...formData,
        uid: user.uid,
        participants: Number(formData.participants),
        date: Timestamp.fromDate(parsedDate),
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/Activities");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "發布失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Container maxWidth="sm">
      <Navbar />
      <Typography variant="h5" mt={4} mb={2}>
        新增活動資訊
      </Typography>
      <Box display="flex" flexDirection="column" gap={2}>
        <TextField
          label="活動名稱"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="活動日期"
          name="date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={formData.date}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="參與人數"
          name="participants"
          type="number"
          value={formData.participants}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          select
          label="活動性質"
          name="type"
          value={formData.type}
          onChange={handleChange}
          fullWidth
          required
        >
          {activityTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="內容"
          name="content"
          value={formData.content}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          required
        />
        <TextField
          label="合作企業"
          name="partnerCompany"
          value={formData.partnerCompany}
          onChange={handleChange}
          fullWidth
        />
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? "發布中..." : "發布"}
        </Button>
      </Box>
      <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: "100%" }}>
          ✅ 活動發布成功！
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError("")}> 
        <Alert severity="error" sx={{ width: "100%" }}>
          ❌ {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
