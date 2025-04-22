"use client";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";
import Navbar from "../../../components/Navbar";

export default function DemandListPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const q = query(
          collection(db, "posts"),
          where("postType", "==", "demand"), // ✅ 改成正確的 postType
          where("isDraft", "==", false)
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
    fetchPosts();
  }, []);

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 6 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          所有需求牆貼文
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
                <Link
                  href={`/Artical/${post.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      height: "100%",
                      cursor: "pointer",
                      transition: "0.3s",
                      "&:hover": { boxShadow: 4 },
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {post.title || "(未命名文章)"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.organizationName || "(無機構名稱)"}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          gap: 1,
                          flexWrap: "wrap",
                        }}
                      >
                        {(post.selectedDemands || []).map(
                          (item: string, index: number) => (
                            <Chip
                              key={index}
                              label={item}
                              color="primary"
                              size="small"
                            />
                          )
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
}
