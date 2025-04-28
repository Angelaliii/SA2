"use client";

import dynamic from "next/dynamic";

// 使用動態導入以防止水合錯誤
const HomePage = dynamic(() => import("./home-page"), { ssr: false });

export default function Page() {
  return <HomePage />;
}
