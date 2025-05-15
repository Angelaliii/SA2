"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Alert,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { collaborationService } from '../../firebase/services/collaboration-service';

interface AcceptCollaborationDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string | null;
  partnerName?: string;
  postTitle?: string;
}

export default function AcceptCollaborationDialog({
  open,
  onClose,
  collaborationId,
  partnerName = '合作方',
  postTitle = '文章'
}: AcceptCollaborationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (!collaborationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await collaborationService.acceptCollaboration(collaborationId);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || '接受合作請求時發生錯誤');
      }
    } catch (err) {
      console.error('接受合作請求時發生錯誤:', err);
      setError('接受合作請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        確認接受合作邀請
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            已成功接受合作請求
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <Typography>
            您確定要接受來自 <strong>{partnerName}</strong> 關於 <strong>《{postTitle}》</strong> 的合作邀請嗎？
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary' }}>
            接受後，雙方將開始合作關係。
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading || success}>
          取消
        </Button>
        <Button 
          onClick={handleAccept} 
          variant="contained" 
          color="primary" 
          disabled={loading || success}
          autoFocus
        >
          開始合作
        </Button>
      </DialogActions>
    </Dialog>
  );
}
