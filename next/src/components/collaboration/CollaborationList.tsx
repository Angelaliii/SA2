"use client";

import { Button, Box, Typography, Paper, Chip, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { auth, db } from '../../firebase/config';
import { collaborationService } from '../../firebase/services/collaboration-service';
import { getOrganizationName } from '../../firebase/services/post-service';
import HandshakeIcon from '@mui/icons-material/Handshake';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { CollaborationEndReviewDialog } from './CollaborationReviewDialog';
import { doc, getDoc } from 'firebase/firestore';

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
  const [organizationNames, setOrganizationNames] = useState<{[key: string]: string}>({});
  const [selectedCollaborationForReview, setSelectedCollaborationForReview] = useState<string | null>(null);
  const [reviewType, setReviewType] = useState<'complete' | 'cancel' | null>(null);

  const loadOrganizationName = async (userId: string) => {
    if (organizationNames[userId]) return organizationNames[userId];
    
    try {
      const name = await getOrganizationName(userId);
      if (name) {
        setOrganizationNames(prev => ({
          ...prev,
          [userId]: name
        }));
        return name;
      }
      return '未知組織';
    } catch (err) {
      console.error('Error loading organization name:', err);
      return '未知組織';
    }
  };

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
      const active = allCollaborations.filter(c => c.status === 'accepted' || c.status === 'pending_review');
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

  useEffect(() => {
    const loadCollaborationPartners = async () => {
      const allCollaborations = [...receivedRequests, ...sentRequests, ...acceptedCollaborations, ...completedCollaborations, ...cancelledCollaborations];
      
      for (const collab of allCollaborations) {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) continue;

        // 確定合作對象的 ID
        const partnerId = currentUserId === collab.requesterId ? collab.receiverId : collab.requesterId;
        await loadOrganizationName(partnerId);
      }
    };

    loadCollaborationPartners();
  }, [receivedRequests, sentRequests, acceptedCollaborations, completedCollaborations, cancelledCollaborations]);

  const getPartnerName = (collaboration: any) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return '未知組織';
    
    const partnerId = currentUserId === collaboration.requesterId ? collaboration.receiverId : collaboration.requesterId;
    return organizationNames[partnerId] || '載入中...';
  };
  
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
      case 'pending_review':
        return { 
          label: '等待評價', 
          color: 'warning' as const,
          icon: <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
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

  const handleOpenReview = (collaborationId: string, type: 'complete' | 'cancel') => {
    setSelectedCollaborationForReview(collaborationId);
    setReviewType(type);
  };

  const handleCloseReview = () => {
    setSelectedCollaborationForReview(null);
    setReviewType(null);
    loadCollaborations(); // 重新加載列表
  };

  // 渲染等待評價的合作項目
  const renderPendingReviewItem = (collaboration: any) => {
    const currentUserId = auth.currentUser?.uid;
    const isCurrentUserPendingReview = collaboration.pendingReviewFor === currentUserId;
    const partnerName = getPartnerName(collaboration);
    const reviewType = collaboration.completeReview ? 'complete' : 'cancel';

    return (
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
            《{collaboration.postTitle}》 - {partnerName}
          </Typography>
          <Chip
            label={isCurrentUserPendingReview ? "需要您評價" : "等待對方評價"}
            color="warning"
            size="small"
            icon={<AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          狀態更新時間：{formatDate(collaboration.updatedAt)}
        </Typography>
        {isCurrentUserPendingReview && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenReview(collaboration.id, reviewType)}
            >
              {reviewType === 'complete' ? '完成評價' : '取消評價'}
            </Button>
          </Box>
        )}
      </Paper>
    );
  };

  const renderReviewStatus = (collaboration: any) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return null;

    if (collaboration.status === 'pending_review') {
      const isCurrentUserPendingReview = collaboration.pendingReviewFor === currentUserId;
      const partnerName = getPartnerName(collaboration);
      const reviewType = collaboration.completeReview ? 'complete' : 'cancel';
      const actionText = reviewType === 'complete' ? '完成' : '取消';

      return (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {collaboration.actionInitiator === currentUserId 
              ? `等待 ${partnerName} 評價`
              : `${partnerName} 已${actionText}合作，請給予評價`}
          </Typography>
          {collaboration.completeReview && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                對方評價：{collaboration.completeReview.rating} / 5
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {collaboration.completeReview.comment}
              </Typography>
            </Box>
          )}
          {collaboration.cancelReview && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                取消原因：{collaboration.cancelReview.comment}
              </Typography>
              <Typography variant="body2">
                評價：{collaboration.cancelReview.rating} / 5
              </Typography>
            </Box>
          )}
          {isCurrentUserPendingReview && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenReview(collaboration.id, reviewType)}
              >
                {reviewType === 'complete' ? '完成評價' : '提供取消評價'}
              </Button>
            </Box>
          )}
        </Box>
      );
    }

    return null;
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
          進行中的合作
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
                  《{collaboration.postTitle}》 - {getPartnerName(collaboration)}
                </Typography>
                <Chip
                  label={getStatusDisplay(collaboration.status).label}
                  color={getStatusDisplay(collaboration.status).color}
                  size="small"
                  icon={getStatusDisplay(collaboration.status).icon}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                狀態更新時間：{formatDate(collaboration.updatedAt)}
              </Typography>
              {renderReviewStatus(collaboration)}
              {collaboration.status === 'accepted' && (
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
              )}
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            目前沒有進行中的合作
          </Typography>
        )}
      </Paper>

      {/* 等待評價的合作 */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: '#fff' }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon sx={{ mr: 1 }} />
          等待評價的合作
        </Typography>
        
        {acceptedCollaborations.filter(c => c.status === 'pending_review').length > 0 ? (
          acceptedCollaborations
            .filter(c => c.status === 'pending_review')
            .map(renderPendingReviewItem)
        ) : (
          <Typography color="text.secondary">
            目前沒有等待評價的合作
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
                  《{collaboration.postTitle}》 - {getPartnerName(collaboration)}
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
                  《{collaboration.postTitle}》 - {getPartnerName(collaboration)}
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

      <CollaborationEndReviewDialog
        open={!!selectedCollaborationForReview && !!reviewType}
        onClose={handleCloseReview}
        collaborationId={selectedCollaborationForReview}
        endType={reviewType || 'complete'}
        partnerName={selectedCollaborationForReview ? 
          getPartnerName(acceptedCollaborations.find(c => c.id === selectedCollaborationForReview)) : 
          undefined}
      />
    </Box>
  );
}