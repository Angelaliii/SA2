"use client";

import BookmarkIcon from "@mui/icons-material/Bookmark";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";

// Define types for better type checking
interface Favorite {
  id: string;
  userId: string;
  articleId: string;
  [key: string]: any;
}

interface Article {
  id: string;
  title?: string;
  content?: string;
  authorName?: string;
  author?: string;
  createdAt?: any;
  postType?: string;
  tags?: string[];
  collection?: string;
  favoriteId?: string;
  [key: string]: any;
}

export default function FavoriteArticlesManager() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  // Only render on the client side to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user's favorites and related article details
  const fetchFavorites = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", user.uid)
      );

      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoritesData = favoritesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Favorite[];

      const articleIds = favoritesData.map((fav) => fav.articleId);

      if (articleIds.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      let allArticles: Article[] = [];

      try {
        if (articleIds.length > 0) {
          const batchSize = 10;

          for (let i = 0; i < articleIds.length; i += batchSize) {
            const batch = articleIds.slice(i, i + batchSize);

            for (const id of batch) {
              try {
                const postDoc = await getDocs(
                  query(
                    collection(db, "posts"),
                    where("__name__", "==", id)
                  )
                );

                if (!postDoc.empty) {
                  const post = postDoc.docs[0];
                  allArticles.push({
                    id: post.id,
                    ...post.data(),
                    collection: "posts",
                  });
                } else {
                  const enterpriseDoc = await getDocs(
                    query(
                      collection(db, "enterprisePosts"),
                      where("__name__", "==", id)
                    )
                  );

                  if (!enterpriseDoc.empty) {
                    const enterprisePost = enterpriseDoc.docs[0];
                    allArticles.push({
                      id: enterprisePost.id,
                      ...enterprisePost.data(),
                      collection: "enterprisePosts",
                    });
                  }
                }
              } catch (err) {
                console.error(`Error fetching post with ID ${id}:`, err);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching from posts or enterprisePosts collection:", err);
      }

      const articlesWithFavoriteInfo = allArticles.map((article) => {
        const favorite = favoritesData.find(
          (fav) => fav.articleId === article.id
        );
        return {
          ...article,
          favoriteId: favorite?.id,
        };
      });

      setArticles(articlesWithFavoriteInfo);
    } catch (err: any) {
      console.error("Error fetching favorites:", err);
      setError("載入收藏文章時發生錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  // Remove from favorites
  const handleRemoveFavorite = async (article: Article) => {
    if (!article.favoriteId) return;

    try {
      await deleteDoc(doc(db, "favorites", article.favoriteId));
      setArticles(articles.filter((a) => a.id !== article.id));
      setSuccess("已從收藏中移除");
    } catch (err: any) {
      console.error("Error removing favorite:", err);
      setError("移除收藏時發生錯誤，請稍後再試");
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
          我的收藏
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {articles.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <BookmarkBorderIcon
              sx={{ fontSize: 60, color: "text.disabled", mb: 2 }}
            />
            <Typography color="text.secondary" variant="h6">
              您尚未收藏任何文章
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              瀏覽文章時點擊收藏按鈕，可以將文章加入此處
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/Artical/DemandList"
              sx={{ mt: 3 }}
            >
              瀏覽需求牆
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {articles.map((article, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={article.id}
              >
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 2,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      component="div"
                      gutterBottom
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: 1.3,
                        height: "2.6em",
                      }}
                    >
                      {article.title ?? "(未命名文章)"}
                    </Typography>

                    <Box sx={{ mb: 1.5 }}>
                      <Chip
                        size="small"
                        label={
                          article.postType === "demand"
                            ? "需求文章"
                            : article.postType ?? "一般文章"
                        }
                        color="primary"
                        variant="outlined"
                      />
                      {article.tags && article.tags.length > 0 && (
                        <Chip
                          size="small"
                          label={article.tags[0]}
                          sx={{ ml: 0.5 }}
                        />
                      )}
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        mb: 1,
                        height: "2.5em",
                      }}
                    >
                      {article.content ?? "無內容預覽"}
                    </Typography>

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        作者:{" "}
                        {article.authorName ?? article.author ?? "未知作者"}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        發布日期: {formatDate(article.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions
                    sx={{ justifyContent: "space-between", p: 1.5, pt: 0 }}
                  >
                    <Button
                      size="small"
                      color="primary"
                      component={Link}
                      href={`/Artical/${article.id}`}
                      startIcon={<VisibilityIcon />}
                    >
                      查看
                    </Button>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleRemoveFavorite(article)}
                      title="移除收藏"
                    >
                      <BookmarkIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </motion.div>
            ))}
          </Stack>
        )}
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess("")}
      >
        <Alert severity="success" sx={{ width: "100%" }}>
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError("")}
      >
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
