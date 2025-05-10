import { FirebaseError } from "firebase/app";

/**
 * 處理 Firebase 身份驗證錯誤，返回用戶友好的錯誤信息
 * @param error Firebase 錯誤對象
 * @returns 用戶友好的錯誤信息
 */
export function handleFirebaseAuthError(error: unknown): string {
  console.log("處理Firebase錯誤:", error);

  if (!(error instanceof FirebaseError)) {
    if (error instanceof Error) {
      console.error("非Firebase錯誤:", error.message);
      return `發生錯誤: ${error.message}`;
    }
    return "發生未知錯誤，請稍後再試";
  }

  // 解析 Firebase 錯誤代碼
  switch (error.code) {
    // 登入相關錯誤
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "帳號或密碼錯誤，請重新輸入";
    case "auth/too-many-requests":
      return "嘗試次數過多，請稍後再試或重設密碼";
    case "auth/user-disabled":
      return "此帳號已被停用，請聯繫管理員";
    case "auth/invalid-login-credentials":
      return "登入憑證無效，請確認您的帳號和密碼";

    // 電子郵件相關錯誤
    case "auth/invalid-email":
      return "請輸入有效的電子郵件地址";
    case "auth/email-already-in-use":
      return "此電子郵件已被註冊，請使用其他電子郵件";

    // 密碼相關錯誤
    case "auth/weak-password":
      return "密碼強度不足，請設置更強的密碼";

    // 網路相關錯誤
    case "auth/network-request-failed":
      return "網路連線失敗，請確認您的網路狀態";

    // 其他錯誤
    default:
      console.error("Firebase錯誤:", error.code, error.message);
      return `登入過程中發生錯誤 (${error.code})，請稍後再試`;
  }
}
