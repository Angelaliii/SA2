'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
} from '@mui/material';
import { auth, db } from '../../firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

type NotificationItem = {
  id: string;
  senderId: string;
  messageContent: string;
  timestamp: any;
  postId: string;
  senderName?: string;
  postTitle?: string;
  isRead: boolean;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      const messagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', user.uid),
        orderBy('timestamp', 'desc') // 依照時間遞減排序
      );
      const querySnapshot = await getDocs(messagesQuery);

      const enriched = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const id = docSnap.id;
          let senderName = '';
          let postTitle = '';

          try {
            const clubSnap = await getDocs(
              query(collection(db, 'clubs'), where('userId', '==', data.senderId))
            );
            if (!clubSnap.empty) {
              senderName = clubSnap.docs[0].data().clubName;
            }
          } catch {}

          try {
            const postSnap = await getDoc(doc(db, 'posts', data.postId));
            if (postSnap.exists()) {
              postTitle = postSnap.data().title;
            }
          } catch {}

          return {
            id,
            senderId: data.senderId,
            messageContent: data.messageContent,
            timestamp: data.timestamp,
            postId: data.postId,
            isRead: data.isRead ?? false,
            senderName,
            postTitle,
          };
        })
      );

      setNotifications(enriched);
    });

    return () => unsubscribe();
  }, []);

  const handleClick = async (index: number, messageId: string) => {
    const current = notifications[index];
    if (current.isRead) return;

    try {
      await updateDoc(doc(db, 'messages', messageId), {
        isRead: true,
      });

      setNotifications((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, isRead: true } : item
        )
      );
    } catch (e) {
      console.error('更新已讀狀態失敗', e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((msg) => !msg.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((msg) => {
      const ref = doc(db, 'messages', msg.id);
      batch.update(ref, { isRead: true });
    });

    try {
      await batch.commit();
      setNotifications((prev) =>
        prev.map((msg) => ({ ...msg, isRead: true }))
      );
    } catch (e) {
      console.error('批次更新失敗', e);
    }
  };

  return (
    <>
      <Navbar hasUnread={notifications.some((n) => !n.isRead)} />
      <Box sx={{ pt: 10, pb: 8 }}>
        <Container maxWidth="md">
          <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">
                通知中心
              </Typography>
              <Button
                variant="outlined"
                onClick={markAllAsRead}
                disabled={notifications.every((n) => n.isRead)}
              >
                全部標記為已讀
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />

            <List>
              {notifications.map((msg, index) => (
                <React.Fragment key={msg.id}>
                  <ListItem
                    onClick={() => handleClick(index, msg.id)}
                    sx={{
                      borderRadius: 1,
                      backgroundColor: msg.isRead ? '#fff' : 'rgba(255, 0, 0, 0.1)',
                      cursor: 'pointer',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      px: 2,
                      py: 2,
                    }}
                  >
                    <ListItemText
                      primary={`寄件者：${msg.senderName || msg.senderId}`}
                      secondary={new Date(
                        msg.timestamp?.seconds
                          ? msg.timestamp.seconds * 1000
                          : msg.timestamp
                      ).toLocaleString()}
                    />
                    <Typography sx={{ mt: 1 }}>{msg.messageContent}</Typography>
                    {msg.postTitle && (
                      <Typography sx={{ mt: 1 }}>
                        👉 查看文章：
                        <Link href={`/Artical/${msg.postId}`} style={{ color: 'blue' }}>
                          {msg.postTitle}
                        </Link>
                      </Typography>
                    )}
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
