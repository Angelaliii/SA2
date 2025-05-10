/**
 * 水合相關的工具函數
 */

import React, { ReactNode } from "react";
import { ClientOnly } from "../hooks/useHydration";

/**
 * 安全渲染組件，確保只在客戶端渲染，避免水合錯誤
 *
 * @param Component 需要安全渲染的組件
 * @param fallback 服務端渲染時的替代內容
 * @returns 安全的客戶端組件
 */
export function safeClientRender(
  Component: ReactNode,
  fallback: ReactNode = null
) {
  return React.createElement(ClientOnly, { fallback, children: Component });
}

/**
 * 延遲執行函數，直到組件已經在客戶端水合完成
 * 可用於需要訪問 window 或其他僅客戶端可用 API 的場景
 *
 * @param callback 需要執行的回調函數
 * @param delay 可選的延遲時間（毫秒）
 */
export function executeAfterHydration(callback: () => void, delay: number = 0) {
  if (typeof window !== "undefined") {
    setTimeout(() => {
      requestAnimationFrame(() => {
        callback();
      });
    }, delay);
  }
}
