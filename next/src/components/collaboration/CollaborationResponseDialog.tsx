"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
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
  partnerName = '合作對象'
}: CollaborationResponseDialogProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [action, setAction] = useState<'accept' | 'reject' | null>(null);

  const handleAction = async (actionType: 'accept' | 'reject') => {
    if (!collaborationId) return;
    if (actionType === 'reject' && !rejectReason.trim()) {
      setError('請填寫拒絕原因');
      return;
    }

    setLoading(true);
    setError(null);
    setAction(actionType);

    try {
      console.log('Updating request status:', collaborationId, actionType);
      const result = await collaborationService.updateRequestStatus(
        collaborationId,
        actionType === 'accept' ? 'accepted' : 'rejected',
        actionType === 'reject' ? rejectReason : undefined
      );
      
      console.log('Request status update result:', result);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError((result.error as string) || '處理合作請求時發生錯誤');
      }
    } catch (err) {
      console.error('Error in handleAction:', err);
      setError('處理合作請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRejectReason('');
    setError(null);
    setSuccess(false);
    setAction(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>來自 {partnerName} 的合作申請</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {action === 'accept' ? '已接受合作請求' : '已拒絕合作請求'}
          </Alert>
        )}
        <TextField
          fullWidth
          label="原因（若選擇拒絕時必填）"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          multiline
          rows={4}
          disabled={loading || success}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={() => handleAction('reject')}
          color="error"
          disabled={loading || success}
        >
          拒絕
        </Button>
        <Button
          onClick={() => handleAction('accept')}
          variant="contained"
          color="primary"
          disabled={loading || success}
        >
          接受
        </Button>
      </DialogActions>
    </Dialog>
  );
}