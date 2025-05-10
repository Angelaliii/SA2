"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Box,
  Alert,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { collaborationService } from '../../firebase/services/collaboration-service';

interface CancelCollaborationDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string | null;
  partnerName?: string;
  postTitle?: string;
}

export default function CancelCollaborationDialog({
  open,
  onClose,
  collaborationId,
  partnerName = '合作對象',
  postTitle = '未知文章'
}: CancelCollaborationDialogProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!collaborationId) return;
    if (!cancelReason.trim()) {
      setError('請填寫取消原因');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 調用新的直接取消合作的方法
      const result = await collaborationService.cancelCollaboration(
        collaborationId,
        cancelReason
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || '取消合作時發生錯誤');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError('取消合作時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCancelReason('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>取消與 {partnerName} 的合作</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            已成功取消合作
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            您即將取消與 {partnerName} 關於「{postTitle}」的合作，請說明取消原因：
          </Typography>
          <TextField
            fullWidth
            label="取消原因"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            multiline
            rows={4}
            disabled={loading || success}
            sx={{ mt: 1 }}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          返回
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={loading || success}
        >
          確認取消合作
        </Button>
      </DialogActions>
    </Dialog>
  );
}