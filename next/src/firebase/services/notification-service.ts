import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth } from "../config";
import { db } from "../config";

export const notificationService = {
  // Send notification for new collaboration request
  sendCollaborationAccepted: async (receiverId: string, collaborationId: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid, 
        receiverId,
        messageContent: "您的合作請求已被接受！",
        timestamp: serverTimestamp(),
        type: "collaboration_accepted",
        collaborationId,
        isRead: false
      });
    } catch (error) {
      console.error("Error sending collaboration accepted notification:", error);
    }
  },

  // Send notification when collaboration is rejected
  sendCollaborationRejected: async (receiverId: string, collaborationId: string, reason: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid, 
        receiverId,
        messageContent: `您的合作請求已被婉拒。原因：${reason}`,
        timestamp: serverTimestamp(),
        type: "collaboration_rejected",
        collaborationId,
        isRead: false
      });
    } catch (error) {
      console.error("Error sending collaboration rejected notification:", error);
    }
  },

  sendCollaborationCompleted: async (receiverId: string, collaborationId: string, comment: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `合作已完成！對方評價：${comment}`,
        timestamp: serverTimestamp(),
        type: "collaboration_completed",
        collaborationId,
        isRead: false
      });
    } catch (error) {
      console.error("Error sending collaboration completed notification:", error);
    }
  },

  sendCollaborationCancelled: async (receiverId: string, collaborationId: string, reason: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        senderId: auth.currentUser?.uid,
        receiverId,
        messageContent: `合作已取消。取消原因：${reason}`,
        timestamp: serverTimestamp(),
        type: "collaboration_cancelled",
        collaborationId,
        isRead: false
      });
    } catch (error) {
      console.error("Error sending collaboration cancelled notification:", error);
    }
  }
};