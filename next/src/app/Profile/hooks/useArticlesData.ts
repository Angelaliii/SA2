"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { authServices } from "../../../firebase/services/auth-service";

export function useArticlesData() {
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [
    publishedEnterpriseAnnouncements,
    setPublishedEnterpriseAnnouncements,
  ] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 獲取已發布文章的函數
  const fetchPublishedArticles = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setLoadingArticles(true);
    try {
      // 查詢普通文章
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", currentUser.uid),
        where("isDraft", "==", false)
      );

      // 同時查詢企業公告
      const announcementsQuery = query(
        collection(db, "enterprisePosts"),
        where("authorId", "==", currentUser.uid)
      );

      // 並行執行兩個查詢
      const [postsSnapshot, announcementsSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(announcementsQuery),
      ]);

      // 處理普通文章結果
      const articles = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "posts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 處理企業公告結果
      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "enterprisePosts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 更新狀態
      setPublishedArticles(articles);
      setPublishedEnterpriseAnnouncements(announcements);
    } catch (err) {
      console.error("Error fetching published content:", err);
      setError("獲取文章時發生錯誤");
    } finally {
      setLoadingArticles(false);
    }
  };

  // 綜合刷新所有文章(同時刷新普通文章和企業公告)
  const refreshAllPublishedContent = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setLoadingArticles(true);
    try {
      // 查詢普通文章
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", currentUser.uid),
        where("isDraft", "==", false)
      );

      // 同時查詢企業公告
      const announcementsQuery = query(
        collection(db, "enterprisePosts"),
        where("authorId", "==", currentUser.uid)
      );

      // 並行執行兩個查詢
      const [postsSnapshot, announcementsSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(announcementsQuery),
      ]);

      // 處理普通文章結果
      const articles = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "posts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 處理企業公告結果
      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "enterprisePosts", // 標記來源以便區分
        ...doc.data(),
      }));

      // 更新狀態
      setPublishedArticles(articles);
      setPublishedEnterpriseAnnouncements(announcements);
      setSuccess("內容已成功刷新！");
    } catch (err) {
      console.error("Error refreshing published content:", err);
      setError("刷新內容時發生錯誤，請稍後再試");
    } finally {
      setLoadingArticles(false);
    }
  };

  // 副作用鉤子用於檢查本地存儲中的刷新標誌
  useEffect(() => {
    const refreshFlag = localStorage.getItem("refreshArticles");
    if (refreshFlag === "true") {
      // 清除標記
      localStorage.removeItem("refreshArticles");
      // 延遲執行以確保頁面加載完成
      setTimeout(() => {
        fetchPublishedArticles();
      }, 500);
    } else {
      // 初始加載
      fetchPublishedArticles();
    }
  }, []);

  return {
    publishedArticles,
    publishedEnterpriseAnnouncements,
    loadingArticles,
    error,
    success,
    fetchPublishedArticles,
    refreshAllPublishedContent,
  };
}
