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

export interface DemandPostData extends PostData {
  organizationName?: string;
  selectedDemands?: string[];
  demandDescription?: string;
  cooperationReturn?: string;
  estimatedParticipants?: string;
  eventDescription?: string;
}

export const getOrganizationName = async (userId: string): Promise<string | null> => {
  try {
    const clubQuery = query(collection(db, "clubs"), where("userId", "==", userId));
    const companyQuery = query(collection(db, "companies"), where("userId", "==", userId));

    const [clubSnap, companySnap] = await Promise.all([
      getDocs(clubQuery),
      getDocs(companyQuery),
    ]);

    if (!clubSnap.empty) {
      return clubSnap.docs[0].data().clubName || "社團名稱未填寫";
    }

    if (!companySnap.empty) {
      return companySnap.docs[0].data().companyName || "企業名稱未填寫";
    }

    return null;
  } catch (error) {
    console.error("取得使用者組織名稱失敗", error);
    return null;
  }
};

export const getDemandItems = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "demandItems"));
    return querySnapshot.docs.map((doc) => doc.data().name as string);
  } catch (error) {
    console.error("Error fetching demand items:", error);
    return [];
  }
};

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

const convertTimestampToString = (timestamp: Timestamp | Date): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
};

export const getAllPosts = async (): Promise<PostData[]> => {
  try {
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot: QuerySnapshot = await getDocs(postsQuery);

    if (querySnapshot.empty) {
      console.log("No posts found in database");
      return [];
    }

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
        
          // 🆕 加上以下
          organizationName: data.organizationName || "未知組織",
          selectedDemands: Array.isArray(data.selectedDemands)
            ? data.selectedDemands
            : [],
        };
        
      })
      .filter((post) => !post.isDraft);

    console.log(`Fetched ${posts.length} published posts`);
    return posts;
  } catch (error) {
    console.error("Error getting posts:", error);
    return [];
  }
};

export const getPostById = async (id: string): Promise<DemandPostData | null> => {
  try {
    const postDoc = await getDoc(doc(db, "posts", id));

    if (!postDoc.exists()) {
      return null;
    }

    const postData = postDoc.data();
    return {
      id: postDoc.id,
      title: postData.title || "無標題",
      content: postData.content || "",
      location: postData.location || "",
      postType: postData.postType || "一般文章",
      tags: Array.isArray(postData.tags) ? postData.tags : [],
      createdAt: postData.createdAt
        ? convertTimestampToString(postData.createdAt)
        : new Date().toISOString(),
      authorId: postData.authorId || "",
      cooperationDeadline: postData.cooperationDeadline || null,
      cooperationType: postData.cooperationType || null,
      budget: postData.budget || null,
      eventDate: postData.eventDate || null,
      visibility: postData.visibility || "公開",
      isDraft: !!postData.isDraft,
      viewCount: postData.viewCount || 0,
      interactionCount: postData.interactionCount || 0,
      organizationName: postData.organizationName || "",
      selectedDemands: Array.isArray(postData.selectedDemands) ? postData.selectedDemands : [],
      demandDescription: postData.demandDescription || "",
      cooperationReturn: postData.cooperationReturn || "",
      estimatedParticipants: postData.estimatedParticipants || "",
      eventDescription: postData.eventDescription || "",
    };
  } catch (error) {
    console.error("Error getting post by ID:", error);
    return null;
  }
};

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