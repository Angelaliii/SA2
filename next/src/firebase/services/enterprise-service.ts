import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config";
import { notifySubscribers } from "./notification-service"; // 引入通知功能

export interface EnterprisePost {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  companyName?: string;
  email?: string;
  createdAt: any;
  status: "active" | "closed";
  postType: "enterprise";
  isDraft?: boolean;

  // 公告類型欄位
  announcementType?:
    | "specialOfferPartnership"
    | "activityCooperation"
    | "internshipCooperation";

  // 特約商店特有欄位
  partnershipName?: string; // 特約商店名稱
  contractPeriodDuration?: string; // 合約期限
  contractDetails?: string; // 合約內容

  // 聯繫窗口（共用）
  contactName?: string; // 聯繫窗口姓名
  contactPhone?: string; // 聯繫窗口電話
  contactEmail?: string; // 聯繫窗口Email

  // 活動合作特有欄位
  activityName?: string; // 活動名稱
  activityType?: string; // 活動類型（演講/比賽等）
  activityStartDate?: string; // 活動開始日期
  activityEndDate?: string; // 活動結束日期
  activityLocation?: string; // 活動地點
  cooperationType?: string; // 合作方式（贊助/場地提供/技術支援等）
  partnerRequirements?: string; // 徵求合作對象條件
  applicationDeadline?: string; // 合作截止日期
  documentURL?: string; // 相關文件

  // 實習合作特有欄位
  internshipTitle?: string; // 實習職缺名稱
  internshipDepartment?: string; // 實習部門
  internshipPeriod?: string; // 實習期間
  weeklyHours?: number; // 每週工作時數
  workLocation?: string; // 工作地點
  salary?: string; // 薪資待遇
  jobDescription?: string; // 職務內容
  requirements?: string; // 應徵條件（科系、年級、技能等）
  internshipPositions?: number; // 實習名額
  benefits?: string; // 實習福利
  internshipApplicationDeadline?: string; // 申請截止日期
  interviewMethod?: string; // 面試方式
  additionalDocumentURL?: string; // 附加說明文件
}

const ENTERPRISE_COLLECTION = "enterprisePosts";

const getFormattedCreatedAt = (createdAt: any) => {
  if (createdAt instanceof Timestamp) {
    return createdAt.toDate().toISOString();
  } else if (createdAt) {
    return new Date(createdAt).toISOString();
  }
  return new Date().toISOString();
};

export const enterpriseService = {
  createPost: async (postData: Omit<EnterprisePost, "id">) => {
    try {
      const docRef = await addDoc(collection(db, ENTERPRISE_COLLECTION), {
        ...postData,
        createdAt: Timestamp.now(),
        postType: "enterprise",
      });

      // 如果不是草稿，發送通知給訂閱者
      if (!postData.isDraft) {
        await notifySubscribers(postData.authorId, docRef.id, postData.title);
      }

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Error creating enterprise post:", error);
      return { success: false, error };
    }
  },

  getUserDrafts: async (userId: string): Promise<EnterprisePost[]> => {
    try {
      const draftsQuery = query(
        collection(db, ENTERPRISE_COLLECTION),
        where("authorId", "==", userId),
        where("isDraft", "==", true),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(draftsQuery);

      const drafts: EnterprisePost[] = [];

      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data) {
          drafts.push({
            id: doc.id,
            title: data.title ?? "無標題草稿",
            content: data.content ?? "",
            authorId: data.authorId,
            companyName: data.companyName ?? "未知企業",
            email: data.email ?? "",
            createdAt: getFormattedCreatedAt(data.createdAt),
            status: data.status ?? "active",
            postType: "enterprise",
            isDraft: true,
          });
        }
      });

      return drafts;
    } catch (error) {
      console.error("Error getting user drafts:", error);
      return [];
    }
  },

  publishDraft: async (draftId: string) => {
    try {
      const draftRef = doc(db, ENTERPRISE_COLLECTION, draftId);

      // 獲取草稿資訊
      const draftDoc = await getDoc(draftRef);
      if (!draftDoc.exists()) {
        return { success: false, error: "找不到文章" };
      }

      const draftData = draftDoc.data();

      // 更新為已發布
      await updateDoc(draftRef, {
        isDraft: false,
        publishedAt: serverTimestamp(),
      });

      // 發送通知給訂閱者
      await notifySubscribers(draftData.authorId, draftId, draftData.title);

      return { success: true };
    } catch (error) {
      console.error("Error publishing draft:", error);
      return { success: false, error };
    }
  },

  getAllPosts: async () => {
    try {
      // 修正查詢方式，確保能獲取到所有企業公告
      // 如果 isDraft 欄位不存在，也應顯示這些文章
      const postsRef = collection(db, ENTERPRISE_COLLECTION);
      const snapshot = await getDocs(postsRef);

      const posts = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          // 過濾掉草稿
          if (data.isDraft === true) return null;

          return {
            id: doc.id,
            ...data,
            // 確保 createdAt 是可序列化的格式
            createdAt: getFormattedCreatedAt(data.createdAt),
          };
        })
        .filter((post) => post !== null);

      // 根據創建時間進行排序
      return posts.sort((a, b) => {
        const dateA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error getting enterprise posts:", error);
      return [];
    }
  },

  getPostById: async (id: string): Promise<EnterprisePost | null> => {
    try {
      const postDoc = await getDoc(doc(db, ENTERPRISE_COLLECTION, id));
      if (!postDoc.exists()) return null;

      const data = postDoc.data();
      return {
        id: postDoc.id,
        ...data,
        // 確保 createdAt 是可序列化的格式
        createdAt: getFormattedCreatedAt(data.createdAt),
      } as EnterprisePost;
    } catch (error) {
      console.error("Error getting enterprise post:", error);
      return null;
    }
  },
  updatePost: async (id: string, updateData: Partial<EnterprisePost>) => {
    try {
      const postRef = doc(db, ENTERPRISE_COLLECTION, id);

      // 清理數據，移除所有 undefined 值
      const cleanedData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      await updateDoc(postRef, {
        ...cleanedData,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating enterprise post:", error);
      return { success: false, error };
    }
  },

  deletePost: async (id: string) => {
    try {
      const postRef = doc(db, ENTERPRISE_COLLECTION, id);
      await deleteDoc(postRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting enterprise post:", error);
      return { success: false, error };
    }
  },
};

export default enterpriseService;
