// Company data services
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

// Company interface matching the one in CompanyList.tsx
export interface Company {
  id: string;
  companyName: string;
  businessId: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  companyDescription: string;
  logoURL?: string;
  businessCertificateURL?: string;
  status: string;
  registrationDate: string;
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

// Companies collection name
const COMPANIES_COLLECTION = "companies";

export const companyServices = {
  // Get all companies
  getAllCompanies: async (): Promise<Company[]> => {
    try {
      const companiesQuery = query(
        collection(db, COMPANIES_COLLECTION),
        orderBy("registrationDate", "desc")
      );

      const querySnapshot: QuerySnapshot = await getDocs(companiesQuery);

      const companies: Company[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          companyName: data.companyName || "",
          businessId: data.businessId || "",
          industryType: data.industryType || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          email: data.email || "",
          companyDescription: data.companyDescription || "",
          logoURL: data.logoURL,
          businessCertificateURL: data.businessCertificateURL,
          status: data.status || "pending",
          registrationDate: data.registrationDate
            ? convertTimestampToString(data.registrationDate)
            : new Date().toISOString(),
        };
      });

      return companies;
    } catch (error) {
      console.error("Error getting companies:", error);
      throw error;
    }
  },

  // Get company by ID
  getCompanyById: async (id: string): Promise<Company | null> => {
    try {
      const docRef = doc(db, COMPANIES_COLLECTION, id);
      const docSnap: DocumentSnapshot = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          companyName: data.companyName || "",
          businessId: data.businessId || "",
          industryType: data.industryType || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          email: data.email || "",
          companyDescription: data.companyDescription || "",
          logoURL: data.logoURL,
          businessCertificateURL: data.businessCertificateURL,
          status: data.status || "pending",
          registrationDate: data.registrationDate
            ? convertTimestampToString(data.registrationDate)
            : new Date().toISOString(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting company by ID:", error);
      throw error;
    }
  },

  // Get companies by status
  getCompaniesByStatus: async (status: string): Promise<Company[]> => {
    try {
      const companiesQuery = query(
        collection(db, COMPANIES_COLLECTION),
        where("status", "==", status),
        orderBy("registrationDate", "desc")
      );

      const querySnapshot = await getDocs(companiesQuery);

      const companies: Company[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          companyName: data.companyName || "",
          businessId: data.businessId || "",
          industryType: data.industryType || "",
          contactName: data.contactName || "",
          contactPhone: data.contactPhone || "",
          email: data.email || "",
          companyDescription: data.companyDescription || "",
          logoURL: data.logoURL,
          businessCertificateURL: data.businessCertificateURL,
          status: data.status || "pending",
          registrationDate: data.registrationDate
            ? convertTimestampToString(data.registrationDate)
            : new Date().toISOString(),
        };
      });

      return companies;
    } catch (error) {
      console.error("Error getting companies by status:", error);
      throw error;
    }
  },

  // Upload company logo
  uploadCompanyLogo: async (companyId: string, file: File): Promise<string> => {
    try {
      const fileRef = ref(storage, `company-logos/${companyId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading company logo:", error);
      throw error;
    }
  },

  // Upload business certificate
  uploadBusinessCertificate: async (
    companyId: string,
    file: File
  ): Promise<string> => {
    try {
      const fileRef = ref(
        storage,
        `business-certificates/${companyId}/${file.name}`
      );
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading business certificate:", error);
      throw error;
    }
  },

  // Add new company
  addCompany: async (company: Omit<Company, "id">): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COMPANIES_COLLECTION), {
        ...company,
        registrationDate: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error adding company:", error);
      throw error;
    }
  },

  // Update company
  updateCompany: async (
    id: string,
    updates: Partial<Company>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COMPANIES_COLLECTION, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  },

  // Delete company
  deleteCompany: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COMPANIES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting company:", error);
      throw error;
    }
  },
};
