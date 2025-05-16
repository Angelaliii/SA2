import {
  addDoc,
  collection,
  deleteDoc,
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
import { notifySubscribers } from "./notification-service";

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
  eventName?: string;
  eventType?: string;
  email?: string;
  eventEndDate?: string;
  customItems?: string[];
  // Add the new required fields
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  eventNature?: string;
  sponsorDeadline?: string;
  eventStart?: string;
  eventEnd?: string;
  demandType?: string;
  materialCategory?: string[];
  materialDetails?: string;
  moneyLowerLimit?: string;
  moneyUpperLimit?: string;
  moneyPurpose?: string;
  speakerType?: string;
  speakerDetail?: string;
  feedbackDetails?: string;
  notes?: string;
}

export const getOrganizationName = async (
  userId: string
): Promise<string | null> => {
  try {
    const clubQuery = query(
      collection(db, "clubs"),
      where("userId", "==", userId)
    );
    const companyQuery = query(
      collection(db, "companies"),
      where("userId", "==", userId)
    );

    const [clubSnap, companySnap] = await Promise.all([
      getDocs(clubQuery),
      getDocs(companyQuery),
    ]);

    if (!clubSnap.empty) {
      return clubSnap.docs[0].data().clubName ?? "社團名稱未填寫";
    }

    if (!companySnap.empty) {
      return companySnap.docs[0].data().companyName ?? "企業名稱未填寫";
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
    // 創建新文章到集合
    const postsCollection = collection(db, "posts");
    const docRef = await addDoc(postsCollection, {
      ...postData,
      createdAt: serverTimestamp(),
    });

    // 如果不是草稿，才發送通知給訂閱者
    if (!postData.isDraft) {
      await notifySubscribers(postData.authorId, docRef.id, postData.title);
    }

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
        title: data.title ?? "無標題草稿",
        content: data.content ?? "",
        location: data.location ?? "",
        postType: data.postType ?? "一般文章",
        tags: data.tags ?? [],
        createdAt: data.createdAt
          ? convertTimestampToString(data.createdAt)
          : new Date().toISOString(),
        authorId: data.authorId,
        cooperationDeadline: data.cooperationDeadline ?? null,
        cooperationType: data.cooperationType ?? null,
        budget: data.budget ?? null,
        eventDate: data.eventDate ?? null,
        visibility: data.visibility ?? "公開",
        isDraft: true,
        viewCount: data.viewCount ?? 0,
        interactionCount: data.interactionCount ?? 0,
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

    // 獲取文章資訊
    const draftDoc = await getDoc(draftRef);
    if (!draftDoc.exists()) {
      return { success: false, error: "找不到文章" };
    }

    const draftData = draftDoc.data();

    // 更新為已發布
    await updateDoc(draftRef, {
      isDraft: false,
      publishedAt: serverTimestamp(),
      authorEmail: userEmail ?? null,
    });

    // 發送通知給訂閱者
    await notifySubscribers(draftData.authorId, draftId, draftData.title);

    return { success: true };
  } catch (error) {
    console.error("Error publishing draft:", error);
    return { success: false, error };
  }
};

export const deletePost = async (postId: string) => {
  try {
    const postRef = doc(db, "posts", postId);
    await deleteDoc(postRef); // 修改：直接刪除文章而不是標記
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { success: false, error };
  }
};

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

export const updatePost = async (id: string, updateData: Partial<PostData>) => {
  try {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating post:", error);
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
    // 這裡問題1: 沒有考慮 deleted 欄位，可能會返回已被標記為刪除的文章
    const postsQuery = query(
      collection(db, "posts"),
      where("deleted", "!=", true), // 添加條件：排除已標記為刪除的文章
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
        // 問題2: 這裡只返回了 postType 沒有過濾，也許需要返回指定類型
        return {
          id: doc.id,
          title: data.title ?? "無標題",
          content: data.content ?? "",
          location: data.location ?? "",
          postType: data.postType ?? "一般文章",
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt
            ? convertTimestampToString(data.createdAt)
            : new Date().toISOString(),
          authorId: data.authorId ?? "",
          cooperationDeadline: data.cooperationDeadline ?? null,
          cooperationType: data.cooperationType ?? null,
          budget: data.budget ?? null,
          eventDate: data.eventDate ?? null,
          visibility: data.visibility ?? "公開",
          isDraft: !!data.isDraft,
          viewCount: data.viewCount ?? 0,
          interactionCount: data.interactionCount ?? 0,

          // 🆕 加上以下
          organizationName: data.organizationName ?? "未知組織",
          selectedDemands: Array.isArray(data.selectedDemands)
            ? data.selectedDemands
            : [],
          eventType: data.eventType ?? "", // 添加活動類型
          estimatedParticipants: data.estimatedParticipants ?? "", // 添加估計參與人數
          demandDescription: data.demandDescription ?? "", // 添加需求描述
          cooperationReturn: data.cooperationReturn ?? "", // 添加合作回饋
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

export const getPostById = async (
  id: string
): Promise<DemandPostData | null> => {
  try {
    const postDoc = await getDoc(doc(db, "posts", id));

    if (!postDoc.exists()) {
      return null;
    }

    const postData = postDoc.data();
    return {
      id: postDoc.id,
      title: postData.title ?? "無標題",
      content: postData.content ?? "",
      location: postData.location ?? "",
      postType: postData.postType ?? "一般文章",
      tags: Array.isArray(postData.tags) ? postData.tags : [],
      createdAt: postData.createdAt
        ? convertTimestampToString(postData.createdAt)
        : new Date().toISOString(),
      authorId: postData.authorId ?? "",
      cooperationDeadline: postData.cooperationDeadline ?? null,
      cooperationType: postData.cooperationType ?? null,
      budget: postData.budget ?? null,
      eventDate: postData.eventDate ?? null,
      visibility: postData.visibility ?? "公開",
      isDraft: !!postData.isDraft,
      viewCount: postData.viewCount ?? 0,
      interactionCount: postData.interactionCount ?? 0,
      // Original fields
      organizationName: postData.organizationName ?? "",
      selectedDemands: Array.isArray(postData.selectedDemands)
        ? postData.selectedDemands
        : [],
      demandDescription: postData.demandDescription ?? "",
      cooperationReturn: postData.cooperationReturn ?? "",
      estimatedParticipants: postData.estimatedParticipants ?? "",
      eventDescription: postData.eventDescription ?? "",
      eventName: postData.eventName ?? "",
      eventType: postData.eventType ?? "",
      email: postData.email ?? "",
      eventEndDate: postData.eventEndDate ?? "",
      customItems: Array.isArray(postData.customItems)
        ? postData.customItems
        : [],
      // New fields
      contactName: postData.contactName ?? "",
      contactPhone: postData.contactPhone ?? "",
      contactEmail: postData.contactEmail ?? "",
      eventNature: postData.eventNature ?? "",
      sponsorDeadline: postData.sponsorDeadline ?? "",
      eventStart: postData.eventStart ?? "",
      eventEnd: postData.eventEnd ?? "",
      demandType: postData.demandType ?? "",
      materialCategory: Array.isArray(postData.materialCategory)
        ? postData.materialCategory
        : [],
      materialDetails: postData.materialDetails ?? "",
      moneyLowerLimit: postData.moneyLowerLimit ?? "",
      moneyUpperLimit: postData.moneyUpperLimit ?? "",
      moneyPurpose: postData.moneyPurpose ?? "",
      speakerType: postData.speakerType ?? "",
      speakerDetail: postData.speakerDetail ?? "",
      feedbackDetails: postData.feedbackDetails ?? "",
      notes: postData.notes ?? "",
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
        postType: data.postType ?? "一般文章",
        tags: data.tags,
        createdAt: data.createdAt
          ? convertTimestampToString(data.createdAt)
          : new Date().toISOString(),
        authorId: data.authorId,
        cooperationDeadline: data.cooperationDeadline ?? null,
        cooperationType: data.cooperationType ?? null,
        budget: data.budget ?? null,
        eventDate: data.eventDate ?? null,
        visibility: data.visibility ?? "公開",
        isDraft: data.isDraft ?? false,
        viewCount: data.viewCount ?? 0,
        interactionCount: data.interactionCount ?? 0,
      };
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts by tag:", error);
    return [];
  }
};
