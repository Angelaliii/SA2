"use client";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase/config";
import { useAuth } from "./useAuth";

// 創建一個用於通知的 Context
type NotificationContextType = {
  hasUnreadNotifications: boolean;
};

const NotificationContext = createContext<NotificationContextType>({
  hasUnreadNotifications: false,
});

// 創建一個用於通知的 Provider
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 在服務器端渲染時或客戶端初始渲染時，總是從 false 開始
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const { user } = useAuth();
  const [isClientSide, setIsClientSide] = useState(false);

  // 確認是否在客戶端
  useEffect(() => {
    setIsClientSide(true);
  }, []);

  useEffect(() => {
    // 如果不是客戶端或用戶未登入，不進行監聽
    if (!isClientSide || !user) {
      setHasUnreadNotifications(false);
      return;
    }

    // 監聽 messages 集合裡屬於當前用戶且未讀的通知
    const unsubscribe = onSnapshot(
      query(
        collection(db, "messages"),
        where("receiverId", "==", user.uid),
        where("isRead", "==", false)
      ),
      (snapshot) => {
        setHasUnreadNotifications(!snapshot.empty);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [user, isClientSide]);

  return (
    <NotificationContext.Provider value={{ hasUnreadNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

// 建立一個 hook 用於訪問通知狀態
export const useNotifications = () => useContext(NotificationContext);
