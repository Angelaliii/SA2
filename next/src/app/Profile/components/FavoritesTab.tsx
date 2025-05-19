"use client";

import FavoriteIcon from "@mui/icons-material/Favorite";
import { Box, Typography } from "@mui/material";
import FavoriteArticlesManager from "../../../components/article/FavoriteArticlesManager";

export default function FavoritesTab() {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <FavoriteIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          收藏的文章
        </Typography>
      </Box>
      <FavoriteArticlesManager />
    </>
  );
}
