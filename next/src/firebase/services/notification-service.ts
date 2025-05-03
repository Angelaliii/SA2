import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../config';

export class NotificationService {
  // Send a notification when a collaboration request is created
  async sendCollaborationRequest(receiverId: string, collaborationId: string) {
    return await addDoc(collection(db, 'messages'), {
      receiverId,
      messageContent: '您收到了新的合作請求，請查看並回應',
      timestamp: serverTimestamp(),
      type: 'collaboration_request',
      collaborationId,
      isRead: false
    });
  }

  // Send a notification when a collaboration request is accepted
  async sendCollaborationAccepted(receiverId: string, collaborationId: string) {
    return await addDoc(collection(db, 'messages'), {
      receiverId,
      messageContent: '您的合作請求已被接受！點擊查看詳情',
      timestamp: serverTimestamp(),
      type: 'collaboration_accepted',
      collaborationId,
      isRead: false
    });
  }

  // Send a notification when a collaboration request is rejected
  async sendCollaborationRejected(receiverId: string, collaborationId: string, reason: string) {
    return await addDoc(collection(db, 'messages'), {
      receiverId,
      messageContent: `您的合作請求已被婉拒。原因：${reason}`,
      timestamp: serverTimestamp(),
      type: 'collaboration_rejected',
      collaborationId,
      isRead: false
    });
  }

  // Send a notification when a collaboration is about to expire
  async sendCollaborationExpiring(receiverId: string, collaborationId: string, daysLeft: number) {
    return await addDoc(collection(db, 'messages'), {
      receiverId,
      messageContent: `提醒：您的合作將在 ${daysLeft} 天後到期`,
      timestamp: serverTimestamp(),
      type: 'collaboration_expiring',
      collaborationId,
      isRead: false
    });
  }

  // Send a notification when collaboration review is received
  async sendCollaborationReview(receiverId: string, collaborationId: string) {
    return await addDoc(collection(db, 'messages'), {
      receiverId,
      messageContent: '您收到了新的合作評價！',
      timestamp: serverTimestamp(),
      type: 'collaboration_review',
      collaborationId,
      isRead: false
    });
  }
}

export const notificationService = new NotificationService();