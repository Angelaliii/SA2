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
import { useState, useEffect } from 'react';
import { collaborationService } from '../../firebase/services/collaboration-service';
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/config";

interface CollaborationReviewDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string | null;
  partnerName?: string;
}

export default function CollaborationReviewDialog({
  open,
  onClose,
  collaborationId,
  partnerName = '合作對象'
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
      <DialogTitle>審核來自 {partnerName} 的合作請求</DialogTitle>
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
  partnerName?: string;
}

export function CollaborationEndReviewDialog({
  open,
  onClose,
  collaborationId,
  endType,
  partnerName = '合作對象'
}: CollaborationEndReviewDialogProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPendingReview, setIsPendingReview] = useState(false);

  useEffect(() => {
    const checkPendingReview = async () => {
      if (!collaborationId) return;
      try {
        const docRef = doc(db, "collaborations", collaborationId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentUserId = auth.currentUser?.uid;
          setIsPendingReview(data.pendingReviewFor === currentUserId);
        }
      } catch (err) {
        console.error("Error checking pending review:", err);
      }
    };
    checkPendingReview();
  }, [collaborationId]);

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
      let result;
      if (isPendingReview) {
        result = await collaborationService.submitReview(
          collaborationId,
          {
            rating,
            comment,
          }
        );
      } else {
        result = await collaborationService.updateCollaborationStatus(
          collaborationId,
          endType,
          {
            rating,
            comment,
          }
        );
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || '處理合作評價時發生錯誤');
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

  const title = isPendingReview 
    ? `對方${endType === 'complete' ? '已完成' : '已取消'}合作，請給予評價`
    : endType === 'complete' ? '合作完成評價' : '合作取消評價';

  const submitText = isPendingReview 
    ? '提交評價'
    : endType === 'complete' ? '完成合作' : '取消合作';

  const promptText = isPendingReview
    ? `${partnerName} ${endType === 'complete' ? '已完成合作' : '已取消合作'}，請給予評價：`
    : endType === 'complete' 
      ? `您即將完成與 ${partnerName} 的合作，請給予評價：`
      : `您即將取消與 ${partnerName} 的合作，請說明原因：`;

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
          <Typography variant="body1" color="text.secondary">
            {promptText}
          </Typography>
          <Box>
            <Typography component="legend">為此次合作評分</Typography>
            <Rating
              value={rating}
              onChange={(event, newValue) => {
                setRating(newValue);
              }}
              disabled={loading || success}
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
            required
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