"use client";

import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ArticleDeleteDialog from "../../components/article/ArticleDeleteDialog";
import EnterpriseDeleteDialog from "../../components/article/EnterpriseDeleteDialog";
import Navbar from "../../components/Navbar";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";

// 定義文章和企業公告的類型
interface Post {
  id: string;
  title: string;
  content?: string;
  demandDescription?: string;
  organizationName?: string;
  companyName?: string;
  authorId: string;
  createdAt: any;
}

export default function ArticleUserPage() {
  const router = useRouter();
  const { user } = useAuth();

  // 狀態管理
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // 新增企業公告的狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  // 刪除文章的狀態
  const [selectedArticle, setSelectedArticle] = useState<Post | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // 標籤切換處理
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 獲取用戶的文章和公告
  const fetchPosts = async () => {
    if (!user) return;

    setLoading(true); // 設定 loading 狀態為 true，表示開始載入資料
    try {
      const collectionName = tabValue === 0 ? "posts" : "enterprisePosts";
      const q = query(
        collection(db, collectionName),
        where("authorId", "==", user.uid)
      );

      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];

      setPosts(results);
    } catch (err) {
      console.error("讀取貼文失敗", err);
    } finally {
      setLoading(false);
    }
  };

  // 新增公告對話框操作
  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewTitle("");
    setNewContent("");
  };

  // 提交新公告
  const handleSubmitAnnouncement = async () => {
    if (!newTitle || !newContent) {
      alert("請填寫所有必填欄位");
      return;
    }

    if (!user) {
      alert("請先登入");
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, "enterprisePosts"), {
        title: newTitle,
        content: newContent,
        createdAt: serverTimestamp(),
        authorId: user.uid,
      });

      alert("企業公告發布成功！");
      handleCloseDialog();
      setTabValue(1); // 切換到企業公告標籤
      fetchPosts(); // 重新獲取文章列表
    } catch (error) {
      console.error("發布失敗", error);
      alert("發布失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除文章對話框操作
  const handleDeleteClick = (post: Post) => {
    setSelectedArticle(post);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedArticle(null);
  };

  const handleDeleteSuccess = () => {
    handleCloseDeleteDialog();
    // 從列表中移除已刪除的文章
    setPosts((prev) => prev.filter((post) => post.id !== selectedArticle?.id));
  };

  // 當用戶或標籤變更時，重新獲取文章
  useEffect(() => {
    fetchPosts();
  }, [user, tabValue]);

  // 渲染文章卡片
  const renderPostCard = (post: Post) => (
    <Grid item xs={12} sm={6} key={post.id}>
      <Card
        variant="outlined"
        sx={{
          cursor: "pointer",
          transition: "0.3s",
          "&:hover": { boxShadow: 4 },
        }}
      >
        <CardContent>
          <Typography variant="h6">{post.title || "(未命名文章)"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {post.organizationName || post.companyName || "(無機構名稱)"}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            {post.demandDescription || post.content || "(無描述)"}
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <Link
              href={`/${tabValue === 0 ? "ArticalEdit" : "Enterprise"}/${
                post.id
              }`}
              passHref
            >
              <Button variant="contained" color="primary" size="small">
                查看內容
              </Button>
            </Link>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(post);
              }}
            >
              刪除
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          我的文章管理
        </Typography>

        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label="需求文章" />
          <Tab label="企業公告" />
        </Tabs>

        {/* 只在企業公告標籤顯示新增按鈕 */}
        {tabValue === 1 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            sx={{ mb: 2 }}
          >
            發布新企業公告
          </Button>
        )}

        {/* 顯示文章列表 */}
        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Typography>目前尚無相關貼文。</Typography>
        ) : (
          <Grid container spacing={3}>
            {posts.map(renderPostCard)}
          </Grid>
        )}
      </Container>

      {/* 新增企業公告對話框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>發布企業公告</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="公告標題"
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            label="公告內容"
            variant="outlined"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            required
            multiline
            rows={6}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            取消
          </Button>
          <Button
            onClick={handleSubmitAnnouncement}
            color="primary"
            disabled={submitting}
          >
            {submitting ? "發布中..." : "發布"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除文章對話框 */}
      {openDeleteDialog &&
        selectedArticle &&
        (tabValue === 0 ? (
          <ArticleDeleteDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onSuccess={handleDeleteSuccess}
            article={selectedArticle}
          />
        ) : (
          <EnterpriseDeleteDialog
            open={openDeleteDialog}
            onClose={handleCloseDeleteDialog}
            onSuccess={handleDeleteSuccess}
            announcement={selectedArticle}
          />
        ))}
    </>
  );
}
