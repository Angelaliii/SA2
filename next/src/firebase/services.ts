// Firebase 服務層
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { auth, db } from "./config";

// 公司註冊相關功能
export const companyServices = {
  // 公司註冊 - 使用 Python 後端 API
  async registerCompany(
    companyData: any,
    logoFile: File | null,
    certificateFile: File | null
  ) {
    try {
      const formData = new FormData();

      // 添加公司基本資料
      formData.append("companyName", companyData.companyName);
      formData.append("businessId", companyData.businessId);
      formData.append("industryType", companyData.industryType);
      formData.append("contactName", companyData.contactName);
      formData.append("contactPhone", companyData.contactPhone);
      formData.append("email", companyData.email);

      if (companyData.companyDescription) {
        formData.append("companyDescription", companyData.companyDescription);
      }

      // 添加合作領域，如果是陣列
      if (Array.isArray(companyData.cooperationFields)) {
        companyData.cooperationFields.forEach((field: string) => {
          formData.append("cooperationFields", field);
        });
      }

      // 添加檔案
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      if (certificateFile) {
        formData.append("businessCertificate", certificateFile);
      }

      // 發送請求到 Python API
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
        const endpoint = backendUrl
          ? `${backendUrl}/api/register/company`
          : "/api/register/company";

        const response = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `後端回應錯誤: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "註冊失敗");
        }

        return {
          success: true,
          data: result.data,
        };
      } catch (error) {
        console.error("API請求失敗:", error);
        return {
          success: false,
          error: "後端API連接失敗，請確認後端服務是否正常運行",
        };
      }
    } catch (error) {
      console.error("公司註冊失敗:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "註冊過程中發生錯誤",
      };
    }
  },

  // 獲取公司資料 (如果需要)
  async getCompanyById(companyId: string) {
    try {
      const q = query(
        collection(db, "companies"),
        where("id", "==", companyId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const companyData = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        };
        return { success: true, data: companyData };
      } else {
        return { success: false, error: "找不到此公司資料" };
      }
    } catch (error) {
      console.error("獲取公司資料失敗:", error);
      return {
        success: false,
        error: "獲取資料時發生錯誤",
      };
    }
  },

  // 獲取公司列表 (分頁)
  async getCompanyList(lastVisible = null, pageSize = 10) {
    try {
      let q;
      if (lastVisible) {
        q = query(
          collection(db, "companies"),
          orderBy("registrationDate", "desc"),
          startAfter(lastVisible),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "companies"),
          orderBy("registrationDate", "desc"),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);

      const companies = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // 返回最後一個文件作為下一頁的起點
      const lastVisibleDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      return {
        success: true,
        data: companies,
        lastVisible: lastVisibleDoc,
        hasMore: companies.length === pageSize,
      };
    } catch (error) {
      console.error("獲取公司列表失敗:", error);
      return {
        success: false,
        error: "獲取資料時發生錯誤",
      };
    }
  },

  // 根據行業類型篩選公司
  async getCompaniesByIndustry(industryType: string) {
    try {
      const q = query(
        collection(db, "companies"),
        where("industryType", "==", industryType),
        where("status", "==", "approved"), // 只獲取已審核通過的公司
        orderBy("registrationDate", "desc")
      );

      const querySnapshot = await getDocs(q);
      const companies = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return {
        success: true,
        data: companies,
      };
    } catch (error) {
      console.error("根據行業篩選公司失敗:", error);
      return {
        success: false,
        error: "篩選資料時發生錯誤",
      };
    }
  },

  // 搜尋公司
  async searchCompanies(searchTerm: string) {
    try {
      // Firebase 不支援原生文字搜尋，我們使用簡單的包含查詢
      // 實際應用可能需要考慮使用 Algolia 等搜索服務

      const q = query(
        collection(db, "companies"),
        where("status", "==", "approved") // 只搜尋已審核通過的公司
      );

      const querySnapshot = await getDocs(q);

      // 在客戶端進行過濾
      const searchTermLower = searchTerm.toLowerCase();
      const companies = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (company: any) =>
            company.companyName.toLowerCase().includes(searchTermLower) ||
            (company.companyDescription &&
              company.companyDescription
                .toLowerCase()
                .includes(searchTermLower))
        );

      return {
        success: true,
        data: companies,
      };
    } catch (error) {
      console.error("搜尋公司失敗:", error);
      return {
        success: false,
        error: "搜尋時發生錯誤",
      };
    }
  },
};

// 使用者認證相關功能
export const authServices = {
  // 註冊新用戶
  async register(email: string, password: string, displayName: string) {
    try {
      // 創建用戶
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 設置顯示名稱
      await updateProfile(user, {
        displayName,
      });

      // 在 Firestore 中創建用戶記錄
      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email,
        displayName,
        role: "user", // 預設角色
        createdAt: new Date().toISOString(),
      });

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      };
    } catch (error: any) {
      let errorMessage = "註冊失敗";

      // 處理常見錯誤
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "此電子郵件已被使用";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "電子郵件格式不正確";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "密碼強度不足";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 用戶登入
  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        },
      };
    } catch (error: any) {
      let errorMessage = "登入失敗";

      // 處理常見錯誤
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        errorMessage = "電子郵件或密碼不正確";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "登入嘗試次數過多，請稍後再試";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 登出
  async logout() {
    try {
      await firebaseSignOut(auth);
      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: "登出時發生錯誤",
      };
    }
  },

  // 重置密碼
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "密碼重置連結已發送至您的電子郵件",
      };
    } catch (error: any) {
      let errorMessage = "密碼重置失敗";

      if (error.code === "auth/user-not-found") {
        errorMessage = "找不到此電子郵件的用戶";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // 獲取當前用戶資料 (含角色資訊)
  async getCurrentUserWithRole() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return {
          success: false,
          error: "未登入",
        };
      }

      // 從 Firestore 獲取額外的用戶資料
      const q = query(
        collection(db, "users"),
        where("uid", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return {
          success: true,
          user: {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            role: "user", // 預設角色
          },
        };
      }

      const userData = querySnapshot.docs[0].data();

      return {
        success: true,
        user: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          role: userData.role || "user",
          // 返回其他需要的用戶資料
          ...userData,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "獲取用戶資料時發生錯誤",
      };
    }
  },
};
