"use client";

import { Button, Box, Typography, Paper, Chip, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase/config';
import { collaborationService } from '../../firebase/services/collaboration-service';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { CollaborationEndReviewDialog } from './CollaborationReviewDialog';

interface CollaborationListProps {
  userType: string;
  onOpenReview: (collaborationId: string) => void;
}

export default function CollaborationList({ userType, onOpenReview }: CollaborationListProps) {
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [acceptedCollaborations, setAcceptedCollaborations] = useState<any[]>([]);
  const [completedCollaborations, setCompletedCollaborations] = useState<any[]>([]);
  const [cancelledCollaborations, setCancelledCollaborations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollaboration, setSelectedCollaboration] = useState<string | null>(null);
  const [endReviewType, setEndReviewType] = useState<'complete' | 'cancel' | null>(null);

  const loadCollaborations = async () => {
    setLoading(true);
    setError(null);
    
    const user = auth.currentUser;
    if (!user) {
      setError("請先登入");
      setLoading(false);
      return;
    }
    
    try {
      // 獲取收到的合作請求
      const received = await collaborationService.getReceivedRequests(user.uid);
      setReceivedRequests(received);
      
      // 獲取發送的合作請求
      const sent = await collaborationService.getSentRequests(user.uid);
      setSentRequests(sent);
      
      // 合併所有合作記錄並去重
      const allCollaborations = [...received, ...sent].filter(
        (collaboration, index, self) =>
          index === self.findIndex((c) => c.id === collaboration.id)
      );
      
      // 分類合作記錄
      const active = allCollaborations.filter(c => c.status === 'accepted');
      const completed = allCollaborations.filter(c => c.status === 'complete');
      const cancelled = allCollaborations.filter(c => c.status === 'cancel');
      
      setAcceptedCollaborations(active);
      setCompletedCollaborations(completed);
      setCancelledCollaborations(cancelled);
    } catch (err) {
      console.error('Error loading collaborations:', err);
      setError('載入合作記錄時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollaborations();
  }, []);
  
  // 獲取請求狀態的顯示值和顏色
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return { 
          label: '待審核', 
          color: 'warning' as const,
          icon: <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'accepted':
        return { 
          label: '進行中', 
          color: 'success' as const,
          icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'rejected':
        return { 
          label: '已拒絕', 
          color: 'error' as const,
          icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'complete':
        return { 
          label: '已完成', 
          color: 'primary' as const,
          icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'cancel':
        return { 
          label: '已取消', 
          color: 'error' as const,
          icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      default:
        return { 
          label: '未知狀態', 
          color: 'default' as const,
          icon: null
        };
    }
  };
  
  // 格式化日期
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '未知時間';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return '日期格式錯誤';
    }
  };

  const handleOpenEndReview = (collaborationId: string, type: 'complete' | 'cancel') => {
    setSelectedCollaboration(collaborationId);
    setEndReviewType(type);
  };

  const handleCloseEndReview = async () => {
    setSelectedCollaboration(null);
    setEndReviewType(null);
    // 重新加載合作列表
    await loadCollaborations();
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Typography color="error" sx={{ py: 2 }}>
        {error}
      </Typography>
    );
  }
  
  // 依照用戶身份顯示不同的標題
  const pendingRequestsTitle = userType === 'club'
    ? '待審核的合作請求'
    : '等待企業審核的合作請求';
  
  const noRequestsText = userType === 'club'
    ? '目前沒有待審核的合作請求'
    : '目前沒有等待審核的合作申請';
  
  return (
    <Box>
      {/* 待處理的合作請求 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <HandshakeIcon sx={{ mr: 1 }} />
          {pendingRequestsTitle}
        </Typography>
        
        {receivedRequests.filter(req => req.status === 'pending').length > 0 ? (
          receivedRequests.filter(req => req.status === 'pending').map((request) => (
            <Paper 
              key={request.id}
              elevation={0}
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#fafafa'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  《{request.postTitle}》合作申請
                </Typography>
                <Chip
                  label={getStatusDisplay(request.status).label}
                  color={getStatusDisplay(request.status).color}
                  size="small"
                  icon={getStatusDisplay(request.status).icon}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                申請時間：{formatDate(request.createdAt)}
              </Typography>
              
              {request.message && (
                <Typography variant="body2" sx={{ mb: 2, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                  "{request.message}"
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => onOpenReview(request.id)}
                >
                  拒絕
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => onOpenReview(request.id)}
                >
                  接受
                </Button>
              </Box>
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            {noRequestsText}
          </Typography>
        )}
      </Paper>
      
      {/* 我發起的合作請求 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <HandshakeIcon sx={{ mr: 1 }} />
          我發起的合作請求
        </Typography>
        
        {sentRequests.length > 0 ? (
          sentRequests.map((request) => (
            <Paper 
              key={request.id}
              elevation={0}
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#fafafa'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  《{request.postTitle}》合作申請
                </Typography>
                <Chip
                  label={getStatusDisplay(request.status).label}
                  color={getStatusDisplay(request.status).color}
                  size="small"
                  icon={getStatusDisplay(request.status).icon}
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                申請時間：{formatDate(request.createdAt)}
              </Typography>
              
              {request.status === 'rejected' && request.rejectReason && (
                <Typography variant="body2" sx={{ color: 'error.main', mt: 1 }}>
                  拒絕原因：{request.rejectReason}
                </Typography>
              )}
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            您尚未發起任何合作請求
          </Typography>
        )}
      </Paper>
      
      {/* 已建立的合作 */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          已建立的合作關係
        </Typography>
        
        {acceptedCollaborations.length > 0 ? (
          acceptedCollaborations.map((collaboration) => (
            <Paper 
              key={collaboration.id}
              elevation={0}
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#fafafa'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  《{collaboration.postTitle}》
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                建立時間：{formatDate(collaboration.updatedAt)}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleOpenEndReview(collaboration.id, 'cancel')}
                >
                  取消合作
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenEndReview(collaboration.id, 'complete')}
                >
                  完成合作
                </Button>
              </Box>
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            目前沒有已建立的合作
          </Typography>
        )}
      </Paper>

      {/* 已完成的合作 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CheckCircleIcon sx={{ mr: 1 }} />
          已完成的合作
        </Typography>
        
        {completedCollaborations.length > 0 ? (
          completedCollaborations.map((collaboration) => (
            <Paper 
              key={collaboration.id}
              elevation={0}
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#fafafa'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  《{collaboration.postTitle}》
                </Typography>
                <Chip
                  label={getStatusDisplay(collaboration.status).label}
                  color={getStatusDisplay(collaboration.status).color}
                  size="small"
                  icon={getStatusDisplay(collaboration.status).icon}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                完成時間：{formatDate(collaboration.completeReview?.reviewedAt)}
              </Typography>
              {collaboration.completeReview && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    評價：{collaboration.completeReview.rating} / 5
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {collaboration.completeReview.comment}
                  </Typography>
                </Box>
              )}
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            目前沒有已完成的合作
          </Typography>
        )}
      </Paper>

      {/* 已取消的合作 */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <CancelIcon sx={{ mr: 1 }} />
          已取消的合作
        </Typography>
        
        {cancelledCollaborations.length > 0 ? (
          cancelledCollaborations.map((collaboration) => (
            <Paper 
              key={collaboration.id}
              elevation={0}
              sx={{ 
                p: 2.5, 
                mb: 2, 
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.08)',
                bgcolor: '#fafafa'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="medium">
                  《{collaboration.postTitle}》
                </Typography>
                <Chip
                  label={getStatusDisplay(collaboration.status).label}
                  color={getStatusDisplay(collaboration.status).color}
                  size="small"
                  icon={getStatusDisplay(collaboration.status).icon}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                取消時間：{formatDate(collaboration.cancelReview?.reviewedAt)}
              </Typography>
              {collaboration.cancelReview && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    評價：{collaboration.cancelReview.rating} / 5
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    取消原因：{collaboration.cancelReview.comment}
                  </Typography>
                </Box>
              )}
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            目前沒有已取消的合作
          </Typography>
        )}
      </Paper>

      <CollaborationEndReviewDialog
        open={!!selectedCollaboration && !!endReviewType}
        onClose={handleCloseEndReview}
        collaborationId={selectedCollaboration}
        endType={endReviewType || 'complete'}
      />
    </Box>
  );
}