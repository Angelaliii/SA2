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
  where,
} from "firebase/firestore";
import { db } from "../config";

export interface PostData {
  id?: string;
  title: string;
  content: string;
  location: string;
  tags: string[];
  createdAt: any;
  authorId: string;
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
    const postsQuery = query(
      collection(db, "posts"),
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
        tags: data.tags,
        createdAt: data.createdAt
          ? convertTimestampToString(data.createdAt)
          : new Date().toISOString(),
        authorId: data.authorId,
      };
    });

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
      tags: postData.tags,
      createdAt: postData.createdAt
        ? convertTimestampToString(postData.createdAt)
        : new Date().toISOString(),
      authorId: postData.authorId,
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
        tags: data.tags,
        createdAt: data.createdAt
          ? convertTimestampToString(data.createdAt)
          : new Date().toISOString(),
        authorId: data.authorId,
      };
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts by tag:", error);
    return [];
  }
};
