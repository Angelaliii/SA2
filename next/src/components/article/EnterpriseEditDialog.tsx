import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import enterpriseService from "../../firebase/services/enterprise-service";

type EnterpriseEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  announcement: any;
};

export default function EnterpriseEditDialog({
  open,
  onClose,
  onSuccess,
  announcement,
}: EnterpriseEditDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string>("active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && announcement) {
      setTitle(announcement.title || "");
      setContent(announcement.content || "");
      setCompanyName(announcement.companyName || "");
      setEmail(announcement.email || "");
      setStatus(announcement.status || "active");
    }
  }, [open, announcement]);

  const handleSubmit = async () => {
    if (!title || !content) {
      alert("請填寫所有必填欄位");
      return;
    }

    setLoading(true);
    try {
      await enterpriseService.updatePost(announcement.id, {
        title,
        content,
        companyName,
        email,
        status,
      });
      onSuccess();
    } catch (error) {
      console.error("更新公告失敗", error);
      alert("更新公告失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>編輯企業公告</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="公告標題"
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          sx={{ mb: 3, mt: 2 }}
        />
        <TextField
          fullWidth
          label="企業名稱"
          variant="outlined"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          sx={{ mb: 3 }}
        />
        <TextField
          fullWidth
          label="聯絡電子郵件"
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          sx={{ mb: 3 }}
        />
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="status-label">公告狀態</InputLabel>
          <Select
            labelId="status-label"
            value={status}
            label="公告狀態"
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="active">啟用</MenuItem>
            <MenuItem value="closed">關閉</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="公告內容"
          variant="outlined"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          multiline
          rows={6}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button onClick={handleSubmit} color="primary" disabled={loading}>
          {loading ? "更新中..." : "更新公告"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
