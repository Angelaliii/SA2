"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
} from "@mui/material";
import { Timestamp, addDoc, collection } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";

const activityTypes = ["迎新", "講座", "比賽", "展覽", "其他"];

interface ActivityFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivityFormDialog({
  open,
  onClose,
  onSuccess,
}: ActivityFormDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Only render on the client side to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        resetForm();
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "發布失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      date: "",
      participants: "",
      type: "",
      content: "",
      partnerCompany: "",
    });
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      {isMounted && (
        <>
          <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2 }}>
              新增活動資訊
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
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
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="outlined" onClick={handleClose}>
                取消
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "發布中..." : "發布"}
              </Button>
            </DialogActions>
          </Dialog>{" "}
          <Snackbar
            open={success}
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert severity="success" sx={{ width: "100%" }}>
              ✅ 活動發布成功！
            </Alert>
          </Snackbar>
          <Snackbar
            open={!!error}
            autoHideDuration={3000}
            onClose={() => setError("")}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert severity="error" sx={{ width: "100%" }}>
              ❌ {error}
            </Alert>
          </Snackbar>
        </>
      )}
    </>
  );
}
