"use client";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  Paper,
  Typography,
} from "@mui/material";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth, db } from "../../firebase/config";
import HandshakeIcon from '@mui/icons-material/Handshake';

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
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [hasCollaborationMessages, setHasCollaborationMessages] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoggedIn(!!user);
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const messagesQuery = query(
          collection(db, "messages"),
          where("receiverId", "==", user.uid),
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(messagesQuery);

        const enriched = await Promise.all(
          querySnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const id = docSnap.id;
            let senderName = "";
            let postTitle = "";

            try {
              const clubSnap = await getDocs(
                query(
                  collection(db, "clubs"),
                  where("userId", "==", data.senderId)
                )
              );
              if (!clubSnap.empty) {
                senderName = clubSnap.docs[0].data().clubName;
              } else {
                const companySnap = await getDocs(
                  query(
                    collection(db, "companies"),
                    where("userId", "==", data.senderId)
                  )
                );
                if (!companySnap.empty) {
                  senderName = companySnap.docs[0].data().companyName;
                } else {
                  senderName = data.senderId;
                }
              }
            } catch (err) {
              console.error("查詢寄件者資訊失敗:", err);
              senderName = data.senderId;
            }

            try {
              const postSnap = await getDoc(doc(db, "posts", data.postId));
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

        // 檢查是否有合作相關的訊息
        const hasCollaboration = enriched.some(msg => 
          msg.messageContent.includes('合作') || 
          msg.messageContent.includes('申請') || 
          msg.messageContent.includes('婉拒') ||
          msg.messageContent.includes('邀請') ||
          msg.messageContent.includes('意願')
        );
        setHasCollaborationMessages(hasCollaboration);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleClick = async (index: number, messageId: string) => {
    const current = notifications[index];
    if (current.isRead) return;

    try {
      await updateDoc(doc(db, "messages", messageId), {
        isRead: true,
      });

      setNotifications((prev) =>
        prev.map((item, i) => (i === index ? { ...item, isRead: true } : item))
      );
    } catch (e) {
      console.error("更新已讀狀態失敗", e);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((msg) => !msg.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((msg) => {
      const ref = doc(db, "messages", msg.id);
      batch.update(ref, { isRead: true });
    });

    try {
      await batch.commit();
      setNotifications((prev) => prev.map((msg) => ({ ...msg, isRead: true })));
    } catch (e) {
      console.error("批次更新失敗", e);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "未知日期";
    try {
      return new Date(
        timestamp?.seconds ? timestamp.seconds * 1000 : timestamp
      ).toLocaleString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      console.error("Date formatting error:", err);
      return "日期格式錯誤";
    }
  };

  const navigateToCollaborations = () => {
    router.push("/Profile?searchTerm=4");
  };

  const renderMessageWithClickableTitle = (messageContent: string, postId?: string, postTitle?: string) => {
    if (!postTitle || !postId) return messageContent;

    // 檢查訊息中是否包含文章標題，如「文章標題」這樣的格式
    const regex = new RegExp(`「([^」]*)」`, 'g');
    let matches;
    let lastIndex = 0;
    const result = [];
    let foundMatch = false;
    
    while ((matches = regex.exec(messageContent)) !== null) {
      const matchText = matches[1];
      
      // 只有當匹配到的文字是文章標題時才處理
      if (matchText === postTitle) {
        foundMatch = true;
        // 添加匹配前的文字
        if (matches.index > lastIndex) {
          result.push(messageContent.substring(lastIndex, matches.index + 1)); // +1 to include the opening quote
        }
        
        // 添加帶有鏈接的標題
        result.push(
          <Link key={matches.index} href={`/Artical/${postId}`} style={{ 
            color: "#1976d2", 
            textDecoration: "none", 
            fontWeight: "medium" 
          }}>
            {matchText}
          </Link>
        );
        
        // 更新 lastIndex 為匹配結束位置
        lastIndex = matches.index + matches[0].length - 1; // -1 to exclude the closing quote
      }
    }
    
    // 添加剩餘的文字
    if (lastIndex < messageContent.length) {
      result.push(messageContent.substring(lastIndex));
    }
    
    // 如果沒有找到匹配，但有 postTitle 和 postId，強制添加一個隱藏的連結
    if (!foundMatch && postTitle && postId) {
      return (
        <>
          {messageContent}
          <Box sx={{ display: 'none' }}>
            <Link href={`/Artical/${postId}`}>{postTitle}</Link>
          </Box>
        </>
      );
    }
    
    return result.length > 0 ? <>{result}</> : messageContent;
  };

  return (
    <>
      <Navbar hasUnread={notifications.some((n) => !n.isRead)} />

      {isLoggedIn === false ? (
        <LoginPrompt />
      ) : (
        <Box
          sx={{
            display: "flex",
            pt: "64px",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f2f2f7",
          }}
        >
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 4 },
            }}
          >
            <Container maxWidth="md" sx={{ pb: 5 }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  mb: 4,
                  borderRadius: 3,
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                    flexWrap: 'wrap',
                    gap: 1
                  }}
                >
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      color: (theme) => theme.palette.primary.main,
                    }}
                  >
                    通知中心
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {hasCollaborationMessages && (
                      <Button 
                        variant="outlined" 
                        color="primary"
                        startIcon={<HandshakeIcon />}
                        onClick={navigateToCollaborations}
                      >
                        查看合作請求
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      onClick={markAllAsRead}
                      disabled={notifications.every((n) => n.isRead)}
                    >
                      全部標記為已讀
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />

                {loading ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", my: 5 }}
                  >
                    <CircularProgress />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 5 }}>
                    <Typography variant="h6" color="text.secondary">
                      目前沒有通知
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      當有人與您互動時，您將在此收到通知
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {notifications.map((msg, index) => (
                      <React.Fragment key={msg.id}>
                        <ListItem
                          onClick={() => handleClick(index, msg.id)}
                          sx={{
                            borderRadius: 2,
                            backgroundColor: msg.isRead
                              ? "transparent"
                              : "rgba(25, 118, 210, 0.05)",
                            cursor: "pointer",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            px: 3,
                            py: 2,
                            transition: "all 0.2s",
                            border: msg.isRead
                              ? "1px solid rgba(0, 0, 0, 0.08)"
                              : "1px solid rgba(25, 118, 210, 0.3)",
                            "&:hover": {
                              backgroundColor: msg.isRead
                                ? "rgba(0, 0, 0, 0.03)"
                                : "rgba(25, 118, 210, 0.08)",
                              boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              width: "100%",
                              mb: 1,
                            }}
                          >
                            <Typography
                              fontWeight={msg.isRead ? "normal" : "bold"}
                            >
                              {msg.senderName ?? msg.senderId}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(msg.timestamp)}
                            </Typography>
                          </Box>
                          <Typography sx={{ mt: 1, mb: 1 }}>
                            {renderMessageWithClickableTitle(msg.messageContent, msg.postId, msg.postTitle)}
                          </Typography>
                          {msg.postTitle && (
                            <Box
                              sx={{
                                mt: 1,
                                p: 1.5,
                                bgcolor: "rgba(0,0,0,0.02)",
                                borderRadius: 1,
                                width: "100%",
                              }}
                            >
                              <Typography variant="body2">
                                相關文章：
                                <Link
                                  href={`/Artical/${msg.postId}`}
                                  style={{
                                    color: "#1976d2",
                                    textDecoration: "none",
                                    fontWeight: "medium",
                                  }}
                                >
                                  {msg.postTitle}
                                </Link>
                              </Typography>
                            </Box>
                          )}
                          
                          {msg.messageContent.includes('合作') && (
                            <Box sx={{ mt: 2, alignSelf: 'flex-end' }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<HandshakeIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToCollaborations();
                                }}
                              >
                                前往審核合作請求
                              </Button>
                            </Box>
                          )}
                        </ListItem>
                        <Divider sx={{ my: 2 }} />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Container>
          </Box>
        </Box>
      )}
    </>
  );
}
