
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

/**
 * CollaborationRequest 介面 - 定義合作請求的資料結構
 * 這個介面在整個協作流程中使用，用來儲存和傳遞合作請求的所有資訊
 */
export interface CollaborationRequest {
  id?: string;                 
  postId: string;               // 關聯的文章/貼文 ID
  postTitle: string;           
  requesterId: string;        
  receiverId: string;          
  status: 'pending' | 'accepted' | 'rejected' | 'complete' | 'cancel' | 'pending_review';  // 請求狀態
  message?: string;             // 發送請求時的訊息
  rejectReason?: string;        // 拒絕合作的原因
  completeReview?: {            // 發起方在合作完成時提供的評價
    rating: number;           
    comment: string;            
    reviewerId: string;        
    reviewedAt: any;           
  };
  partnerCompleteReview?: {     // 接收方在合作完成時提供的評價
    rating: number;
    comment: string;
    reviewerId: string;
    reviewedAt: any;
  };
  cancelReview?: {              // 發起方在取消合作時提供的評價
    rating: number;
    comment: string;
    reviewerId: string;
    reviewedAt: any;
  };
  partnerCancelReview?: {       
    rating: number;
    comment: string;
    reviewerId: string;
    reviewedAt: any;
  };
  createdAt?: any;              // 請求創建時間
  updatedAt?: any;              // 請求更新時間
  pendingReviewFor?: string;    // 記錄誰需要評價
}

/**
 * CollaborationReview 介面 - 定義合作評價的資料結構
 * 用於在合作完成或取消時收集用戶的評價資訊
 */
export interface CollaborationReview {
  rating: number;     // 合作評分
  comment: string;    // 評價內容
}

/**
 * collaborationService - 合作請求服務物件
 * 提供一系列函數來管理用戶之間的合作關係
 * 在專案中被引入到需要處理合作請求的組件中使用
 */
export const collaborationService = {
  /**
   * 建立新的合作請求
   * @param requestData 合作請求資料物件
   * @returns 包含結果狀態和訊息的物件
   * 
   * 此功能會在用戶想要與其他用戶合作時被呼叫
   * 例如：在查看某篇文章或項目時，點擊「合作」按鈕
   */
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
    }  },    
  /**
   * 獲取用戶收到的所有合作請求
   * @param userId 用戶ID
   * @returns 合作請求列表
   * 
   * 此功能在用戶查看「我收到的合作請求」頁面時使用
   * 顯示其他用戶發送給當前用戶的所有合作請求
   */
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
            partnerCompleteReview: data.partnerCompleteReview,
            cancelReview: data.cancelReview,
            partnerCancelReview: data.partnerCancelReview,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            pendingReviewFor: data.pendingReviewFor,
            actionInitiator: data.actionInitiator,
            actionType: data.actionType
            } as CollaborationRequest;
        });
        } catch (error) {
        console.error("Error getting received requests:", error);
        return [];
        }    },
  /**
   * 獲取用戶發送的所有合作請求
   * @param userId 用戶ID
   * @returns 合作請求列表
   * 
   * 此功能在用戶查看「我發送的合作請求」頁面時使用
   * 用於追蹤當前用戶向他人發送的所有合作請求及其狀態
   */
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
            partnerCompleteReview: data.partnerCompleteReview,
            cancelReview: data.cancelReview,
            partnerCancelReview: data.partnerCancelReview,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            pendingReviewFor: data.pendingReviewFor,
            actionInitiator: data.actionInitiator,
            actionType: data.actionType
            } as CollaborationRequest;
        });
        } catch (error) {
        console.error("Error getting sent requests:", error);
        return [];
        }    },
    
  /**
   * 更新合作請求狀態
   * @param requestId 合作請求ID
   * @param status 新狀態 (接受或拒絕)
   * @param rejectReason 拒絕原因 (選填)
   * @returns 操作結果
   * 
   * 此功能用於用戶接受或拒絕收到的合作請求時
   * 系統會根據用戶決定更新請求狀態並發送相應通知
   */
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
      
      if (!data) {
        return { success: false, error: '找不到合作請求資料' };
      }

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
    }  },

  /**
   * 接受一個合作請求
   * @param collaborationId 合作請求ID
   * @returns 操作結果
   * 
   * 此功能用於用戶接受收到的合作請求
   * 是 updateRequestStatus 的一個特定版本，專門處理接受請求的場景
   * 在用戶查看請求詳情並點擊「接受」按鈕時觸發
   */
  acceptCollaboration: async (collaborationId: string) => {
    try {
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: '找不到合作請求資料' };
      }

      await updateDoc(docRef, {
        status: 'accepted',
        updatedAt: serverTimestamp(),
        acceptedAt: serverTimestamp()
      });

      const data = docSnap.data();
      
      // 通知請求發起方合作已被接受
      await notificationService.sendCollaborationAccepted(
        data.requesterId,
        collaborationId
      );

      return { success: true };
    } catch (error) {
      console.error("Error accepting collaboration:", error);
      return { success: false, error: '接受合作請求失敗' };
    }  },

  /**
   * 拒絕一個合作請求
   * @param collaborationId 合作請求ID
   * @param rejectReason 拒絕原因
   * @returns 操作結果
   * 
   * 此功能用於用戶拒絕收到的合作請求
   * 是 updateRequestStatus 的一個特定版本，專門處理拒絕請求的場景
   * 在用戶查看請求詳情並點擊「拒絕」按鈕時觸發
   */
  rejectCollaboration: async (collaborationId: string, rejectReason: string) => {
    try {
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return { success: false, error: '找不到合作請求資料' };
      }

      await updateDoc(docRef, {
        status: 'rejected',
        rejectReason: rejectReason,
        updatedAt: serverTimestamp()
      });

      const data = docSnap.data();
      
      // 通知請求發起方合作已被拒絕
      await notificationService.sendCollaborationRejected(
        data.requesterId,
        collaborationId,
        rejectReason || '未提供拒絕原因'
      );

      return { success: true };
    } catch (error) {
      console.error("Error rejecting collaboration:", error);
      return { success: false, error: '拒絕合作請求失敗' };
    }  },
  /**
   * 更新合作完成狀態
   * @param collaborationId 合作請求ID
   * @param status 新狀態 (完成或取消)
   * @param review 用戶評價
   * @returns 操作結果
   * 
   * 此功能用於用戶標記合作為已完成或要求取消合作時
   * 同時收集用戶對合作體驗的評價
   * 此操作會將狀態設為等待對方評價，並通知對方
   */
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
        actionInitiator: currentUserId,
        actionType: status,
        updatedAt: serverTimestamp()
      });

      // 發送通知給對方需要評價
      await notificationService.sendCollaborationNeedsReview(
        otherUserId, 
        collaborationId,
        status === 'complete' ? '已完成合作，請給予評價' : '要求取消合作，請給予評價'
      );

      return { success: true };
    } catch (error) {
      console.error("Error updating collaboration status:", error);
      return { success: false, error: '更新合作狀態失敗' };
    }  },
  /**
   * 提交對合作的評價
   * @param collaborationId 合作請求ID
   * @param review 用戶評價
   * @returns 操作結果
   * 
   * 此功能用於用戶收到合作評價請求後提交自己的評價
   * 當合作一方發起完成/取消合作後，另一方會收到評價請求
   * 完成評價後合作才會正式標記為完成或取消
   */
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

      // 使用保存的action類型來確定評價類型
      const statusType = data.actionType;
      const partnerReviewField = `partner${statusType.charAt(0).toUpperCase() + statusType.slice(1)}Review`;

      await updateDoc(docRef, {
        status: statusType,
        [partnerReviewField]: {
          ...review,
          reviewerId: currentUserId,
          reviewedAt: serverTimestamp()
        },
        pendingReviewFor: null,
        updatedAt: serverTimestamp()
      });

      // 發送通知給最初發起動作的人
      await notificationService.sendCollaborationCompleted(
        data.actionInitiator,
        collaborationId,
        `${review.comment}`
      );

      return { success: true };
    } catch (error) {
      console.error("Error submitting review:", error);
      return { success: false, error: '提交評價失敗' };
    }  },
  /**
   * 無需對方評價直接取消合作
   * @param collaborationId 合作請求ID
   * @param cancelReason 取消原因
   * @returns 操作結果
   * 
   * 此功能用於需要立即取消合作的場景
   * 與 updateCollaborationStatus 不同，此功能會直接將狀態設為已取消
   * 而不需要等待對方評價，適用於特殊情況下的合作取消
   */
  cancelCollaboration: async (
    collaborationId: string,
    cancelReason: string
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
      
      // 直接更新為已取消狀態，不需要對方評價
      await updateDoc(docRef, {
        status: 'cancel',
        cancelReview: {
          comment: cancelReason,
          reviewerId: currentUserId,
          reviewedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      });

      // 發送通知給對方
      await notificationService.sendCollaborationCancelled(
        otherUserId, 
        collaborationId,
        data.postTitle,
        cancelReason
      );

      return { success: true };
    } catch (error) {
      console.error("Error cancelling collaboration:", error);
      return { success: false, error: '取消合作失敗' };
    }
  },
};