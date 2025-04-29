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
import React, { useEffect, useState } from "react";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth, db } from "../../firebase/config";

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
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

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
                  <Button
                    variant="outlined"
                    onClick={markAllAsRead}
                    disabled={notifications.every((n) => n.isRead)}
                  >
                    全部標記為已讀
                  </Button>
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
                            {msg.messageContent}
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
