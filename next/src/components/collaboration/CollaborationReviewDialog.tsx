"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Rating,
  Switch,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { collaborationService } from '../../firebase/services/collaboration-service';
import { notificationService } from '../../firebase/services/notification-service';

interface CollaborationReviewDialogProps {
  open: boolean;
  onClose: () => void;
  collaborationId: string;
}

export default function CollaborationReviewDialog({
  open,
  onClose,
  collaborationId
}: CollaborationReviewDialogProps) {
  const [rating, setRating] = useState<{
    professionalSkill: number;
    communication: number;
    attitude: number;
    satisfaction: number;
  }>({
    professionalSkill: 0,
    communication: 0,
    attitude: 0,
    satisfaction: 0
  });

  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [collaborationPartnerId, setCollaborationPartnerId] = useState('');

  const loadCollaborationDetails = useCallback(async () => {
    try {
      const details = await collaborationService.getCollaborationById(collaborationId);
      setCollaborationPartnerId(details.partnerId);
    } catch (error) {
      console.error('Failed to load collaboration details:', error);
      setError('無法載入合作詳情');
    }
  }, [collaborationId]);

  useEffect(() => {
    if (open && collaborationId) {
      loadCollaborationDetails();
    }
  }, [open, collaborationId, loadCollaborationDetails]);

  const handleSubmit = async () => {
    // Validate all ratings are provided
    if (Object.values(rating).some(r => r === 0)) {
      setError('請完成所有評分項目');
      return;
    }

    if (!comment.trim()) {
      setError('請提供評價內容');
      return;
    }

    try {
      // Start loading state
      setSubmitting(true);
      setError(null);

      // Submit review
      await collaborationService.submitReview(collaborationId, {
        ...rating,
        comment,
        isAnonymous,
        timestamp: new Date()
      });

      // Send notification to collaboration partner
      await notificationService.sendCollaborationReview(
        collaborationPartnerId,
        collaborationId
      );

      // Show success message and close dialog
      setSnackbarMessage('評價已成功提交');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to submit review:', err);
      setError('提交評價失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>合作評價</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            {/* Professional Skills Rating */}
            <Grid item xs={12}>
              <Typography component="legend">專業能力</Typography>
              <Rating
                value={rating.professionalSkill}
                onChange={(_, value) => setRating(prev => ({ ...prev, professionalSkill: value || 0 }))}
                size="large"
              />
            </Grid>

            {/* Communication Rating */}
            <Grid item xs={12}>
              <Typography component="legend">溝通效率</Typography>
              <Rating
                value={rating.communication}
                onChange={(_, value) => setRating(prev => ({ ...prev, communication: value || 0 }))}
                size="large"
              />
            </Grid>

            {/* Cooperation Attitude Rating */}
            <Grid item xs={12}>
              <Typography component="legend">合作態度</Typography>
              <Rating
                value={rating.attitude}
                onChange={(_, value) => setRating(prev => ({ ...prev, attitude: value || 0 }))}
                size="large"
              />
            </Grid>

            {/* Overall Satisfaction Rating */}
            <Grid item xs={12}>
              <Typography component="legend">成果滿意度</Typography>
              <Rating
                value={rating.satisfaction}
                onChange={(_, value) => setRating(prev => ({ ...prev, satisfaction: value || 0 }))}
                size="large"
              />
            </Grid>

            {/* Comment Section */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="評價內容"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="請描述您的合作體驗..."
              />
            </Grid>

            {/* Anonymous Review Option */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormControlLabel
                  control={
                    <Switch
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                  }
                  label="匿名評價"
                />
                <FormHelperText>選擇匿名後，您的評價將顯示為「匿名用戶」</FormHelperText>
              </FormControl>
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitting}>
          提交評價
        </Button>
      </DialogActions>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}