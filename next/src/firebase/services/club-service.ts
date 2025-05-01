// Club data services
import {
  DocumentSnapshot,
  QuerySnapshot,
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../config";

// Club interface
export interface Club {
  id: string;
  clubName: string;
  schoolName: string;
  clubType: string; // Added clubType field
  email: string;
  contactName?: string;
  contactPhone?: string;
  clubDescription?: string;
  logoURL?: string;
  status: string;
  registrationDate: string;
  userId: string;
}

// Define a function to convert Firestore timestamp to string
const convertTimestampToString = (timestamp: Timestamp | Date): string => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  } else if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString(); // Default to current date if invalid
};

// Clubs collection name
const CLUBS_COLLECTION = "clubs";

export const clubServices = {
  // Get all clubs
  getAllClubs: async (): Promise<Club[]> => {
    try {
      const clubsQuery = query(
        collection(db, CLUBS_COLLECTION),
        orderBy("registrationDate", "desc")
      );

      const querySnapshot: QuerySnapshot = await getDocs(clubsQuery);

      const clubs: Club[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          clubName: data.clubName || "",
          schoolName: data.schoolName || "",
          clubType: data.clubType || "", // Added clubType field
          email: data.email || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          clubDescription: data.clubDescription || "",
          logoURL: data.logoURL || "",
          status: data.status || "pending",
          registrationDate: data.registrationDate
            ? convertTimestampToString(data.registrationDate)
            : new Date().toISOString(),
          userId: data.userId || "",
        };
      });

      return clubs;
    } catch (error) {
      console.error("Error getting clubs:", error);
      throw error;
    }
  },

  // Get club by ID
  getClubById: async (id: string): Promise<Club | null> => {
    try {
      const docRef = doc(db, CLUBS_COLLECTION, id);
      const docSnap: DocumentSnapshot = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          clubName: data.clubName || "",
          schoolName: data.schoolName || "",
          clubType: data.clubType || "", // Added clubType field
          email: data.email || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          clubDescription: data.clubDescription || "",
          logoURL: data.logoURL || "",
          status: data.status || "pending",
          registrationDate: data.registrationDate
            ? convertTimestampToString(data.registrationDate)
            : new Date().toISOString(),
          userId: data.userId || "",
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting club by ID:", error);
      throw error;
    }
  },

  // Get clubs by status
  getClubsByStatus: async (status: string): Promise<Club[]> => {
    try {
      const clubsQuery = query(
        collection(db, CLUBS_COLLECTION),
        where("status", "==", status),
        orderBy("registrationDate", "desc")
      );

      const querySnapshot = await getDocs(clubsQuery);

      const clubs: Club[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          clubName: data.clubName || "",
          schoolName: data.schoolName || "",
          clubType: data.clubType || "", // Added clubType field
          email: data.email || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          clubDescription: data.clubDescription || "",
          logoURL: data.logoURL || "",
          status: data.status || "pending",
          registrationDate: data.registrationDate
            ? convertTimestampToString(data.registrationDate)
            : new Date().toISOString(),
          userId: data.userId || "",
        };
      });

      return clubs;
    } catch (error) {
      console.error("Error getting clubs by status:", error);
      throw error;
    }
  },

  // Upload club logo
  uploadClubLogo: async (clubId: string, file: File): Promise<string> => {
    try {
      const fileRef = ref(storage, `club-logos/${clubId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading club logo:", error);
      throw error;
    }
  },

  // Add new club
  addClub: async (club: Omit<Club, "id">): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, CLUBS_COLLECTION), {
        ...club,
        registrationDate: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error adding club:", error);
      throw error;
    }
  },

  // Update club
  updateClub: async (id: string, updates: Partial<Club>): Promise<void> => {
    try {
      const docRef = doc(db, CLUBS_COLLECTION, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating club:", error);
      throw error;
    }
  },
  // Delete club
  deleteClub: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, CLUBS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting club:", error);
      throw error;
    }
  },

  // Get club by user ID
  getClubByUserId: async (userId: string): Promise<Club | null> => {
    try {
      const clubsQuery = query(
        collection(db, CLUBS_COLLECTION),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(clubsQuery);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        clubName: data.clubName || "",
        schoolName: data.schoolName || "",
        clubType: data.clubType || "",
        email: data.email || "",
        contactName: data.contactName || "",
        contactPhone: data.contactPhone || "",
        clubDescription: data.clubDescription || "",
        logoURL: data.logoURL || "",
        status: data.status || "pending",
        registrationDate: data.registrationDate
          ? convertTimestampToString(data.registrationDate)
          : new Date().toISOString(),
        userId: data.userId || "",
      };
    } catch (error) {
      console.error("Error getting club by user ID:", error);
      return null;
    }
  },
};
