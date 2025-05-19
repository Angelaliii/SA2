"use client"; // 宣告這是一個客戶端元件，在瀏覽器端執行而非伺服器端

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { authServices } from "../../../firebase/services/auth-service";

/**
 * 自定義 Hook - 用於管理用戶發布的文章數據
 * 集中處理普通文章和企業公告相關的狀態和操作
 */
export function useArticlesData() {
  // 各種狀態變數的宣告
  const [publishedArticles, setPublishedArticles] = useState<any[]>([]); // 儲存已發布的普通文章列表
  const [loadingArticles, setLoadingArticles] = useState(false); // 控制載入狀態，用於顯示載入中的畫面
  const [
    publishedEnterpriseAnnouncements,
    setPublishedEnterpriseAnnouncements,
  ] = useState<any[]>([]); // 儲存已發布的企業公告列表
  const [error, setError] = useState<string | null>(null); // 儲存錯誤訊息
  const [success, setSuccess] = useState<string | null>(null); // 儲存成功訊息

  /**
   * 從 Firebase 獲取當前登入用戶發布的文章和公告
   * 這是一個異步函數，會向 Firebase 發送請求並等待回應
   */
  const fetchPublishedArticles = async () => {
    // 獲取當前登入的用戶
    const currentUser = authServices.getCurrentUser();
    // 如果沒有登入用戶，就直接返回不執行後續操作
    if (!currentUser) return;

    // 設定載入狀態為 true，表示正在獲取數據
    setLoadingArticles(true);
    try {
      // 建立查詢：尋找屬於當前用戶且非草稿狀態的普通文章
      const postsQuery = query(
        collection(db, "posts"), // 從 posts 集合中查詢
        where("authorId", "==", currentUser.uid), // 篩選條件：作者ID等於當前用戶ID
        where("isDraft", "==", false) // 篩選條件：非草稿狀態
      );

      // 建立查詢：尋找屬於當前用戶的企業公告
      const announcementsQuery = query(
        collection(db, "enterprisePosts"), // 從企業公告集合中查詢
        where("authorId", "==", currentUser.uid) // 篩選條件：作者ID等於當前用戶ID
      );

      // 使用 Promise.all 同時執行兩個查詢，提高效率
      // 這樣可以並行處理兩個請求，而不是先等一個完成再開始另一個
      const [postsSnapshot, announcementsSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(announcementsQuery),
      ]);

      // 處理普通文章查詢結果，將每個文檔轉換為含有id和source標記的對象
      const articles = postsSnapshot.docs.map((doc) => ({
        id: doc.id, // 加入文檔ID
        source: "posts", // 標記來源為普通文章
        ...doc.data(), // 展開文檔中的所有數據欄位
      }));

      // 處理企業公告查詢結果，同樣轉換格式
      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id, // 加入文檔ID
        source: "enterprisePosts", // 標記來源為企業公告
        ...doc.data(), // 展開文檔中的所有數據欄位
      }));

      // 更新狀態，將查詢結果保存到各自的狀態變數中
      setPublishedArticles(articles);
      setPublishedEnterpriseAnnouncements(announcements);
    } catch (err) {
      // 捕捉並記錄可能發生的錯誤
      console.error("Error fetching published content:", err);
      setError("獲取文章時發生錯誤"); // 設定錯誤訊息
    } finally {
      // 無論成功或失敗，最後都將載入狀態設為false
      setLoadingArticles(false);
    }
  };

  /**
   * 刷新所有已發布內容的函數
   * 包含普通文章和企業公告，基本邏輯與 fetchPublishedArticles 相同
   * 但多了成功訊息的設定
   */
  const refreshAllPublishedContent = async () => {
    // 獲取當前登入的用戶
    const currentUser = authServices.getCurrentUser();
    // 如果沒有登入用戶，就直接返回不執行後續操作
    if (!currentUser) return;

    // 設定載入狀態為 true
    setLoadingArticles(true);
    try {
      // 查詢邏輯與 fetchPublishedArticles 相同
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", currentUser.uid),
        where("isDraft", "==", false)
      );

      const announcementsQuery = query(
        collection(db, "enterprisePosts"),
        where("authorId", "==", currentUser.uid)
      );

      // 並行執行兩個查詢
      const [postsSnapshot, announcementsSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(announcementsQuery),
      ]);

      // 處理查詢結果
      const articles = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "posts",
        ...doc.data(),
      }));

      const announcements = announcementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        source: "enterprisePosts",
        ...doc.data(),
      }));

      // 更新狀態
      setPublishedArticles(articles);
      setPublishedEnterpriseAnnouncements(announcements);
      // 與 fetchPublishedArticles 不同點：設定成功訊息提示用戶
      setSuccess("內容已成功刷新！");
    } catch (err) {
      // 錯誤處理
      console.error("Error refreshing published content:", err);
      setError("刷新內容時發生錯誤，請稍後再試");
    } finally {
      // 完成後關閉載入狀態
      setLoadingArticles(false);
    }
  };

  /**
   * useEffect Hook - 在元件首次渲染時執行
   * 用於初始加載文章數據，並處理本地存儲中的刷新標記
   */
  useEffect(() => {
    // 檢查本地存儲中是否有刷新文章的標記
    const refreshFlag = localStorage.getItem("refreshArticles");
    if (refreshFlag === "true") {
      // 如果有刷新標記，先清除它
      localStorage.removeItem("refreshArticles");
      // 使用 setTimeout 延遲執行，確保頁面已完全載入
      // 這樣可以避免刷新操作與頁面渲染產生衝突
      setTimeout(() => {
        fetchPublishedArticles();
      }, 500);
    } else {
      // 如果沒有刷新標記，直接進行初始加載
      fetchPublishedArticles();
    }
    // 空陣列表示這個效果只在元件首次渲染時執行
  }, []);

  // 返回所有需要在元件中使用的狀態和函數
  return {
    publishedArticles, // 普通文章列表
    publishedEnterpriseAnnouncements, // 企業公告列表
    loadingArticles, // 載入狀態
    error, // 錯誤訊息
    success, // 成功訊息
    fetchPublishedArticles, // 獲取文章函數
    refreshAllPublishedContent, // 刷新所有內容函數
  };
}
