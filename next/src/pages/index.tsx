import { Box, Button, Container, Paper, Typography } from "@mui/material";
import Link from "next/link";

export default function Home() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
          }}
        >
          <Typography variant="h3" component="h1" align="center" gutterBottom>
            社團企業媒合平台
          </Typography>

          <Typography
            variant="h5"
            component="h2"
            align="center"
            color="text.secondary"
            gutterBottom
          >
            歡迎使用我們的平台
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "center",
              mt: 3,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/LoginPage"
              size="large"
            >
              帳號登入
            </Button>

            <Button
              variant="contained"
              color="secondary"
              component={Link}
              href="/CompanyRegister"
              size="large"
            >
              企業註冊
            </Button>

            <Button
              variant="contained"
              color="secondary"
              component={Link}
              href="/PlatformLanding"
              size="large"
            >
              主頁
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
