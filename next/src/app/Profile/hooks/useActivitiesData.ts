"use client";

import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import { authServices } from "../../../firebase/services/auth-service";

export function useActivitiesData() {
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [activityEditDialogOpen, setActivityEditDialogOpen] = useState(false);
  const [activityDeleteDialogOpen, setActivityDeleteDialogOpen] =
    useState(false);

  // 獲取用戶活動的函數
  const fetchUserActivities = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setActivitiesLoading(true);
    try {
      const q = query(
        collection(db, "activities"),
        where("uid", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const activitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActivities(activitiesData);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // 刷新活動列表
  const refreshActivities = async () => {
    await fetchUserActivities();
  };

  // 處理活動編輯
  const handleEditActivity = (activity: any) => {
    setSelectedActivity(activity);
    setActivityEditDialogOpen(true);
  };

  // 處理活動刪除
  const handleDeleteActivity = (activity: any) => {
    setSelectedActivity(activity);
    setActivityDeleteDialogOpen(true);
  };

  // 初始加載活動
  useEffect(() => {
    fetchUserActivities();
  }, []);

  return {
    activities,
    activitiesLoading,
    selectedActivity,
    activityDialogOpen,
    activityEditDialogOpen,
    activityDeleteDialogOpen,
    setActivityDialogOpen,
    setActivityEditDialogOpen,
    setActivityDeleteDialogOpen,
    refreshActivities,
    handleEditActivity,
    handleDeleteActivity,
  };
}
