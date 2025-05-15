"use client";

import dynamic from "next/dynamic";
import { ClientOnly } from "../hooks/useHydration";

// 使用 dynamic import 並禁用 SSR，確保 Navbar 只在客戶端渲染
// 這可以完全避免 hydration mismatch 的問題
const NavbarClientOnly = dynamic(() => import("./Navbar"), { ssr: false });

// 用於靜態展示的 fallback 組件
function NavbarFallback() {
  return (
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
      }}
    >
      <div style={{ color: "white", fontWeight: "bold", fontSize: "1.25rem" }}>
        社團企業媒合平台
      </div>
    </div>
  );
}

// 穩定的包裝組件，可以在任何地方安全使用
export default function HydratedNavbar(props: any) {
  return (
    <ClientOnly fallback={<NavbarFallback />}>
      <NavbarClientOnly {...props} />
    </ClientOnly>
  );
}
