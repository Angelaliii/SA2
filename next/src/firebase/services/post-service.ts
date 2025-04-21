import {
  addDoc,
  collection,
  deleteDoc, // ✅ 加入這行
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  QuerySnapshot,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../config";

export interface PostData {
  id?: string;
  title: string;
  content: string;
  location: string;
  postType: string;
  tags: string[];
  createdAt: any;
  authorId: string;
  cooperationDeadline?: string | null;
  cooperationType?: string | null;
  budget?: { min: number; max: number } | null;
  eventDate?: string | null;
  visibility?: string;
  isDraft?: boolean;
  viewCount?: number;
  interactionCount?: number;
}

// 建立文章
export const createPost = async (postData: Omit<PostData, "createdAt">) => {
  try {
    const postsCollection = collection(db, "posts");
    const docRef = await addDoc(postsCollection, {
      ...postData,
      createdAt: serverTimestamp(),
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error("Error creating post:", error);
    return { success: false, error };
  }
};

// 儲存或更新草稿
export const saveDraft = async (
  draftData: Omit<PostData, "createdAt">,
  draftId?: string
) => {
  try {
    const postsCollection = collection(db, "posts");
    const dataToSave = {
      ...draftData,
      isDraft: true,
      updatedAt: serverTimestamp(),
    };

    if (draftId) {
      const draftRef = doc(db, "posts", draftId);
      await updateDoc(draftRef, dataToSave);
      return { id: draftId, success: true };
    } else {
      const docRef = await addDoc(postsCollection, {
        ...dataToSave,
        createdAt: serverTimestamp(),
      });
      return { id: docRef.id, success: true };
    }
  } catch (error) {
    console.error("Error saving draft:", error);
    return { success: false, error };
  }
};

// 取得使用者草稿
export const getUserDrafts = async (userId: string): Promise<PostData[]> => {
  try {
    const draftsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId),
      where("isDraft", "==", true)
    );

    const querySnapshot: QuerySnapshot = await getDocs(draftsQuery);
    const drafts: PostData[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "無標題草稿",
        content: data.content || "",
        location: data.location || "",
        postType: data.postType || "一般文章",
        tags: data.tags || [],
        createdAt: data.createdAt
          ? convertTimestampToString(data.createdAt)
          : new Date().toISOString(),
        authorId: data.authorId,
        cooperationDeadline: data.cooperationDeadline || null,
        cooperationType: data.cooperationType || null,
        budget: data.budget || null,
        eventDate: data.eventDate || null,
        visibility: data.visibility || "公開",
        isDraft: true,
        viewCount: data.viewCount || 0,
        interactionCount: data.interactionCount || 0,
      };
    });

    drafts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return drafts;
  } catch (error) {
    console.error("Error getting user drafts:", error);
    return [];
  }
};

// 發布草稿
export const publishDraft = async (draftId: string, userEmail?: string) => {
  try {
    const draftRef = doc(db, "posts", draftId);
    await updateDoc(draftRef, {
      isDraft: false,
      publishedAt: serverTimestamp(),
      authorEmail: userEmail || null,
    });
    return { success: true };
  } catch (error) {
    console.error("Error publishing draft:", error);
    return { success: false, error };
  }
};

// 軟刪除文章（可恢復）
export const deletePost = async (postId: string) => {
  try {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error };
  }
};

// 硬刪除文章（徹底刪除，不可復原）
export const permanentlyDeletePost = async (postId: string) => {
  try {
    const postRef = doc(db, "posts", postId);
    await deleteDoc(postRef);
    return { success: true };
  } catch (error) {
    console.error("Error permanently deleting post:", error);
    return { success: false, error };
  }
};

// 時間格式轉換
const convertTimestampToString = (timestamp: Timestamp | Date): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
};

// 取得所有文章
export const getAllPosts = async (): Promise<PostData[]> => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot: QuerySnapshot = await getDocs(postsQuery);

    const posts: PostData[] = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "無標題",
          content: data.content || "",
          location: data.location || "",
          postType: data.postType || "一般文章",
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt
            ? convertTimestampToString(data.createdAt)
            : new Date().toISOString(),
          authorId: data.authorId || "",
          cooperationDeadline: data.cooperationDeadline || null,
          cooperationType: data.cooperationType || null,
          budget: data.budget || null,
          eventDate: data.eventDate || null,
          visibility: data.visibility || "公開",
          isDraft: !!data.isDraft,
          viewCount: data.viewCount || 0,
          interactionCount: data.interactionCount || 0,
        };
      })
      .filter((post) => !post.isDraft);

    return posts;
  } catch (error) {
    console.error("Error getting posts:", error);
    return [];
  }
};

// 取得單篇文章
export const getPostById = async (id: string): Promise<PostData | null> => {
  try {
    const postDoc = await getDoc(doc(db, "posts", id));

    if (!postDoc.exists()) {
      return null;
    }

    const postData = postDoc.data();
    return {
      id: postDoc.id,
      title: postData.title,
      content: postData.content,
      location: postData.location,
      postType: postData.postType || "一般文章",
      tags: postData.tags,
      createdAt: postData.createdAt
        ? convertTimestampToString(postData.createdAt)
        : new Date().toISOString(),
      authorId: postData.authorId,
      cooperationDeadline: postData.cooperationDeadline || null,
      cooperationType: postData.cooperationType || null,
      budget: postData.budget || null,
      eventDate: postData.eventDate || null,
      visibility: postData.visibility || "公開",
      isDraft: postData.isDraft || false,
      viewCount: postData.viewCount || 0,
      interactionCount: postData.interactionCount || 0,
    };
  } catch (error) {
    console.error("Error getting post:", error);
    return null;
  }
};

// 依標籤取得文章
export const getPostsByTag = async (tag: string): Promise<PostData[]> => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      where("tags", "array-contains", tag),
      orderBy("createdAt", "desc")
    );

    const querySnapshot: QuerySnapshot = await getDocs(postsQuery);

    const posts: PostData[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        content: data.content,
        location: data.location,
        postType: data.postType || "一般文章",
        tags: data.tags,
        createdAt: data.createdAt
          ? convertTimestampToString(data.createdAt)
          : new Date().toISOString(),
        authorId: data.authorId,
        cooperationDeadline: data.cooperationDeadline || null,
        cooperationType: data.cooperationType || null,
        budget: data.budget || null,
        eventDate: data.eventDate || null,
        visibility: data.visibility || "公開",
        isDraft: data.isDraft || false,
        viewCount: data.viewCount || 0,
        interactionCount: data.interactionCount || 0,
      };
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts by tag:", error);
    return [];
  }
};
