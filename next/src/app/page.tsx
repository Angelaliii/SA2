"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// 使用動態導入以防止水合錯誤，並完全禁用伺服器端渲染
const HomePage = dynamic(() => import("./home-page"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
