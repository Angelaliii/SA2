import { 
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where 
} from "firebase/firestore";
import { auth, db } from "../config";
import { notificationService } from './notification-service';

export interface CollaborationRequest {
  id?: string;
  postId: string;
  postTitle: string;
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'complete' | 'cancel' | 'pending_review';
  message?: string;
  rejectReason?: string;
  completeReview?: {
    rating: number;
    comment: string;
    reviewerId: string;
    reviewedAt: any;
  };
  cancelReview?: {
    rating: number;
    comment: string;
    reviewerId: string;
    reviewedAt: any;
  };
  createdAt?: any;
  updatedAt?: any;
  pendingReviewFor?: string; // 記錄誰需要評價
}

export interface CollaborationReview {
  rating: number;
  comment: string;
}

export const collaborationService = {
  // Create a new collaboration request
  createCollaborationRequest: async (requestData: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt'>) => {
    console.log('Creating collaboration request with data:', requestData);
    try {
      // Verify user exists
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('No authenticated user found when creating collaboration request');
        return { success: false, error: '請先登入' };
      }
      
      // Verify IDs match
      if (currentUser.uid !== requestData.requesterId) {
        console.error('User ID mismatch:', { currentUid: currentUser.uid, requesterId: requestData.requesterId });
        return { success: false, error: '用戶身份驗證失敗' };
      }

      // Verify post exists
      const postRef = doc(db, "posts", requestData.postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        console.error('Post not found:', requestData.postId);
        return { success: false, error: '找不到該文章' };
      }

      // Check if a request already exists
      const existingQuery = query(
        collection(db, "collaborations"),
        where("postId", "==", requestData.postId),
        where("requesterId", "==", requestData.requesterId),
        where("status", "==", "pending")
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        console.log('Request already exists');
        return { success: false, error: '您已經發送過合作請求' };
      }

      const docRef = await addDoc(collection(db, "collaborations"), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log('Collaboration request created with ID:', docRef.id);

      // 發送通知給接收方
      try {
        await notificationService.sendCollaborationRequest(requestData.receiverId, docRef.id);
        console.log('Notification sent successfully');
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the whole request if notification fails
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating collaboration request:", error);
      return { success: false, error: '建立合作請求失敗' };
    }
  },

    // Get collaboration requests received by a user
    getReceivedRequests: async (userId: string): Promise<CollaborationRequest[]> => {
        console.log('Fetching received requests for user:', userId);
        try {
        const requestsQuery = query(
            collection(db, "collaborations"),
            where("receiverId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(requestsQuery);
    
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
            id: doc.id,
            postId: data.postId,
            postTitle: data.postTitle,
            requesterId: data.requesterId,
            receiverId: data.receiverId,
            status: data.status,
            message: data.message || "",
            rejectReason: data.rejectReason || "",
            completeReview: data.completeReview,
            cancelReview: data.cancelReview,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
            } as CollaborationRequest;
        });
        } catch (error) {
        console.error("Error getting received requests:", error);
        return [];
        }
    },
    
    // Get collaboration requests sent by a user
    getSentRequests: async (userId: string): Promise<CollaborationRequest[]> => {
        try {
        const requestsQuery = query(
            collection(db, "collaborations"),
            where("requesterId", "==", userId),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(requestsQuery);
    
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
            id: doc.id,
            postId: data.postId,
            postTitle: data.postTitle,
            requesterId: data.requesterId,
            receiverId: data.receiverId,
            status: data.status,
            message: data.message || "",
            rejectReason: data.rejectReason || "",
            completeReview: data.completeReview,
            cancelReview: data.cancelReview,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
            } as CollaborationRequest;
        });
        } catch (error) {
        console.error("Error getting sent requests:", error);
        return [];
        }
    },
    

  // Update a collaboration request status
  updateRequestStatus: async (requestId: string, status: 'accepted' | 'rejected', rejectReason?: string) => {
    try {
      const docRef = doc(db, "collaborations", requestId);
      await updateDoc(docRef, {
        status,
        rejectReason: rejectReason || null,
        updatedAt: serverTimestamp()
      });

      const docSnap = await getDoc(docRef);
      const data = docSnap.data();

      // 處理通知
      if (status === 'accepted') {
        // 通知請求發起方合作已被接受
        await notificationService.sendCollaborationAccepted(
          data.requesterId,
          requestId
        );
      } else if (status === 'rejected') {
        // 通知請求發起方合作已被拒絕
        await notificationService.sendCollaborationRejected(
          data.requesterId,
          requestId,
          rejectReason || '未提供拒絕原因'
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating request status:", error);
      return { success: false, error };
    }
  },

  // Update a collaboration's completion status
  updateCollaborationStatus: async (
    collaborationId: string,
    status: 'complete' | 'cancel',
    review: CollaborationReview
  ) => {
    try {
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: '找不到該合作記錄' };
      }

      const data = docSnap.data();
      const currentUserId = auth.currentUser?.uid;
      
      // 確定另一方的ID
      const otherUserId = currentUserId === data.requesterId ? data.receiverId : data.requesterId;
      
      await updateDoc(docRef, {
        status: 'pending_review',
        [`${status}Review`]: {
          ...review,
          reviewerId: currentUserId,
          reviewedAt: serverTimestamp()
        },
        pendingReviewFor: otherUserId,
        actionInitiator: currentUserId, // 記錄誰發起的完成/取消動作
        updatedAt: serverTimestamp()
      });

      // 發送通知給對方
      if (status === 'complete') {
        await notificationService.sendCollaborationCompleted(otherUserId, collaborationId, review.comment);
      } else {
        await notificationService.sendCollaborationCancelled(otherUserId, collaborationId, review.comment);
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating collaboration status:", error);
      return { success: false, error: '更新合作狀態失敗' };
    }
  },

  // Submit review for a collaboration that is pending review
  submitReview: async (
    collaborationId: string,
    review: CollaborationReview
  ) => {
    try {
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: '找不到該合作記錄' };
      }

      const data = docSnap.data();
      const currentUserId = auth.currentUser?.uid;
      
      // 檢查是否是等待當前用戶評價
      if (data.pendingReviewFor !== currentUserId) {
        return { success: false, error: '您目前無法評價此合作' };
      }

      // 判斷是完成還是取消合作
      const statusType = data.completeReview ? 'complete' : 'cancel';
      const reviewType = `${statusType}Review`;
      const partnerReviewType = `partner${reviewType}`;

      await updateDoc(docRef, {
        status: statusType,
        [partnerReviewType]: {
          ...review,
          reviewerId: currentUserId,
          reviewedAt: serverTimestamp()
        },
        pendingReviewFor: null,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error("Error submitting review:", error);
      return { success: false, error: '提交評價失敗' };
    }
  },
};