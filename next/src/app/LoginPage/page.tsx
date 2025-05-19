// 表示這是一個客戶端（Client Side）元件
"use client";

// 從 next/dynamic 匯入 dynamic，用來動態載入元件（類似 Python 的 importlib.import_module）
import dynamic from "next/dynamic";

// 從 react 匯入 Suspense，當元件在載入時可以顯示備用內容
import { Suspense } from "react";

// 使用 dynamic 函式來動態載入 login-page-client 元件
// 設定 ssr: false，代表這個元件不會在伺服器端渲染（避免 hydration 錯誤）
// 加上 loading 選項：在元件還沒載入完成前會顯示 Loading... 畫面
const LoginPageClient = dynamic(() => import("./login-page-client"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh", // 高度撐滿整個畫面
        display: "flex", // 使用 flex 排版
        justifyContent: "center", // 水平置中
        alignItems: "center", // 垂直置中
      }}
    >
      Loading...
    </div>
  ),
});

// 頁面的主組件 LoginPage（這是 default export）
// 使用 <Suspense> 元件來包住 LoginPageClient，如果還沒載入完成可以顯示 fallback
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      {/* 這裡放的是剛才動態載入的 LoginPageClient 元件 */}
      <LoginPageClient />
    </Suspense>
  );
}
