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

export default function ArticalUserPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const router = useRouter();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewTitle("");
    setNewContent("");
  };

  const handleDeleteClick = (post: any) => {
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
    setPosts((prev) => prev.filter((post) => post.id !== selectedArticle.id));
  };

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

  const fetchPosts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, tabValue === 0 ? "posts" : "enterprisePosts"),
        where("authorId", "==", user.uid)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(results);
    } catch (err) {
      console.error("讀取貼文失敗", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user, tabValue]);

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

        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Typography>目前尚無相關貼文。</Typography>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
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
                    <Typography variant="h6">
                      {post.title || "(未命名文章)"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.organizationName ||
                        post.companyName ||
                        "(無機構名稱)"}
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
                        href={`/${
                          tabValue === 0 ? "ArticalEdit" : "Enterprise"
                        }/${post.id}`}
                        passHref
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                        >
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
            ))}
          </Grid>
        )}
      </Container>

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
          </Button>{" "}
          <Button
            onClick={handleSubmitAnnouncement}
            color="primary"
            disabled={submitting}
          >
            {submitting ? "發布中..." : "發布"}
          </Button>
        </DialogActions>
      </Dialog>

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
