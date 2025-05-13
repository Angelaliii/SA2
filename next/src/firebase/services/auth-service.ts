// Authentication services
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { auth } from "../config";

// Define types for auth responses
interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

export const authServices = {
  // Login with email and password
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // 在登入前檢查配置
      if (!auth) {
        console.error("Auth instance is not initialized");
        return {
          success: false,
          error: "身份驗證服務未初始化，請重新載入頁面",
        };
      }

      console.log("嘗試登入:", { email, passwordLength: password?.length });

      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      console.log("登入成功, 使用者:", userCredential.user.uid);

      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error: any) {
      console.error("Login error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let message = "登入失敗，請檢查您的帳號密碼";

      // 處理各種常見 Firebase 錯誤
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        message = "帳號或密碼錯誤，請重新輸入";
      } else if (error.code === "auth/too-many-requests") {
        message = "嘗試次數過多，請稍後再試或重設密碼";
      } else if (error.code === "auth/user-disabled") {
        message = "此帳號已被停用，請聯繫管理員";
      } else if (error.code === "auth/network-request-failed") {
        message = "網路連線失敗，請確認您的網路狀態";
      }

      return {
        success: false,
        error: message,
      };
    }
  },

  // Reset password
  resetPassword: async (email: string): Promise<AuthResponse> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
      };
    } catch (error: any) {
      console.error("Password reset error:", error);
      let message = "重設密碼請求失敗，請稍後再試";

      if (error.code === "auth/user-not-found") {
        message = "此電子郵件未註冊，請確認後重試";
      } else if (error.code === "auth/invalid-email") {
        message = "請輸入有效的電子郵件地址";
      }

      return {
        success: false,
        error: message,
      };
    }
  },

  // Logout
  logout: async (): Promise<AuthResponse> => {
    try {
      await signOut(auth);
      // 清除保存在 sessionStorage 中的用戶身份狀態
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("isClubUser");
        sessionStorage.removeItem("isCompanyUser");
      }
      return {
        success: true,
      };
    } catch (error: any) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: "登出失敗，請稍後再試",
      };
    }
  },

  // Get current user
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  // Add auth state listener
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  },
};
