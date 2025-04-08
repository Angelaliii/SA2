import {
  addDoc,
  collection,
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

    // 確保草稿旗標設置為 true
    const dataToSave = {
      ...draftData,
      isDraft: true,
      updatedAt: serverTimestamp(),
    };

    // 如果提供了 ID，則更新現有草稿，否則建立新草稿
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

// 獲取特定用戶的所有草稿
export const getUserDrafts = async (userId: string): Promise<PostData[]> => {
  try {
    // 移除 orderBy 以避免需要複合索引
    const draftsQuery = query(
      collection(db, "posts"),
      where("authorId", "==", userId),
      where("isDraft", "==", true)
      // orderBy("createdAt", "desc") - 暫時移除，避免需要複合索引
    );

    const querySnapshot: QuerySnapshot = await getDocs(draftsQuery);

    // 在 JavaScript 中手動排序結果
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

    // 手動對結果進行排序
    drafts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // 降序排序，最新的在前面
    });

    return drafts;
  } catch (error) {
    console.error("Error getting user drafts:", error);
    return [];
  }
};

// 將草稿轉換為正式文章
export const publishDraft = async (draftId: string, userEmail?: string) => {
  try {
    const draftRef = doc(db, "posts", draftId);
    await updateDoc(draftRef, {
      isDraft: false,
      publishedAt: serverTimestamp(),
      authorEmail: userEmail || null, // 儲存發布者的 Gmail
    });
    return { success: true };
  } catch (error) {
    console.error("Error publishing draft:", error);
    return { success: false, error };
  }
};

// 刪除草稿或文章
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

// Function to convert Firestore timestamps to dates
const convertTimestampToString = (timestamp: Timestamp | Date): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString(); // Default to current date if invalid
};

// Get all posts
export const getAllPosts = async (): Promise<PostData[]> => {
  try {
    // Temporarily use a simpler query without the isDraft filter to avoid index requirement
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot: QuerySnapshot = await getDocs(postsQuery);

    if (querySnapshot.empty) {
      console.log("No posts found in database");
      return [];
    }

    // Filter out draft posts client-side
    const posts: PostData[] = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        // 確保所有必要字段都有默認值，防止渲染時出現問題
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
          isDraft: !!data.isDraft, // 確保轉換為布爾值
          viewCount: data.viewCount || 0,
          interactionCount: data.interactionCount || 0,
        };
      })
      .filter((post) => !post.isDraft); // 過濾掉草稿

    console.log(`Fetched ${posts.length} published posts`);
    return posts;
  } catch (error) {
    console.error("Error getting posts:", error);
    return [];
  }
};

// Get post by ID
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

// Get posts by tag
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
