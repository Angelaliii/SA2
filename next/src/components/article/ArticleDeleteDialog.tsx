import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import React, { useState } from "react";
import { deletePost } from "../../firebase/services/post-service";

type ArticleDeleteDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  article: any;
};

export default function ArticleDeleteDialog({
  open,
  onClose,
  onSuccess,
  article,
}: ArticleDeleteDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!article?.id) return;

    setLoading(true);
    try {
      await deletePost(article.id);
      onSuccess();
    } catch (error) {
      console.error("刪除文章失敗", error);
      alert("刪除文章失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>確認刪除</DialogTitle>
      <DialogContent>
        <DialogContentText>
          確定要刪除這篇需求文章「{article?.title || "未命名文章"}」嗎？此操作無法復原。
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