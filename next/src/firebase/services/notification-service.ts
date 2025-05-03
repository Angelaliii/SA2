import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../config";

export const notificationService = {
  // Send notification for new collaboration request
  sendCollaborationRequest: async (receiverId: string, collaborationId: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        receiverId,
        messageContent: "您收到了一個新的合作請求，請前往合作記錄查看詳情。",
        timestamp: serverTimestamp(),
        type: "collaboration_request",
        collaborationId,
        isRead: false
      });
    } catch (error) {
      console.error("Error sending collaboration request notification:", error);
    }
  },

  // Send notification when collaboration is accepted
  sendCollaborationAccepted: async (receiverId: string, collaborationId: string) => {
    try {
      await addDoc(collection(db, "messages"), {
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
  }
};