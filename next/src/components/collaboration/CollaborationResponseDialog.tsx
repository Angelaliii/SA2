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
} from '@mui/material';
import { useState } from 'react';
import { collaborationService } from '../../firebase/services/collaboration-service';

interface CollaborationResponseDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string | null;
  partnerName?: string;
}

export default function CollaborationResponseDialog({
  open,
  onClose,
  collaborationId,
  partnerName = '合作方'
}: CollaborationResponseDialogProps) {  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReject = async () => {
    if (!collaborationId) return;
    
    // 驗證表單
    if (!rejectReason.trim()) {
      setError('請填寫拒絕原因');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await collaborationService.rejectCollaboration(collaborationId, rejectReason);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || '處理合作請求時發生錯誤');
      }
    } catch (err) {
      console.error('處理合作請求時發生錯誤:', err);
      setError('處理合作請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => {
    setRejectReason('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>      <DialogTitle>
        拒絕來自 {partnerName} 的合作請求
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            請求已拒絕成功
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="拒絕原因"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={4}
            disabled={loading || success}
            required
            placeholder="請填寫拒絕原因，此訊息將發送給對方"
          />
        </Box>
      </DialogContent>      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleReject}
          color="error"
          variant="contained"
          disabled={loading || success}
        >
          確認拒絕
        </Button>
      </DialogActions>
    </Dialog>
  );
}