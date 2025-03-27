import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { authServices } from "../firebase/services";

// 導航項目
const pages = [
  { name: "首頁", href: "/" },
  { name: "合作專案", href: "/projects" },
  { name: "企業列表", href: "/CompanyList" },
  { name: "社團列表", href: "/clubs" },
  { name: "媒合機會", href: "/opportunities" },
];

// 用戶選單項目
const userMenuItems = [
  { name: "個人資料", href: "/profile" },
  { name: "我的專案", href: "/my-projects" },
  { name: "訊息中心", href: "/messages" },
  { name: "設定", href: "/settings" },
];

export default function Navbar() {
  const router = useRouter();

  // 狀態管理
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 獲取當前用戶資訊
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authServices.getCurrentUserWithRole();
        if (result.success) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("獲取用戶資訊失敗", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 處理用戶選單開啟
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  // 處理用戶選單關閉
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // 處理手機導航抽屜開關
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 處理登出
  const handleLogout = async () => {
    try {
      await authServices.logout();
      setUser(null);
      handleCloseUserMenu();
      router.push("/");
    } catch (error) {
      console.error("登出失敗", error);
      alert("登出失敗，請稍後再試");
    }
  };

  // 手機版導航抽屜內容
  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: "center" }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        校企媒合平台
      </Typography>
      <Divider />
      <List>
        {pages.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton
              sx={{ textAlign: "center" }}
              component={Link}
              href={item.href}
            >
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static">
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* 桌面版 Logo */}
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href="/"
              sx={{
                mr: 2,
                display: { xs: "none", md: "flex" },
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              校企媒合平台
            </Typography>

            {/* 手機版 Menu 按鈕 */}
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="展開選單"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleDrawerToggle}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
            </Box>

            {/* 手機版 Logo */}
            <Typography
              variant="h6"
              noWrap
              component={Link}
              href="/"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              校企媒合
            </Typography>

            {/* 桌面版導覽連結 */}
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {pages.map((page) => (
                <Button
                  key={page.name}
                  component={Link}
                  href={page.href}
                  sx={{
                    my: 2,
                    color: "white",
                    display: "block",
                    borderBottom:
                      router.pathname === page.href
                        ? "2px solid white"
                        : "none",
                  }}
                >
                  {page.name}
                </Button>
              ))}
            </Box>

            {/* 用戶區域 */}
            {!loading && (
              <Box sx={{ flexGrow: 0 }}>
                {user ? (
                  <>
                    <Tooltip title="開啟設定">
                      <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <Avatar
                          alt={user.displayName}
                          src={user.photoURL || ""}
                        >
                          {user.displayName?.charAt(0) || user.email?.charAt(0)}
                        </Avatar>
                      </IconButton>
                    </Tooltip>
                    <Menu
                      sx={{ mt: "45px" }}
                      id="menu-appbar"
                      anchorEl={anchorElUser}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      {userMenuItems.map((item) => (
                        <MenuItem
                          key={item.name}
                          onClick={handleCloseUserMenu}
                          component={Link}
                          href={item.href}
                        >
                          <Typography textAlign="center">
                            {item.name}
                          </Typography>
                        </MenuItem>
                      ))}
                      <Divider />
                      <MenuItem onClick={handleLogout}>
                        <Typography textAlign="center">登出</Typography>
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      component={Link}
                      href="/LoginPage"
                    >
                      登入
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      component={Link}
                      href="/register"
                    >
                      註冊
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* 手機版導航抽屜 */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // 更好的手機效能
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
}
