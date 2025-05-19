"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// 創建一個靜態骨架加載元素，確保服務器和客戶端渲染的DOM結構一致
const NavbarSkeleton = () => (
  <div
    style={{
      height: "64px",
      backgroundColor: "#1976d2",
      width: "100%",
      position: "fixed",
      top: 0,
      zIndex: 1100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      color: "white",
    }}
  >
    <div style={{ color: "white", fontWeight: "bold", fontSize: "1.25rem" }}>
      社團企業媒合平台
    </div>
  </div>
);

// 使用 dynamic import 並禁用 SSR，確保 Navbar 只在客戶端渲染
const NavbarDynamic = dynamic(() => import("./Navbar"), {
  ssr: false,
  loading: () => <NavbarSkeleton />,
});

// 包裝組件，使用 Suspense 確保加載過程中顯示一致的骨架屏
const NavbarClientOnly = () => {
  return (
    <Suspense fallback={<NavbarSkeleton />}>
      <NavbarDynamic />
    </Suspense>
  );
};

export default NavbarClientOnly;
