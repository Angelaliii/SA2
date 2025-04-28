import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import React, { useState } from "react";
import { enterpriseService } from "../../firebase/services/enterprise-service";

type EnterpriseDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcement: any;
};

export default function EnterpriseDeleteDialog({
  open,
  onClose,
  onSuccess,
  announcement,
}: EnterpriseDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!announcement?.id) return;

    setLoading(true);
    try {
      await enterpriseService.deletePost(announcement.id);
      onSuccess();
    } catch (error) {
      console.error("刪除公告失敗", error);
      alert("刪除公告失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>確認刪除</DialogTitle>
      <DialogContent>
        <DialogContentText>
          確定要刪除這則企業公告「{announcement?.title || "未命名公告"}」嗎？此操作無法復原。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleDelete} color="error" disabled={loading}>
          {loading ? "刪除中..." : "確認刪除"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}