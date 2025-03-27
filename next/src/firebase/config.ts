// Firebase 設定檔
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase 專案配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "fjusa-75609",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "fjusa-75609.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 初始化 Firebase - 檢查是否已經初始化
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 初始化 Firestore (資料庫)
export const db = getFirestore(app);

// 初始化 Storage (檔案儲存)
export const storage = getStorage(app);

// 初始化 Auth (身份驗證)
export const auth = getAuth(app);

export default app;
