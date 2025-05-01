"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// 使用動態導入，並關閉SSR以避免水合錯誤
const LoginPageClient = dynamic(() => import("./login-page-client"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      Loading...
    </div>
  ),
});

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageClient />
    </Suspense>
  );
}
