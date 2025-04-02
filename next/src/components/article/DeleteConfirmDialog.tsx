// 刪除確認對話框組件
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { DeleteDialogProps } from "../../types/article";

/**
 * 通用的刪除確認對話框組件
 */
export default function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>確認刪除</DialogTitle>
      <DialogContent>
        <DialogContentText>
          確定要刪除此草稿嗎？此操作無法復原。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onConfirm} color="error" autoFocus>
          刪除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
