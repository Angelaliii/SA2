// Authentication services
import {
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
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return {
        success: true,
        user: userCredential.user,
      };
    } catch (error: any) {
      console.error("Login error:", error);
      let message = "登入失敗，請檢查您的帳號密碼";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        message = "帳號或密碼錯誤，請重新輸入";
      } else if (error.code === "auth/too-many-requests") {
        message = "嘗試次數過多，請稍後再試或重設密碼";
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
};
