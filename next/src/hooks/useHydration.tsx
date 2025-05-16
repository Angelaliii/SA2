"use client";
import { useEffect, useState } from "react";

/**
 * A hook that returns information about component hydration state.
 * Used to prevent hydration mismatches between server and client rendering.
 */
export default function useHydration() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Using setTimeout instead of requestAnimationFrame for more reliable behavior
    // This ensures we're fully in the client rendering phase after hydration
    setTimeout(() => {
      setHasMounted(true);
    }, 0);
  }, []);

  return hasMounted;
}

/**
 * Client-only component wrapper that only renders its children after hydration
 * Enhanced to better handle Material-UI style injection and prevent hydration mismatches
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // 使用更可靠的方式來確保hydration完成
    let mounted = false;

    // 確保在客戶端渲染階段
    if (typeof window !== "undefined") {
      // 使用兩層嵌套的setTimeout，確保我們已經完全完成了初始渲染階段
      const timer = setTimeout(() => {
        requestAnimationFrame(() => {
          if (!mounted) {
            setHasMounted(true);
            mounted = true;
          }
        });
      }, 100); // 使用更長的延遲

      return () => {
        clearTimeout(timer);
      };
    }
  }, []);

  // 在服務器端渲染和首次客戶端渲染期間，使用最小化的DOM結構
  // 這減少了服務器和客戶端之間的差異
  if (!hasMounted) {
    // 確保服務器端和客戶端第一次渲染時得到完全相同的內容
    // 返回一個與子元素匹配的DOM結構但無內容的元素，以減少水合差異
    return fallback !== null ? (
      <>{fallback}</>
    ) : (
      <span style={{ display: "none" }}></span>
    );
  }

  // 一旦在客戶端加載完成，渲染實際內容
  return <>{children}</>;
}
