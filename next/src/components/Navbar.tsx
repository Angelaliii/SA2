import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Link from "next/link";

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo / 標題 */}
        <Typography
          variant="h6"
          component={Link}
          href="/PlatformLanding"
          sx={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
        >
          社團企業媒合平台
        </Typography>

        {/* 導覽連結 */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button color="inherit" component={Link} href="/PlatformLanding">
            主頁
          </Button>
          <Button color="inherit" component={Link} href="/Artical">
            文章發布
          </Button>
          <Button color="inherit" component={Link} href="/CompanyRegister">
            企業註冊
          </Button>
          <Button color="inherit" component={Link} href="/ClubRegister">
            社團註冊
          </Button>
          <Button color="inherit" component={Link} href="/LoginPage">
            登入
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
