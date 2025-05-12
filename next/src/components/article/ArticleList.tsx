"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import { Typography, Paper, Box, CircularProgress } from "@mui/material";

export default function ArticleList({ authorId }: { authorId: string }) {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      const q = query(
        collection(db, "posts"),
        where("authorId", "==", authorId),
        where("isDraft", "==", false)
      );
      const snapshot = await getDocs(q);
      setArticles(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchArticles();
  }, [authorId]);

  if (loading) return <CircularProgress />;
  if (articles.length === 0) return <Typography>尚無已發佈文章</Typography>;

  return (
    <Box>
      {articles.map((article) => (
        <Paper key={article.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">{article.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {article.content}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
