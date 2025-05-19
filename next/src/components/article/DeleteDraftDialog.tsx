import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

/**
 * 刪除草稿確認對話框
 * 確認用戶是否真的要刪除草稿
 */
export default function DeleteDraftDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>刪除草稿</DialogTitle>
      <DialogContent>
        <DialogContentText>
          確定要刪除此草稿嗎？此操作無法撤銷。
        </DialogContentText>
      </DialogContent>{" "}
      <DialogActions>
        <Button
          onClick={(e) => {
            e.preventDefault();
            onClose();
          }}
          color="primary"
        >
          取消
        </Button>
        <Button
          onClick={(e) => {
            e.preventDefault();
            onConfirm();
          }}
          color="error"
          autoFocus
        >
          刪除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
