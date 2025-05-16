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
  // 訊息格式轉換函數
  const transformMessageContent = (content: string): string => {
    // 🟡 合作回應相關 - 先檢查更特定的情況
    if (content.includes('接受您的合作請求') || content.includes('合作請求已被接受')) {
      return '接受您的合作請求！請前往[個人資料頁面](/Profile)審核合作邀約~';
    }
      
    // 婉拒合作 - 先檢查更特定的情況
    if (content.includes('婉拒合作') || content.includes('已被婉拒') || content.includes('合作請求已被婉拒')) {
      const reasonMatch = content.match(/原因：(.*?)($|\n)/);
      const reason = reasonMatch ? reasonMatch[1] : '';
      console.log('找到婉拒消息，原因:', reason); // 添加日誌以便調試
      return `婉拒您的合作請求。\n原因：${reason}`;
    }
      
    // 🔵 一般合作意願訊息
    if (content.includes('有意願和你合作') && !content.includes('請求') && !content.includes('接受') && !content.includes('婉拒')) {
      return '有意願和你合作，請前往[個人資料頁面](/Profile)審核合作邀約~';
    }
      
    // 🟢 合作請求相關 - 最後檢查最一般的情況
    if ((content.includes('合作請求') && !content.includes('已被婉拒')) || 
        (content.includes('有意願和你合作') && content.includes('請求'))) {
      return '有意願和你合作。請前往 [個人資料頁面](/Profile) 審核合作邀約~';
    }
    
    // 合作已完成
    if (content.includes('合作已完成')) {
      const messageMatch = content.match(/評價：(.*?)($|\n)/);
      const message = messageMatch ? messageMatch[1] : '';
      return `已經填寫完評價。您有合作完成囉~\n${message}`;
    }
      // 填寫評價
    if (content.includes('填寫評價')) {
      return '已經填寫完評價，請至[個人資料頁面](/Profile)完成評價~';
    }
    
    return content;
  };

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

            // 套用訊息格式轉換
            const transformedMessage = transformMessageContent(data.messageContent);

            return {
              id,
              senderId: data.senderId,
              messageContent: transformedMessage,
              timestamp: data.timestamp,
              postId: data.postId,
              isRead: data.isRead ?? false,
              senderName,
              postTitle,
            };
          })
        );        setNotifications(enriched);
      } catch (error) {
        console.error("載入通知時發生錯誤:", error);
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
  };  const renderMessageWithClickableTitle = (messageContent: string, postId?: string, postTitle?: string) => {
    // 新增：先處理方括號格式的連結 [文字](/連結)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let linkMatches;
    const links = [];
    
    while ((linkMatches = linkRegex.exec(messageContent)) !== null) {
      const [fullMatch, text, url] = linkMatches;
      links.push({ fullMatch, text, url, index: linkMatches.index });
    }
    
    // 如果找到方括號格式的連結
    if (links.length > 0) {
      let linkLastIndex = 0;
      const linkResult = [];
      
      links.forEach(link => {
        // 添加連結前的文字
        if (link.index > linkLastIndex) {
          linkResult.push(messageContent.substring(linkLastIndex, link.index));
        }
        
        // 添加帶有鏈接的文字
        linkResult.push(
          <Link key={link.index} href={link.url} style={{ 
            color: "#1976d2", 
            textDecoration: "none", 
            fontWeight: "medium" 
          }}>
            {link.text}
          </Link>
        );
        
        // 更新 linkLastIndex
        linkLastIndex = link.index + link.fullMatch.length;
      });
      
      // 添加剩餘的文字
      if (linkLastIndex < messageContent.length) {
        linkResult.push(messageContent.substring(linkLastIndex));
      }
      
      return <>{linkResult}</>;
    }
    
    // 舊的處理邏輯：檢查訊息中是否包含文章標題，如「文章標題」這樣的格式
    if (!postTitle || !postId) return messageContent;
    
    const regex = new RegExp(`「([^」]*)」`, 'g');
    let matches;
    let titleLastIndex = 0;
    const titleResult = [];
    let foundMatch = false;
    
    while ((matches = regex.exec(messageContent)) !== null) {
      const matchText = matches[1];
      
      // 只有當匹配到的文字是文章標題時才處理
      if (matchText === postTitle) {
        foundMatch = true;
        // 添加匹配前的文字
        if (matches.index > titleLastIndex) {
          titleResult.push(messageContent.substring(titleLastIndex, matches.index + 1)); // +1 to include the opening quote
        }
        
        // 添加帶有鏈接的標題
        titleResult.push(
          <Link key={matches.index} href={`/Artical/${postId}`} style={{ 
            color: "#1976d2", 
            textDecoration: "none", 
            fontWeight: "medium" 
          }}>
            {matchText}
          </Link>
        );
        
        // 更新 titleLastIndex 為匹配結束位置
        titleLastIndex = matches.index + matches[0].length - 1; // -1 to exclude the closing quote
      }
    }
    
    // 添加剩餘的文字
    if (titleLastIndex < messageContent.length) {
      titleResult.push(messageContent.substring(titleLastIndex));
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
    
    return titleResult.length > 0 ? <>{titleResult}</> : messageContent;
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
                            position: 'relative',
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
