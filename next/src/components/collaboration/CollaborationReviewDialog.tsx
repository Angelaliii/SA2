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
  Rating,
  Typography,
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

interface CollaborationEndReviewDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string | null;
  endType: 'complete' | 'cancel';
}

export function CollaborationEndReviewDialog({
  open,
  onClose,
  collaborationId,
  endType,
}: CollaborationEndReviewDialogProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!collaborationId) return;
    if (!rating) {
      setError('請為合作評分');
      return;
    }
    if (!comment.trim()) {
      setError('請填寫評價內容');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await collaborationService.updateCollaborationStatus(
        collaborationId,
        endType,
        {
          rating,
          comment,
        }
      );
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError('處理合作評價時發生錯誤');
      }
    } catch (err) {
      setError('處理合作評價時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(null);
    setComment('');
    setError(null);
    setSuccess(false);
    onClose();
  };

  const title = endType === 'complete' ? '合作完成評價' : '合作取消評價';
  const submitText = endType === 'complete' ? '完成合作' : '取消合作';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            評價已送出
          </Alert>
        )}
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography component="legend">為此次合作評分</Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
            />
          </Box>
          <TextField
            fullWidth
            label={endType === 'complete' ? "合作評價" : "取消原因"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
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
          onClick={handleSubmit}
          variant="contained"
          color={endType === 'complete' ? "primary" : "error"}
          disabled={loading || success}
        >
          {submitText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}