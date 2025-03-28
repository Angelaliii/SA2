<<<<<<< HEAD
import { Box, Container, Typography } from "@mui/material";
import styles from "../assets/globals.module.css";
import Login from "../components/Login";

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <Container maxWidth="sm">
        <Box sx={{ my: 4 }}>
          <Typography variant="h3" component="h1" align="center" gutterBottom>
            歡迎回來
          </Typography>
          <Typography color="textSecondary" align="center" paragraph>
            登入以使用所有功能
          </Typography>

          <Login />
        </Box>
      </Container>
    </div>
=======
import { Box, Button, Container } from "@mui/material";
import Link from "next/link";
import LoginComponent from "../components/Login";

export default function LoginPage() {
  return (
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        py: 4,
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <LoginComponent />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          color="primary"
          sx={{ textDecoration: "none" }}
        >
          返回首頁
        </Button>
      </Box>
    </Container>
>>>>>>> c8172a978bdcee4898fcbf8f3ec38260fc4e0878
  );
}
