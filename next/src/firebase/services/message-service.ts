// src/firebase/services/message-service.ts
import { addDoc, collection } from "firebase/firestore";
import { db } from "../config"; // 引入 Firestore 配置

// 用來發送訊息的函式
export const sendMessage = async (senderId: string, receiverId: string, postId: string, messageContent: string, postTitle?: string) => {
  try {
    // 向 Firestore 的 "messages" 集合寫入資料
    await addDoc(collection(db, "messages"), {
      senderId,
      receiverId,
      postId,
      messageContent,
      postTitle, // 添加文章標題字段
      isRead: false,
      timestamp: new Date(),
    });

    console.log("訊息已成功發送");
  } catch (error) {
    console.error("發送訊息失敗:", error);
  }
};
