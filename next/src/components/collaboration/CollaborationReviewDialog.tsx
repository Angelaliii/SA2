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

interface CollaborationReviewDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string | null;
}

export default function CollaborationReviewDialog({
  open,
  onClose,
  collaborationId,
}: CollaborationReviewDialogProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    if (!collaborationId) return;
    setLoading(true);
    setError(null);

    try {
      const result = await collaborationService.updateRequestStatus(collaborationId, 'accepted');
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('處理合作請求時發生錯誤');
      }
    } catch (err) {
      setError('處理合作請求時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!collaborationId) return;
    if (!rejectReason.trim()) {
      setError('請填寫拒絕原因');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await collaborationService.updateRequestStatus(
        collaborationId,
        'rejected',
        rejectReason
      );
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('處理合作請求時發生錯誤');
      }
    } catch (err) {
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>審核合作請求</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            已成功處理合作請求
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
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          取消
        </Button>
        <Button
          onClick={handleReject}
          color="error"
          disabled={loading || success}
        >
          拒絕
        </Button>
        <Button
          onClick={handleAccept}
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