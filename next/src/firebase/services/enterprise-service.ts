import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../config';

export interface EnterprisePost {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  email?: string;
  createdAt: any;
  status: 'active' | 'closed';
  postType: 'enterprise';
}

const ENTERPRISE_COLLECTION = 'enterprisePosts';

export const enterpriseService = {
  createPost: async (postData: Omit<EnterprisePost, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, ENTERPRISE_COLLECTION), {
        ...postData,
        createdAt: Timestamp.now(),
        postType: 'enterprise'
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating enterprise post:', error);
      return { success: false, error };
    }
  },

  getAllPosts: async () => {
    try {
      const q = query(
        collection(db, ENTERPRISE_COLLECTION),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting enterprise posts:', error);
      return [];
    }
  },

  getPostById: async (id: string): Promise<EnterprisePost | null> => {
    try {
      const postDoc = await getDoc(doc(db, ENTERPRISE_COLLECTION, id));
      if (!postDoc.exists()) return null;
      
      return {
        id: postDoc.id,
        ...postDoc.data()
      } as EnterprisePost;
    } catch (error) {
      console.error('Error getting enterprise post:', error);
      return null;
    }
  },
};
