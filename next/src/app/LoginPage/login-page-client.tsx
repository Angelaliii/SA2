"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import Link from "next/link";
import styles from "../../assets/globals.module.css";
import Login from "../../components/Login";
import useHydration from "../../hooks/useHydration";

export default function LoginPageClient() {
  // Use our custom hydration hook instead of manual mounting state
  const { hasMounted } = useHydration();

  // Show a simplified view during server rendering to avoid hydration mismatch
  if (!hasMounted) {
    return (
      <div className={styles.page} suppressHydrationWarning>
        <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ my: 4, textAlign: "center" }}>
            <Typography variant="h3" gutterBottom suppressHydrationWarning>
              歡迎回來
            </Typography>
            <Box sx={{ height: "300px" }}></Box>
          </Box>
        </Container>
      </div>
    );
  }

  // Once mounted on client, show the full component
  return (
    <div className={styles.page}>
      <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" align="center" gutterBottom>
            歡迎回來
          </Typography>
          <Typography color="textSecondary" align="center" paragraph>
            登入以使用所有功能
          </Typography>

          <Login />

          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              color="primary"
              sx={{
                textDecoration: "none",
                borderRadius: 1.5,
                px: 3,
              }}
            >
              返回首頁
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
}
