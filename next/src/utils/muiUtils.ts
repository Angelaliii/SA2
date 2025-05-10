/**
 * MUI 元件使用的工具函數
 */

/**
 * 返回 MUI Typography 組件適合的 component 屬性
 * 用於避免嵌套 <p> 標籤造成的水合（hydration）錯誤
 *
 * @param isNested 是否為嵌套在其他 Typography 或 p 標籤內的元素
 * @returns 適合的 component 類型
 */
export function getTypographyComponent(
  isNested: boolean = false
): React.ElementType {
  return isNested ? "span" : "p";
}

/**
 * 安全的 Typography 配置
 * 當需要在 Link 或其他可能包含 p 元素的組件內使用 Typography 時，
 * 建議使用這些配置來避免 HTML 驗證錯誤
 */
export const safeTypographyProps = {
  nested: {
    component: "span", // 保證嵌套時不會使用 p 標籤
  },
  link: {
    component: "span", // 在 Link 內部使用的 Typography 應該是 span
  },
};
