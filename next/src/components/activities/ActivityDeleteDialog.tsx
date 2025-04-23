"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Typography,
} from "@mui/material";
import { deleteDoc, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";

interface ActivityDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activity: any;
}

export default function ActivityDeleteDialog({
  open,
  onClose,
  onSuccess,
  activity,
}: ActivityDeleteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Only render on the client side to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDelete = async () => {
    if (!activity?.id || loading) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "activities", activity.id));
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "刪除失敗，請稍後再試。");
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle>確認刪除活動</DialogTitle>
        <DialogContent>
          <Typography>
            您確定要刪除活動{" "}
            <strong>{activity?.name || activity?.title}</strong>{" "}
            嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            取消
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={loading}
          >
            {loading ? "刪除中..." : "刪除"}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={success}
        autoHideDuration={2000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          ✅ 活動已成功刪除！
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
  );
}
