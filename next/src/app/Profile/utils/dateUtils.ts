export function formatDate(timestamp: any) {
  if (!timestamp) return "未知日期";

  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (err) {
    console.error("Date formatting error:", err);
    return "日期格式錯誤";
  }
}
