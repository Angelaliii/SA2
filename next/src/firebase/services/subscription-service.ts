// 訂閱組織資料服務
import {
  QuerySnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../config";

// 訂閱的組織介面
export interface Subscription {
  id: string;
  userId: string;
  organizationId: string;
  organizationType: "club" | "company";
  createdAt: string;
}

// 訂閱集合名稱
const SUBSCRIPTIONS_COLLECTION = "subscriptions";

export const subscriptionServices = {
  // 獲取用戶所有訂閱的組織
  getUserSubscriptions: async (userId: string): Promise<Subscription[]> => {
    try {
      const subscriptionsQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where("userId", "==", userId)
      );

      const querySnapshot: QuerySnapshot = await getDocs(subscriptionsQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          organizationId: data.organizationId,
          organizationType: data.organizationType,
          createdAt: data.createdAt
            ? data.createdAt.toDate
              ? data.createdAt.toDate().toISOString()
              : data.createdAt
            : new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error("獲取訂閱組織時出錯:", error);
      return [];
    }
  },

  // 檢查是否已訂閱該組織
  checkSubscription: async (
    userId: string,
    organizationId: string
  ): Promise<boolean> => {
    try {
      // 首先檢查 userId 和 organizationId 欄位匹配的訂閱
      const subscriptionsQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where("userId", "==", userId),
        where("organizationId", "==", organizationId)
      );

      const querySnapshot = await getDocs(subscriptionsQuery);

      // 如果找到匹配記錄，則返回已訂閱
      if (!querySnapshot.empty) {
        return true;
      }

      // 再檢查兼容性處理：檢查舊格式的訂閱記錄 (subscriberId/subscribeToId)
      const oldFormatQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where("subscriberId", "==", userId),
        where("subscribeToId", "==", organizationId)
      );

      const oldFormatSnapshot = await getDocs(oldFormatQuery);

      return !oldFormatSnapshot.empty;
    } catch (error) {
      console.error("檢查訂閱狀態時出錯:", error);
      return false;
    }
  },

  // 訂閱一個組織
  subscribeToOrganization: async (
    userId: string,
    organizationId: string,
    organizationType: "club" | "company"
  ): Promise<string> => {
    try {
      // 先檢查是否已訂閱
      const alreadySubscribed = await subscriptionServices.checkSubscription(
        userId,
        organizationId
      );
      if (alreadySubscribed) {
        return "already-subscribed";
      }

      const subscription = {
        userId,
        organizationId,
        organizationType,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        subscription
      );
      return docRef.id;
    } catch (error) {
      console.error("訂閱組織時出錯:", error);
      throw error;
    }
  },

  // 取消訂閱一個組織
  unsubscribeFromOrganization: async (
    userId: string,
    organizationId: string
  ): Promise<void> => {
    try {
      const subscriptionsQuery = query(
        collection(db, SUBSCRIPTIONS_COLLECTION),
        where("userId", "==", userId),
        where("organizationId", "==", organizationId)
      );

      const querySnapshot = await getDocs(subscriptionsQuery);
      if (querySnapshot.empty) {
        console.log("找不到相應的訂閱記錄");
        return;
      }

      // 刪除訂閱記錄
      const batch = querySnapshot.docs.map((doc) => {
        const docRef = doc.ref;
        return deleteDoc(docRef);
      });

      await Promise.all(batch);
    } catch (error) {
      console.error("取消訂閱組織時出錯:", error);
      throw error;
    }
  },
};
