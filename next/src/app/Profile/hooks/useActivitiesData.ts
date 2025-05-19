"use client"; // 宣告這是一個客戶端元件，而非伺服器端元件

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { authServices } from "../../../firebase/services/auth-service";

/**
 * 自定義 Hook - 用於管理用戶活動數據
 * 這是一個 React Hook，集中處理活動相關的狀態和操作
 */
export function useActivitiesData() {
  // 狀態變數宣告區域
  const [activities, setActivities] = useState<any[]>([]); // 儲存用戶的活動列表
  const [activitiesLoading, setActivitiesLoading] = useState(false); // 控制載入狀態，用於顯示載入中的畫面
  const [selectedActivity, setSelectedActivity] = useState<any>(null); // 儲存當前選中的活動

  // 對話框顯示狀態控制
  const [activityDialogOpen, setActivityDialogOpen] = useState(false); // 控制活動詳情對話框顯示
  const [activityEditDialogOpen, setActivityEditDialogOpen] = useState(false); // 控制活動編輯對話框顯示
  const [activityDeleteDialogOpen, setActivityDeleteDialogOpen] =
    useState(false); // 控制活動刪除確認對話框顯示

  /**
   * 從 Firebase 獲取當前登入用戶的活動列表
   * 這是一個異步函數，會向 Firebase 發送請求並等待回應
   */
  const fetchUserActivities = async () => {
    // 獲取當前登入的用戶
    const currentUser = authServices.getCurrentUser();
    // 如果沒有登入用戶，就直接返回不執行後續操作
    if (!currentUser) return;

    // 設定載入狀態為 true，表示正在獲取數據
    setActivitiesLoading(true);
    try {
      // 建立 Firebase 查詢，尋找屬於當前用戶的活動
      // query 是建立查詢條件，collection 指定要查詢的集合，where 設定篩選條件
      const q = query(
        collection(db, "activities"), // 從 activities 集合中查詢
        where("uid", "==", currentUser.uid) // 條件：uid 欄位等於當前用戶 ID
      );

      // 執行查詢並獲取結果
      const snapshot = await getDocs(q);
      // 將查詢結果轉換為易於使用的數據格式，每個文檔轉成一個對象
      const activitiesData = snapshot.docs.map((doc) => ({
        id: doc.id, // 加入文檔 ID 作為活動的唯一標識符
        ...doc.data(), // 展開文檔內的所有數據欄位
      }));

      // 更新活動列表狀態
      setActivities(activitiesData);
    } catch (err) {
      // 捕捉並記錄可能發生的錯誤
      console.error("Error fetching activities:", err);
    } finally {
      // 無論成功或失敗，最後都將載入狀態設為 false
      setActivitiesLoading(false);
    }
  };

  /**
   * 刷新活動列表的函數
   * 這個函數會重新從 Firebase 獲取最新的活動數據
   */
  const refreshActivities = async () => {
    await fetchUserActivities(); // 呼叫前面定義的獲取活動函數
  };

  /**
   * 處理活動編輯的函數
   * 選中一個活動並打開編輯對話框
   */
  const handleEditActivity = (activity: any) => {
    setSelectedActivity(activity); // 設定當前選中的活動
    setActivityEditDialogOpen(true); // 打開編輯對話框
  };

  /**
   * 處理活動刪除的函數
   * 選中一個活動並打開刪除確認對話框
   */
  const handleDeleteActivity = (activity: any) => {
    setSelectedActivity(activity); // 設定當前選中的活動
    setActivityDeleteDialogOpen(true); // 打開刪除確認對話框
  };

  /**
   * useEffect Hook - 在元件首次渲染時執行
   * 這是 React 的生命週期函數，用於處理副作用
   */
  useEffect(() => {
    // 元件掛載後自動獲取用戶活動列表
    fetchUserActivities();
    // 空陣列表示只在元件首次渲染時執行一次，不會在後續更新時重複執行
  }, []);

  // 返回所有需要在元件中使用的狀態和函數
  return {
    activities, // 活動列表數據
    activitiesLoading, // 載入狀態
    selectedActivity, // 當前選中的活動

    // 對話框狀態
    activityDialogOpen,
    activityEditDialogOpen,
    activityDeleteDialogOpen,

    // 對話框控制函數
    setActivityDialogOpen,
    setActivityEditDialogOpen,
    setActivityDeleteDialogOpen,

    // 活動操作函數
    refreshActivities, // 刷新活動列表
    handleEditActivity, // 編輯活動
    handleDeleteActivity, // 刪除活動
  };
}
