import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../config";

/**
 * 創建一個新的通知
 */
export const createNotification = async ({
  userId,
  title,
  message,
  link,
  type = "general",
  entityId = null,
}: {
  userId: string;
  title: string;
  message: string;
  link?: string;
  type?: "general" | "subscription" | "collaboration";
  entityId?: string | null;
}) => {
  try {
    const notificationData = {
      userId,
      title,
      message,
      link: link ?? "",
      type,
      entityId,
      read: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "notifications"),
      notificationData
    );
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
};

/**
 * 將通知標記為已讀
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error };
  }
};

/**
 * 當有新文章發布時，發送通知給所有訂閱者
 */
export const notifySubscribers = async (
  authorId: string,
  postId: string,
  postTitle: string
) => {
  try {
    // 獲取所有訂閱者
    const subscriptionsQuery = query(
      collection(db, "subscriptions"),
      where("organizationId", "==", authorId)
    );
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);

    if (subscriptionsSnapshot.empty) {
      return { success: true, notified: 0 };
    }

    // 獲取作者資料
    let authorName = "某個組織";

    try {
      const authorDoc = await getDoc(doc(db, "users", authorId));
      if (authorDoc.exists()) {
        const data = authorDoc.data();
        if (data.type === "club") {
          authorName = data.clubName || "某社團";
        } else if (data.type === "company") {
          authorName = data.companyName || "某企業";
        } else {
          authorName = data.name || "某用戶";
        }
      }
    } catch (err) {
      console.error("Error fetching author info:", err);
    }

    // 為每個訂閱者創建通知
    const notificationPromises = subscriptionsSnapshot.docs.map((subDoc) => {
      const subscriberData = subDoc.data();

      return createNotification({
        userId: subscriberData.userId,
        title: `${authorName}發布了新文章`,
        message: `您訂閱的${authorName}剛剛發布了新文章「${postTitle}」`,
        link: `/Artical/${postId}`,
        type: "subscription",
        entityId: postId,
      });
    });

    // 等待所有通知創建完成
    await Promise.all(notificationPromises);

    // 同時發送到 messages 集合以確保通知能在通知中心顯示
    for (const subDoc of subscriptionsSnapshot.docs) {
      const subscriberData = subDoc.data();

      try {
        await addDoc(collection(db, "messages"), {
          senderId: authorId,
          receiverId: subscriberData.userId,
          messageContent: `您訂閱的${authorName}剛剛發布了新文章「${postTitle}」`,
          timestamp: serverTimestamp(),
          type: "subscription_notification",
          isRead: false,
          postTitle: postTitle,
          postId: postId,
        });
      } catch (err) {
        console.error("Error sending message notification:", err);
      }
    }

    return {
      success: true,
      notified: subscriptionsSnapshot.size,
    };
  } catch (error) {
    console.error("Error notifying subscribers:", error);
    return { success: false, error };
  }
};

/**
 * 獲取使用者通知
 */
export const getUserNotifications = async (userId: string, limit = 50) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting notifications:", error);
    return [];
  }
};

/**
 * 訂閱相關服務
 */
export const subscriptionService = {
  // 檢查是否已訂閱
  isSubscribed: async (subscriberId: string, subscribeToId: string) => {
    try {
      const q = query(
        collection(db, "subscriptions"),
        where("subscriberId", "==", subscriberId),
        where("subscribeToId", "==", subscribeToId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  },

  // 獲取用戶的所有訂閱
  getUserSubscriptions: async (userId: string) => {
    try {
      const q = query(
        collection(db, "subscriptions"),
        where("subscriberId", "==", userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error getting user subscriptions:", error);
      return [];
    }
  },
};

export const notificationService = {
  // Send notification for new collaboration request
  sendCollaborationRequest: async (
    receiverId: string,
    collaborationId: string
  ) => {
    try {
      // 獲取文章標題和ID
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const collaboration = docSnap.exists() ? docSnap.data() : null;
      const postTitle = collaboration ? collaboration.postTitle : "未知文章";
      const postId = collaboration ? collaboration.postId : "";

      // 發送單一通知到messages集合，包含文章標題和ID
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `您收到了一個關於「${postTitle}」的合作請求`,
        timestamp: serverTimestamp(),
        type: "collaboration_request",
        collaborationId,
        isRead: false,
        postTitle: postTitle,
        postId: postId,
      });

      // 不再發送重複通知到notifications集合
    } catch (error) {
      console.error("Error sending collaboration request notification:", error);
    }
  },

  sendCollaborationAccepted: async (
    receiverId: string,
    collaborationId: string
  ) => {
    try {
      // 獲取文章標題和ID
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const collaboration = docSnap.exists() ? docSnap.data() : null;
      const postTitle = collaboration ? collaboration.postTitle : "未知文章";
      const postId = collaboration ? collaboration.postId : "";

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `您關於「${postTitle}」的合作請求已被接受！`,
        timestamp: serverTimestamp(),
        type: "collaboration_accepted",
        collaborationId,
        isRead: false,
        postTitle: postTitle,
        postId: postId,
      });
    } catch (error) {
      console.error(
        "Error sending collaboration accepted notification:",
        error
      );
    }
  },

  sendCollaborationRejected: async (
    receiverId: string,
    collaborationId: string,
    reason: string
  ) => {
    try {
      // 獲取文章標題和ID
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const collaboration = docSnap.exists() ? docSnap.data() : null;
      const postTitle = collaboration ? collaboration.postTitle : "未知文章";
      const postId = collaboration ? collaboration.postId : "";

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `您關於「${postTitle}」的合作請求已被婉拒。原因：${reason}`,
        timestamp: serverTimestamp(),
        type: "collaboration_rejected",
        collaborationId,
        isRead: false,
        postTitle: postTitle,
        postId: postId,
      });
    } catch (error) {
      console.error(
        "Error sending collaboration rejected notification:",
        error
      );
    }
  },

  sendCollaborationCompleted: async (
    receiverId: string,
    collaborationId: string,
    comment: string
  ) => {
    try {
      // 獲取文章標題和ID
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const collaboration = docSnap.exists() ? docSnap.data() : null;
      const postTitle = collaboration ? collaboration.postTitle : "未知文章";
      const postId = collaboration ? collaboration.postId : "";

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `關於「${postTitle}」的合作已完成！${comment}`,
        timestamp: serverTimestamp(),
        type: "collaboration_completed",
        collaborationId,
        isRead: false,
        postTitle: postTitle,
        postId: postId,
      });
    } catch (error) {
      console.error(
        "Error sending collaboration completed notification:",
        error
      );
    }
  },

  sendCollaborationNeedsReview: async (
    receiverId: string,
    collaborationId: string,
    message: string
  ) => {
    try {
      // 獲取文章標題和ID
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const collaboration = docSnap.exists() ? docSnap.data() : null;
      const postTitle = collaboration ? collaboration.postTitle : "未知文章";
      const postId = collaboration ? collaboration.postId : "";

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `關於「${postTitle}」的合作：${message}`,
        timestamp: serverTimestamp(),
        type: "collaboration_needs_review",
        collaborationId,
        isRead: false,
        postTitle: postTitle,
        postId: postId,
      });
    } catch (error) {
      console.error(
        "Error sending collaboration needs review notification:",
        error
      );
    }
  },

  sendCollaborationCancelled: async (
    receiverId: string,
    collaborationId: string,
    postTitle: string,
    reason: string
  ) => {
    try {
      // 嘗試獲取合作ID
      let postId = "";
      try {
        const colLabRef = doc(db, "collaborations", collaborationId);
        const colLabSnap = await getDoc(colLabRef);
        if (colLabSnap.exists() && colLabSnap.data().postId) {
          postId = colLabSnap.data().postId;
        }
      } catch (err) {
        console.error("Error getting post ID:", err);
      }

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `關於「${postTitle}」的合作已被取消。原因：${reason}`,
        timestamp: serverTimestamp(),
        type: "collaboration_cancelled",
        collaborationId,
        isRead: false,
        postTitle: postTitle,
        postId: postId,
      });
    } catch (error) {
      console.error(
        "Error sending collaboration cancelled notification:",
        error
      );
    }
  },
};
