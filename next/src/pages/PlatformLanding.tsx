"use client";

import { useState } from "react";
import styles from "../assets/Plat.module.css";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags = ["全部", "活動", "科技", "設計"];

  const articles = [
    { title: "科技新創展覽", content: "這是科技展的文章", tag: "科技" },
    { title: "設計交流會", content: "設計圈的活動紀實", tag: "設計" },
    { title: "社團迎新活動", content: "一年一度迎新", tag: "活動" },
  ];

  const filteredArticles = articles.filter((article) => {
    const matchSearch =
      article.title.includes(searchTerm) ||
      article.content.includes(searchTerm);
    const matchTag =
      selectedTag === "全部" || selectedTag === null
        ? true
        : article.tag === selectedTag;

    return matchSearch && matchTag;
  });

  return (
    <Box className={styles.page}>
      {/* Navbar */}
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Logo / 標題 */}
          <Typography variant="h6">社團企業媒合平台</Typography>

          {/* 導覽連結 */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button color="inherit">找贊助</Button>
            <Button color="inherit">企業</Button>
            <Button color="inherit">社團</Button>
            <Button color="inherit">登入</Button>
            <Button color="inherit">註冊</Button>
          </Box>
        </Toolbar>
      </AppBar>

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
          {tags.map((tag) => (
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

      {/* Articles */}
      <Container
        sx={{ my: 3, display: "flex", flexDirection: "column", gap: 2 }}
      >
        {filteredArticles.map((article, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Typography variant="h6" component="div">
                {article.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {article.content}
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">閱讀更多</Button>
            </CardActions>
          </Card>
        ))}
        {filteredArticles.length === 0 && (
          <Typography variant="body1">找不到符合的文章</Typography>
        )}
      </Container>
    </Box>
  );
}
