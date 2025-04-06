"use client";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople"; // Added for greeting icon
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { authServices } from "../firebase/services/auth-service";

const pages = [
  { name: "首頁", path: "/" },
  { name: "企業列表", path: "/CompanyList" },
  { name: "文章發布", path: "/Artical" },
];

const userOptions = [
  { name: "登入", path: "/LoginPage" },
  { name: "企業註冊", path: "/CompanyRegister" },
  { name: "社團註冊", path: "/ClubRegister" },
];

export default function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [greetingIndex, setGreetingIndex] = useState(0);

  // Creative greetings list
  const greetings = [
    "您好，",
    "歡迎回來，",
    "很高興見到您，",
    "哈囉，",
    "今天過得如何，",
    "今天真是美好，",
    "準備好探索了嗎，",
    "嗨！",
  ];

  useEffect(() => {
    // 監聽登入狀態
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
      if (user) {
        // Extract display name or email username part
        const displayName =
          user.displayName || user.email?.split("@")[0] || "夥伴";
        setUserName(displayName);

        // Set random greeting when user logs in
        setGreetingIndex(Math.floor(Math.random() * greetings.length));
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
    handleCloseUserMenu();
  };

  const handleLogout = async () => {
    try {
      await authServices.logout();
      setOpenLogoutDialog(false);
    } catch (error) {
      console.error("登出時發生錯誤:", error);
    }
  };

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop Logo */}
          <Typography
            variant="h6"
            noWrap
            component={Link}
            href="/"
            sx={{
              mr: 2,
              display: { xs: "none", md: "flex" },
              fontWeight: 700,
              letterSpacing: ".1rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            社團企業媒合平台
          </Typography>

          {/* Mobile Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              keepMounted
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: "block", md: "none" },
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={handleCloseNavMenu}
                  component={Link}
                  href={page.path}
                >
                  <Typography textAlign="center">{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <Typography
            variant="h5"
            noWrap
            component={Link}
            href="/"
            sx={{
              mr: 2,
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: ".1rem",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            媒合平台
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                href={page.path}
                onClick={handleCloseNavMenu}
                sx={{ my: 2, color: "white", display: "block" }}
              >
                {page.name}
              </Button>
            ))}
          </Box>

          {/* User Greeting - Only show when logged in */}
          {isLoggedIn && userName && (
            <Tooltip title="這是您的個人識別標誌">
              <Chip
                icon={<EmojiPeopleIcon />}
                label={`${greetings[greetingIndex]}${userName}`}
                variant="outlined"
                sx={{
                  mr: 2,
                  color: "white",
                  borderColor: "rgba(255,255,255,0.5)",
                  "& .MuiChip-icon": { color: "white" },
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    transform: "scale(1.05)",
                  },
                }}
              />
            </Tooltip>
          )}

          {/* User Menu */}
          <Box sx={{ flexGrow: 0 }}>
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{ p: 0 }}
              color="inherit"
            >
              <Avatar
                sx={{ bgcolor: isLoggedIn ? "secondary.main" : "inherit" }}
              >
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
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
              {isLoggedIn ? (
                <MenuItem onClick={handleLogoutClick}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  <Typography textAlign="center">登出</Typography>
                </MenuItem>
              ) : (
                userOptions.map((option) => (
                  <MenuItem
                    key={option.name}
                    onClick={handleCloseUserMenu}
                    component={Link}
                    href={option.path}
                  >
                    <Typography textAlign="center">{option.name}</Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>

      {/* 登出確認對話框 */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
      >
        <DialogTitle id="logout-dialog-title">確認登出</DialogTitle>
        <DialogContent>
          <DialogContentText id="logout-dialog-description">
            您確定要登出嗎？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)}>取消</Button>
          <Button onClick={handleLogout} color="primary" autoFocus>
            確認登出
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}
