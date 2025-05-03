"use client";

import { Button, Box, Typography, Paper, Chip, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { auth } from '../../firebase/config';
import { collaborationService, CollaborationRequest } from '../../firebase/services/collaboration-service';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HandshakeIcon from '@mui/icons-material/Handshake';

interface CollaborationRequest {
  id?: string;
  postTitle: string;
  status: string;
  message?: string;
  createdAt: any;
  updatedAt?: any;
  rejectReason?: string;
}

interface CollaborationListProps {
  userType: string;
  onOpenReview: (collaborationId: string) => void;
}

export default function CollaborationList({ userType, onOpenReview }: CollaborationListProps) {
  const [receivedRequests, setReceivedRequests] = useState<CollaborationRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<CollaborationRequest[]>([]);
  const [acceptedCollaborations, setAcceptedCollaborations] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadCollaborations = async () => {
      console.log('開始載入合作記錄...');
      setLoading(true);
      setError(null);
      
      const user = auth.currentUser;
      console.log('當前用戶:', user?.uid);
      
      if (!user) {
        console.log('未登入狀態');
        setError("請先登入");
        setLoading(false);
        return;
      }
      
      try {
        console.log('開始獲取收到的合作請求...');
        const received = await collaborationService.getReceivedRequests(user.uid);
        console.log('收到的合作請求:', received);
        setReceivedRequests(received);
        
        console.log('開始獲取發送的合作請求...');
        const sent = await collaborationService.getSentRequests(user.uid);
        console.log('發送的合作請求:', sent);
        setSentRequests(sent);
        
        const receivedAccepted = received.filter((req) => req.status === 'accepted');
        const sentAccepted = sent.filter((req) => req.status === 'accepted');
        
        const allAccepted = [...receivedAccepted, ...sentAccepted];
        const uniqueAccepted = allAccepted.filter((collaboration, index, self) =>
          index === self.findIndex((c) => c.id === collaboration.id)
        );
        
        console.log('已接受的合作:', uniqueAccepted);
        setAcceptedCollaborations(uniqueAccepted);
      } catch (err) {
        console.error('載入合作記錄時發生錯誤:', err);
        setError('載入合作記錄時發生錯誤');
      } finally {
        console.log('載入完成，設置 loading 為 false');
        setLoading(false);
      }
    };
    
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
          label: '已接受', 
          color: 'success' as const,
          icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      case 'rejected':
        return { 
          label: '已拒絕', 
          color: 'error' as const,
          icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />
        };
      default:
        return { 
          label: '未知狀態', 
          color: 'default' as const,
          icon: undefined
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
                  {request.message}
                </Typography>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                <Button 
                  variant="outlined" 
                  color="error"
                  onClick={() => request.id && onOpenReview(request.id)}
                >
                  拒絕
                </Button>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => request.id && onOpenReview(request.id)}
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
                <Chip
                  label="合作中"
                  color="success"
                  size="small"
                  icon={<CheckCircleIcon fontSize="small" />}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                建立時間：{formatDate(collaboration.updatedAt)}
              </Typography>
            </Paper>
          ))
        ) : (
          <Typography color="text.secondary">
            目前沒有已建立的合作
          </Typography>
        )}
      </Paper>
    </Box>
  );
}