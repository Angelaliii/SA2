"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";

// Add type interface for articles
interface Article {
  id: string;
  collection: string;
  title?: string;
  content?: string;
  postType?: string;
  authorId?: string;
  createdAt?: any; // 更改為 any 以兼容 Firestore 的時間戳記格式
  updatedAt?: string;
  isDraft?: boolean;
}

export default function ArticleManager() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editArticle, setEditArticle] = useState<Article | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // Only render on the client side to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchUserArticles = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 首先嘗試查詢 posts 集合中的文章
      const postsQuery = query(
        collection(db, "posts"),
        where("authorId", "==", user.uid),
        where("isDraft", "==", false) // 確保只獲取已發布的文章
      );

      // 然後嘗試查詢 articles 集合中的文章 (如果有這個集合)
      const articlesQuery = query(
        collection(db, "articles"),
        where("authorId", "==", user.uid)
      );

      // 執行查詢
      const [postsSnapshot, articlesSnapshot] = await Promise.all([
        getDocs(postsQuery),
        getDocs(articlesQuery).catch(() => ({ docs: [] })), // 如果 articles 集合不存在，返回空陣列
      ]);

      // 合併兩個查詢結果
      const postsData = postsSnapshot.docs.map((doc) => ({
        id: doc.id,
        collection: "posts",
        ...doc.data(),
      })) as Article[];

      const articlesData = articlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        collection: "articles",
        ...doc.data(),
      })) as Article[];

      const allArticles = [...postsData, ...articlesData];

      // 根據創建時間排序文章
      allArticles.sort((a, b) => {
        const timeA = a.createdAt?.toDate
          ? a.createdAt.toDate()
          : new Date(a.createdAt ?? 0);
        const timeB = b.createdAt?.toDate
          ? b.createdAt.toDate()
          : new Date(b.createdAt ?? 0);
        return timeB.getTime() - timeA.getTime();
      });

      setArticles(allArticles);
      console.log(`找到 ${allArticles.length} 篇已發布文章`);
    } catch (err: any) {
      console.error("Error fetching articles:", err);
      setError("載入文章時發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's articles when component mounts
  useEffect(() => {
    if (user) {
      fetchUserArticles();
    }
  }, [user]);

  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!articleToDelete) return;

    try {
      // 根據文章來源的集合名稱來刪除
      const collectionName = articleToDelete.collection || "posts";
      await deleteDoc(doc(db, collectionName, articleToDelete.id));

      setSuccess("文章已成功刪除");
      setArticles(
        articles.filter((article) => article.id !== articleToDelete.id)
      );
      setDeleteDialogOpen(false);
    } catch (err: any) {
      console.error("Error deleting article:", err);
      setError("刪除文章時發生錯誤，請稍後再試");
    }
  };

  const handleEditClick = (article: Article) => {
    setEditArticle(article);
    setEditTitle(article.title ?? "");
    setEditContent(article.content ?? "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editArticle) return;

    try {
      const collectionName = editArticle.collection || "posts";
      await updateDoc(doc(db, collectionName, editArticle.id), {
        title: editTitle,
        content: editContent,
        updatedAt: new Date().toISOString(),
      });

      // Update the article in the local state
      setArticles(
        articles.map((article) =>
          article.id === editArticle.id
            ? { ...article, title: editTitle, content: editContent }
            : article
        )
      );

      setSuccess("文章已成功更新");
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating article:", err);
      setError("更新文章時發生錯誤，請稍後再試");
    }
  };

  // Format date for display
  const formatDate = (timestamp: any) => {
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
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          我發布的文章
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {articles.length === 0 ? (
          <Typography color="text.secondary">您尚未發布任何文章</Typography>
        ) : (
          <Box sx={{ mt: 2 }}>
            {articles.map((article) => (
              <Card key={article.id} sx={{ mb: 2, borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" component="div" gutterBottom>
                    {article.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {article.postType ?? "一般文章"}
                  </Typography>
                  <Typography variant="body2">
                    {article.content && article.content.length > 100
                      ? `${article.content.substring(0, 100)}...`
                      : article.content}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    發布日期: {formatDate(article.createdAt)}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEditClick(article)}
                    title="編輯文章"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(article)}
                    title="刪除文章"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </CardActions>
              </Card>
            ))}
          </Box>
        )}
      </Box>
      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>編輯文章</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文章標題"
            fullWidth
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="文章內容"
            fullWidth
            multiline
            rows={10}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            儲存
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>確認刪除文章</DialogTitle>
        <DialogContent>
          <Typography>
            您確定要刪除文章「{articleToDelete?.title}」嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>取消</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            刪除
          </Button>
        </DialogActions>
      </Dialog>{" "}
      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
