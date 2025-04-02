"use client";

import { useEffect, useState } from "react";
import styles from "../assets/Plat.module.css";
import Navbar from "../components/Navbar";
import { getAllPosts, PostData } from "../firebase/services/post-service";

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";

export default function PlatformLanding() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>("全部");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableTags, setAvailableTags] = useState<string[]>(["全部"]);

  // Fetch posts from Firebase
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsData = await getAllPosts();
        setPosts(postsData);

        // Extract unique tags from all posts
        const tags = postsData.flatMap((post) => post.tags);
        const uniqueTags = ["全部", ...Array.from(new Set(tags))];
        setAvailableTags(uniqueTags);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const filteredPosts = posts.filter((post) => {
    const matchSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchTag =
      selectedTag === "全部" ? true : post.tags.includes(selectedTag || "");

    return matchSearch && matchTag;
  });

  return (
    <Box className={styles.page}>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main>
        {/* Search */}
        <Container sx={{ my: 6 }}>
          <TextField
            fullWidth
            label="搜尋文章"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Container>

        {/* Tags */}
        <Container sx={{ my: 0 }}>
          <Box sx={{ px: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {availableTags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                color={selectedTag === tag ? "primary" : "default"}
                onClick={() => setSelectedTag(tag)}
                clickable
              />
            ))}
          </Box>
        </Container>

        {/* Posts */}
        <Container
          sx={{ my: 3, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {filteredPosts.map((post) => (
                <Card key={post.id} variant="outlined">
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {post.content}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                      }}
                    >
                      {post.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ mt: 1 }}
                    >
                      {post.location}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small">閱讀更多</Button>
                  </CardActions>
                </Card>
              ))}
              {filteredPosts.length === 0 && !loading && (
                <Typography variant="body1">找不到符合的文章</Typography>
              )}
            </>
          )}
        </Container>
      </main>
    </Box>
  );
}
