/**
 * 日期處理工具函數
 */

/**
 * 格式化日期為yyyy-MM-dd格式
 * @param date 日期物件
 * @returns 格式化後的日期字串
 */
export const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return date.toISOString().split("T")[0]; // 返回YYYY-MM-DD格式
};

/**
 * 將日期字串轉換為Date物件
 * @param dateStr 日期字串
 * @returns 日期物件
 */
export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  return new Date(dateStr);
};
