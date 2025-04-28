"use client";

import dynamic from "next/dynamic";

// 使用動態導入，並關閉SSR以避免水合錯誤
const LoginPageClient = dynamic(() => import("./login-page-client"), {
  ssr: false,
});

export default function LoginPage() {
  return <LoginPageClient />;
}
