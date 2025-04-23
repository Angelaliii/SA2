"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Box, Container, Grid, Typography, Card, CardContent, Button, CircularProgress } from "@mui/material";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth"; // 假設您已經有這個自定義的 useAuth hook
import Navbar from "../../components/Navbar";

export default function ArticalUserPage() {
  const { user } = useAuth(); // 獲取當前用戶
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) return; // 確保用戶已登入

      setLoading(true);
      try {
        // 確保篩選條件是根據用戶的 authorId 查詢文章
        const q = query(
          collection(db, "posts"),
          where("authorId", "==", user.uid), // 篩選當前用戶的文章
          where("postType", "==", "demand"),  // 確保是需求文章
          where("isDraft", "==", false)       // 確保文章是已發布的
        );
        const snapshot = await getDocs(q);
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(results); // 更新文章列表
      } catch (err) {
        console.error("讀取貼文失敗", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user]); // 當用戶變更時重新抓取資料

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          我的需求文章
        </Typography>

        {loading ? (
          <Box textAlign="center" mt={4}>
            <CircularProgress />
          </Box>
        ) : posts.length === 0 ? (
          <Typography>目前尚無需求貼文。</Typography>
        ) : (
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} sm={6} key={post.id}>
                <Card variant="outlined" sx={{ cursor: "pointer", transition: "0.3s", "&:hover": { boxShadow: 4 } }}>
                  <CardContent>
                    <Typography variant="h6">{post.title || "(未命名文章)"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.organizationName || "(無機構名稱)"}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {post.demandDescription || "(無需求描述)"}
                    </Typography>

                    {/* 修改按鈕 */}
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between" }}>
                      <Link href={`/ArticalEdit/${post.id}`} passHref>
                        <Button variant="contained" color="primary" size="small">
                          修改內容
                        </Button>
                      </Link>

                      {/* 刪除按鈕 */}
                      <Button variant="contained" color="error" size="small">
                        刪除文章
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
