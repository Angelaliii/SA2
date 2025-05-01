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
}

const ENTERPRISE_COLLECTION = "enterprisePosts";

export const enterpriseService = {
  createPost: async (postData: Omit<EnterprisePost, "id">) => {
    try {
      const docRef = await addDoc(collection(db, ENTERPRISE_COLLECTION), {
        ...postData,
        createdAt: Timestamp.now(),
        postType: "enterprise",
      });
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
            createdAt: data.createdAt
              ? data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date(data.createdAt).toISOString()
              : new Date().toISOString(),
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
      await updateDoc(draftRef, {
        isDraft: false,
        publishedAt: serverTimestamp(),
      });
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
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : data.createdAt,
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
        createdAt:
          data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
      } as EnterprisePost;
    } catch (error) {
      console.error("Error getting enterprise post:", error);
      return null;
    }
  },

  updatePost: async (id: string, updateData: Partial<EnterprisePost>) => {
    try {
      const postRef = doc(db, ENTERPRISE_COLLECTION, id);
      await updateDoc(postRef, {
        ...updateData,
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
