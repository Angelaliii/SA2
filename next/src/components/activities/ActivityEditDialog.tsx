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
import { Timestamp, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";

const activityTypes = ["迎新", "講座", "比賽", "展覽", "其他"];

interface ActivityEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activity: any;
}

export default function ActivityEditDialog({
  open,
  onClose,
  onSuccess,
  activity,
}: ActivityEditDialogProps) {
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

  // Initialize form with activity data when it changes
  useEffect(() => {
    if (activity) {
      const date = activity.date?.toDate
        ? new Date(activity.date.toDate())
        : new Date(activity.date);

      setFormData({
        name: activity.name || activity.title || "",
        date: date ? date.toISOString().split("T")[0] : "",
        participants: activity.participants?.toString() || "",
        type: activity.type || "",
        content: activity.content || activity.description || "",
        partnerCompany: activity.partnerCompany || "",
      });
    }
  }, [activity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
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
      await updateDoc(doc(db, "activities", activity.id), {
        ...formData,
        title: formData.name, // For backward compatibility
        description: formData.content, // For backward compatibility
        participants: Number(formData.participants),
        date: Timestamp.fromDate(parsedDate),
        updatedAt: Timestamp.now(),
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "更新失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <>
      {isMounted && (
        <>
          <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{ m: 0, p: 2 }}>
              編輯活動資訊
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
                {loading ? "更新中..." : "更新"}
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={success}
            autoHideDuration={2000}
            onClose={() => setSuccess(false)}
          >
            <Alert severity="success" sx={{ width: "100%" }}>
              ✅ 活動更新成功！
            </Alert>
          </Snackbar>
          <Snackbar
            open={!!error}
            autoHideDuration={3000}
            onClose={() => setError("")}
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
