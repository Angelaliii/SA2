"use client";

import { useEffect, useState } from "react";
import { db, auth } from "../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

interface MessageItem {
  senderId: string;
  messageContent: string;
  timestamp: any;
  postId: string;
}

const MessageList = () => {
  const [messages, setMessages] = useState<
    (MessageItem & { senderName?: string; postTitle?: string })[]
  >([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("❌ 尚未登入");
        return;
      }

      console.log("✅ 已登入 UID:", user.uid);
      const messagesQuery = query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid)
      );

      const querySnapshot = await getDocs(messagesQuery);
      const rawMessages: MessageItem[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as MessageItem;
        rawMessages.push(data);
      }

      // 取得發送者名稱與文章標題
      const enrichedMessages = await Promise.all(
        rawMessages.map(async (msg) => {
          let senderName = "";
          let postTitle = "";

          // 根據 senderId 查 club name
          try {
            const clubSnap = await getDocs(
              query(collection(db, "clubs"), where("userId", "==", msg.senderId))
            );
            if (!clubSnap.empty) {
              senderName = clubSnap.docs[0].data().clubName;
            }
          } catch (e) {
            console.warn("查詢 senderName 發生錯誤", e);
          }

          // 根據 postId 查文章標題
          try {
            const postSnap = await getDoc(doc(db, "posts", msg.postId));
            if (postSnap.exists()) {
              postTitle = postSnap.data().title;
            }
          } catch (e) {
            console.warn("查詢文章標題失敗", e);
          }

          return {
            ...msg,
            senderName,
            postTitle,
          };
        })
      );

      setMessages(enrichedMessages);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📥 我的收件訊息</h2>
      {messages.length === 0 ? (
        <p>尚無收到訊息</p>
      ) : (
        messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "1.5rem",
              borderBottom: "1px solid #ccc",
              paddingBottom: "1rem",
            }}
          >
            <p>
              <strong>寄件者：</strong>
              {msg.senderName || msg.senderId}
            </p>
            <p>{msg.messageContent}</p>
            {msg.postTitle && (
              <p>
                👉 查看文章：
                <Link href={`/Artical/${msg.postId}`} style={{ color: "blue" }}>
                  {msg.postTitle}
                </Link>
              </p>
            )}
            <p>
              <em>
                {new Date(
                  msg.timestamp?.seconds
                    ? msg.timestamp.seconds * 1000
                    : msg.timestamp
                ).toLocaleString()}
              </em>
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default MessageList;
