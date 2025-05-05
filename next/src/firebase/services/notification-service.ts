import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth } from "../config";
import { db } from "../config";
import { doc, getDoc } from "firebase/firestore";

export const notificationService = {
  // Send notification for new collaboration request
  sendCollaborationRequest: async (receiverId: string, collaborationId: string) => {
    try {
      // 獲取文章標題
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const postTitle = docSnap.exists() ? docSnap.data().postTitle : '未知文章';
      const requesterData = docSnap.exists() ? docSnap.data() : null;
      
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `您收到了一個關於「${postTitle}」的合作請求`,
        timestamp: serverTimestamp(),
        type: "collaboration_request",
        collaborationId,
        isRead: false,
        postTitle: postTitle
      });
    } catch (error) {
      console.error("Error sending collaboration request notification:", error);
    }
  },
  
  sendCollaborationAccepted: async (receiverId: string, collaborationId: string) => {
    try {
      // 獲取文章標題
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const postTitle = docSnap.exists() ? docSnap.data().postTitle : '未知文章';

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid, 
        receiverId,
        messageContent: `您關於「${postTitle}」的合作請求已被接受！`,
        timestamp: serverTimestamp(),
        type: "collaboration_accepted",
        collaborationId,
        isRead: false,
        postTitle: postTitle
      });
    } catch (error) {
      console.error("Error sending collaboration accepted notification:", error);
    }
  },

  sendCollaborationRejected: async (receiverId: string, collaborationId: string, reason: string) => {
    try {
      // 獲取文章標題
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const postTitle = docSnap.exists() ? docSnap.data().postTitle : '未知文章';

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid, 
        receiverId,
        messageContent: `您關於「${postTitle}」的合作請求已被婉拒。原因：${reason}`,
        timestamp: serverTimestamp(),
        type: "collaboration_rejected",
        collaborationId,
        isRead: false,
        postTitle: postTitle
      });
    } catch (error) {
      console.error("Error sending collaboration rejected notification:", error);
    }
  },

  sendCollaborationCompleted: async (receiverId: string, collaborationId: string, comment: string) => {
    try {
      // 獲取文章標題
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const postTitle = docSnap.exists() ? docSnap.data().postTitle : '未知文章';

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `關於「${postTitle}」的合作已完成！${comment}`,
        timestamp: serverTimestamp(),
        type: "collaboration_completed",
        collaborationId,
        isRead: false,
        postTitle: postTitle
      });
    } catch (error) {
      console.error("Error sending collaboration completed notification:", error);
    }
  },

  sendCollaborationNeedsReview: async (receiverId: string, collaborationId: string, message: string) => {
    try {
      // 獲取文章標題
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      const postTitle = docSnap.exists() ? docSnap.data().postTitle : '未知文章';

      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `關於「${postTitle}」的合作：${message}`,
        timestamp: serverTimestamp(),
        type: "collaboration_needs_review",
        collaborationId,
        isRead: false,
        postTitle: postTitle
      });
    } catch (error) {
      console.error("Error sending collaboration needs review notification:", error);
    }
  },

  sendCollaborationCancelled: async (receiverId: string, collaborationId: string, postTitle: string, reason: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `關於「${postTitle}」的合作已被取消。原因：${reason}`,
        timestamp: serverTimestamp(),
        type: "collaboration_cancelled",
        collaborationId,
        isRead: false,
        postTitle: postTitle
      });
    } catch (error) {
      console.error("Error sending collaboration cancelled notification:", error);
    }
  }
};