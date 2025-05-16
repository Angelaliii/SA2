import React, { useState, useEffect, useRef } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Button,
  Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { auth, db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import Link from 'next/link';
import ArticleIcon from '@mui/icons-material/Article';
import HandshakeIcon from '@mui/icons-material/Handshake';

interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  messageContent?: string;
  createdAt: Date;
  timestamp?: any;
  read: boolean;
  isRead?: boolean;
  type?: string;
  link?: string;
  sourceType: 'notification' | 'message';
  entityId?: string;
  postId?: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  const notificationsRef = useRef<NotificationItem[]>([]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    setLoading(true);
    const userId = auth.currentUser.uid;

    // 獲取訂閱通知
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // 獲取消息通知
    const messagesQuery = query(
      collection(db, "messages"),
      where("receiverId", "==", userId),
      orderBy("timestamp", "desc")
    );

    // 訂閱 notifications 集合的變化
    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        message: doc.data().message,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        read: doc.data().read || false,
        type: doc.data().type,
        link: doc.data().link,
        sourceType: 'notification' as const,
        entityId: doc.data().entityId
      }));
      
      updateNotifications(notificationData, 'notification');
    });

    // 訂閱 messages 集合的變化
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        messageContent: doc.data().messageContent,
        createdAt: doc.data().timestamp?.toDate() || new Date(),
        read: doc.data().isRead || false,
        isRead: doc.data().isRead || false,
        type: doc.data().type,
        sourceType: 'message' as const,
        postId: doc.data().postId,
        senderId: doc.data().senderId,
      }));
      
      updateNotifications(messageData, 'message');
    });

    // 更新通知狀態，合併兩種來源的通知
    const updateNotifications = (newData: NotificationItem[], sourceType: 'notification' | 'message') => {
      setNotifications(prevNotifications => {
        // 過濾掉同類型的舊通知，保留另一種類型的通知
        const filteredPrevNotifications = prevNotifications.filter(
          notification => notification.sourceType !== sourceType
        );
        
        // 合併新通知和舊通知
        const combinedNotifications = [...filteredPrevNotifications, ...newData];
        
        // 按時間排序
        combinedNotifications.sort((a, b) => 
          b.createdAt.getTime() - a.createdAt.getTime()
        );
        
        // 更新引用和未讀計數
        notificationsRef.current = combinedNotifications;
        const unreadCount = combinedNotifications.filter(
          notification => !notification.read && !notification.isRead
        ).length;
        setUnreadCount(unreadCount);
        
        setLoading(false);
        return combinedNotifications;
      });
    };

    return () => {
      unsubscribeNotifications();
      unsubscribeMessages();
    };
  }, []);

  const markAsRead = async (notification: NotificationItem) => {
    if (!auth.currentUser) return;
    
    try {
      if (notification.sourceType === 'notification') {
        const notificationRef = doc(db, "notifications", notification.id);
        await updateDoc(notificationRef, {
          read: true
        });
      } else if (notification.sourceType === 'message') {
        const messageRef = doc(db, "messages", notification.id);
        await updateDoc(messageRef, {
          isRead: true
        });
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser || !notificationsRef.current.length) return;
    
    try {
      // 獲取所有未讀通知
      const unreadNotifications = notificationsRef.current.filter(
        notification => !notification.read && !notification.isRead
      );
      
      // 分別處理不同類型的通知
      const markReadPromises = unreadNotifications.map(notification => {
        if (notification.sourceType === 'notification') {
          const notificationRef = doc(db, "notifications", notification.id);
          return updateDoc(notificationRef, { read: true });
        } else if (notification.sourceType === 'message') {
          const messageRef = doc(db, "messages", notification.id);
          return updateDoc(messageRef, { isRead: true });
        }
      });
      
      await Promise.all(markReadPromises);
      
      // 更新本地狀態
      const updatedNotifications = notificationsRef.current.map(notification => ({
        ...notification,
        read: true,
        isRead: true
      }));
      
      notificationsRef.current = updatedNotifications;
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read && !notification.isRead) {
      markAsRead(notification);
    }
    
    handleClose();
  };

  // 取得通知連結
  const getNotificationLink = (notification: NotificationItem) => {
    if (notification.sourceType === 'notification' && notification.link) {
      return notification.link;
    } else if (notification.sourceType === 'message' && notification.postId) {
      return `/Artical/${notification.postId}`;
    }
    return '#';
  };

  // 格式化通知時間
  const formatNotificationTime = (date: Date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true, locale: zhTW });
    } catch {
      return '未知時間';
    }
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        color="inherit"
        aria-label="notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        id="notifications-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notifications-button',
        }}
        PaperProps={{
          style: {
            maxHeight: '400px',
            width: '350px',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">通知</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              全部標為已讀
            </Button>
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={30} />
          </Box>
        ) : notifications.length > 0 ? (
          <List sx={{ width: '100%', pt: 0, maxHeight: 320, overflow: 'auto' }}>
            {notifications.map((notification) => {
              const isNotificationRead = notification.sourceType === 'notification' 
                ? notification.read 
                : notification.isRead;
              
              const notificationContent = notification.sourceType === 'notification'
                ? notification.message
                : notification.messageContent;
                
              const notificationTitle = notification.sourceType === 'notification' 
                ? notification.title 
                : notification.type === 'collaboration_request' 
                  ? '合作請求' 
                  : '訊息通知';

              return (
                <React.Fragment key={`${notification.sourceType}-${notification.id}`}>
                  <ListItem
                    alignItems="flex-start"
                    component={Link}
                    href={getNotificationLink(notification)}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      textDecoration: 'none',
                      color: 'inherit',
                      backgroundColor: isNotificationRead ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                      display: 'flex',
                      gap: 1,
                      padding: 1.5
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: isNotificationRead ? 'grey.300' : 'primary.main' }}>
                        {notification.type === 'subscription' ? <ArticleIcon /> : 
                         notification.type?.includes('collaboration') ? <HandshakeIcon /> :
                         <NotificationsIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: isNotificationRead ? 'normal' : 'bold' }}>
                          {notificationTitle}
                        </Typography>
                        {notification.type === 'subscription' && (
                          <Chip 
                            label="訂閱" 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ height: 20, fontSize: '0.7rem' }} 
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                        {notificationContent}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatNotificationTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">沒有通知</Typography>
          </Box>
        )}
      </Menu>
    </>
  );
}