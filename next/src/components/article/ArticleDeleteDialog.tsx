import {
  Button, // MUI 按鈕元件
  Dialog, // MUI 對話框元件
  DialogActions, // 對話框底部操作區
  DialogContent, // 對話框內容區
  DialogContentText, // 對話框說明文字
  DialogTitle, // 對話框標題
} from "@mui/material";
import React, { useState } from "react"; // React 及 useState hook
import { deletePost } from "../../firebase/services/post-service"; // 刪除文章服務

// 定義元件的 props 型別
// open: 對話框是否開啟
// onClose: 關閉對話框的函式
// onSuccess: 刪除成功後的回呼
// article: 目標文章物件
type ArticleDeleteDialogProps = {
  open: boolean; // 對話框是否開啟
  onClose: () => void; // 關閉對話框的函式
  onSuccess: () => void; // 刪除成功後的回呼
  article: any; // 目標文章物件
};

export default function ArticleDeleteDialog({
  open, // 是否開啟對話框
  onClose, // 關閉對話框的函式
  onSuccess, // 刪除成功後的回呼
  article, // 目標文章物件
}: ArticleDeleteDialogProps) {
  const [loading, setLoading] = useState(false); // 刪除中狀態

  const handleDelete = async () => { // 處理刪除文章
    if (!article?.id) return; // 若無 id 則不執行

    setLoading(true); // 設定 loading 狀態
    try {
      await deletePost(article.id); // 執行刪除文章
      onSuccess(); // 刪除成功後回呼
    } catch (error) {
      console.error("刪除文章失敗", error); // 錯誤日誌
      alert("刪除文章失敗，請稍後再試"); // 顯示錯誤提示
    } finally {
      setLoading(false); // 結束 loading 狀態
    }
  };

  return (
    <Dialog open={open} onClose={onClose}> {/* 刪除確認對話框 */}
      <DialogTitle>確認刪除</DialogTitle> {/* 對話框標題 */}
      <DialogContent>
        <DialogContentText>
          確定要刪除這篇需求文章「{article?.title || "未命名文章"}」嗎？此操作無法復原。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit"> {/* 取消按鈕 */}
          取消
        </Button>
        <Button onClick={handleDelete} color="error" disabled={loading}> {/* 確認刪除按鈕 */}
          {loading ? "刪除中..." : "確認刪除"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}