"use client";

import { Box, Button, Container, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../../assets/globals.module.css";
import Login from "../../components/Login";

export default function LoginPageClient() {
  const [mounted, setMounted] = useState(false);

  // Use effect to handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show a simple initial state during server rendering and hydration
  if (!mounted) {
    return (
      <div className={styles.page} suppressHydrationWarning>
        <Container maxWidth="xs" sx={{ px: { xs: 2, sm: 3 } }}>
          <Box sx={{ my: 4, textAlign: "center" }}>
            <Typography variant="h3" gutterBottom>
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
    <div className={styles.page} suppressHydrationWarning>
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
