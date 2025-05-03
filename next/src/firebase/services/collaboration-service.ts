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
  where,
  Timestamp
} from "firebase/firestore";
import { auth, db } from "../config";
import { Collaboration, CollaborationRequest, Review } from '../../types/collaboration';
import { notificationService } from '.';

export const collaborationService = {
  // Create a new collaboration request
  createCollaborationRequest: async (requestData: Omit<CollaborationRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: '請先登入' };
      }
      
      if (currentUser.uid !== requestData.requesterId) {
        return { success: false, error: '用戶身份驗證失敗' };
      }

      const postRef = doc(db, "posts", requestData.postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        return { success: false, error: '找不到該文章' };
      }

      const existingQuery = query(
        collection(db, "collaborations"),
        where("postId", "==", requestData.postId),
        where("requesterId", "==", requestData.requesterId),
        where("status", "==", "pending")
      );
      const existingSnap = await getDocs(existingQuery);
      if (!existingSnap.empty) {
        return { success: false, error: '您已經發送過合作請求' };
      }

      const docRef = await addDoc(collection(db, "collaborations"), {
        ...requestData,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification
      await notificationService.sendCollaborationRequest(requestData.receiverId, docRef.id);

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
  async updateRequestStatus(requestId: string, status: 'accepted' | 'rejected', rejectReason?: string) {
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
        throw new Error('Collaboration data not found');
      }

      // Handle notifications
      if (status === 'accepted' && data.requesterId) {
        await notificationService.sendCollaborationAccepted(
          data.requesterId,
          requestId
        );
      } else if (status === 'rejected' && data.requesterId) {
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

  // Get all collaborations for current user
  async getCollaborations(): Promise<Collaboration[]> {
    const q = query(
      collection(db, 'collaborations'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Collaboration[];
  },

  // Get collaboration statistics
  async getCollaborationStats() {
    const collaborations = await this.getCollaborations();
    const completedCollabs = collaborations.filter(c => c.isCompleted);
    const ratings = completedCollabs
      .filter(c => c.review)
      .map(c => {
        const r = c.review!;
        return (r.professionalSkill + r.communication + r.attitude + r.satisfaction) / 4;
      });

    const avgRating = ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;

    return {
      totalCollaborations: collaborations.length,
      completedCollaborations: completedCollabs.length,
      averageRating: avgRating
    };
  },

  // Submit a collaboration review
  async submitReview(collaborationId: string, review: Review) {
    const collaborationRef = doc(db, 'collaborations', collaborationId);
    await updateDoc(collaborationRef, {
      review,
      isReviewed: true,
      updatedAt: Timestamp.now()
    });

    // Update the partner's rating statistics
    const collaboration = await getDoc(collaborationRef);
    const collaborationData = collaboration.data() as Collaboration | undefined;
    
    if (collaborationData) {
      const partnerId = collaborationData.partnerId;
      const partnerRef = doc(db, 'users', partnerId);
      const partnerDoc = await getDoc(partnerRef);
      const partnerData = partnerDoc.data();

      if (partnerData) {
        const reviews = partnerData.reviews || [];
        reviews.push(review);
        
        const averageRating = reviews.reduce((acc: number, r: Review) => {
          const avgRating = (r.professionalSkill + r.communication + r.attitude + r.satisfaction) / 4;
          return acc + avgRating;
        }, 0) / reviews.length;

        await updateDoc(partnerRef, {
          reviews,
          averageRating,
          reviewCount: reviews.length
        });
      }
    }
  },

  // Export collaboration data
  async exportCollaborationData() {
    const collaborations = await this.getCollaborations();
    const csvContent = generateCSV(collaborations);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `collaborations_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Check for upcoming collaboration deadlines
  async checkCollaborationDeadlines() {
    const collaborations = await this.getCollaborations();
    const now = new Date();

    collaborations.forEach(async (collab) => {
      if (collab.endDate && !collab.isCompleted) {
        const endDate = collab.endDate instanceof Timestamp 
          ? collab.endDate.toDate() 
          : new Date(collab.endDate);
          
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24));

        if (daysLeft === 30 || daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
          await notificationService.sendCollaborationExpiring(
            collab.partnerId,
            collab.id,
            daysLeft
          );
        }
      }
    });
  },

  // Get collaboration by ID with full details
  async getCollaborationById(collaborationId: string): Promise<Collaboration> {
    const docRef = doc(db, 'collaborations', collaborationId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Collaboration not found');
    }

    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Collaboration;
  }
};

// Helper function to generate CSV
function generateCSV(collaborations: Collaboration[]): string {
  const headers = [
    '標題',
    '合作夥伴',
    '開始日期',
    '結束日期',
    '狀態',
    '專業能力評分',
    '溝通效率評分',
    '合作態度評分',
    '滿意度評分',
    '評價內容'
  ].join(',');

  const rows = collaborations.map(c => {
    const review = c.review || {
      professionalSkill: '',
      communication: '',
      attitude: '',
      satisfaction: '',
      comment: ''
    };
    const startDate = c.startDate instanceof Timestamp ? c.startDate.toDate() : new Date(c.startDate);
    const endDate = c.endDate instanceof Timestamp ? c.endDate.toDate() : c.endDate ? new Date(c.endDate) : null;

    return [
      c.title,
      c.partnerName,
      startDate.toLocaleDateString(),
      endDate?.toLocaleDateString() || '',
      c.isCompleted ? '已完成' : '進行中',
      review.professionalSkill.toString(),
      review.communication.toString(),
      review.attitude.toString(),
      review.satisfaction.toString(),
      review.comment ? `"${review.comment}"` : ''
    ].join(',');
  });

  return [headers, ...rows].join('\n');
}