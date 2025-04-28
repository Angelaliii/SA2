"use client";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import HomeIcon from '@mui/icons-material/Home';
import {
  AppBar,
  Avatar,
  Badge,
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
import { clubServices } from "../firebase/services/club-service";
import { companyServices } from "../firebase/services/company-service";

const pages = [
  { name: "首頁", path: "/", icon: <HomeIcon /> },
  { name: "發布企業公告", path: "/Enterprise" },
  { name: "企業牆", path: "/Enterprise/EnterpriseList" },
  { name: "企業列表", path: "/CompanyList" },
  { name: "發布需求", path: "/Artical" },
  { name: "需求牆", path: "/Artical/DemandList" },
  { name: "個人資料", path: "/Profile" },
  { name: "活動資訊", path: "/Activities" },
  { name: "通知中心", path: "/messages" },
];

const userOptions = [
  { name: "登入", path: "/LoginPage" },
  { name: "企業註冊", path: "/CompanyRegister" },
  { name: "社團註冊", path: "/ClubRegister" },
];

export default function Navbar({ hasUnread = false }: { hasUnread?: boolean }) {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("您好，");

  useEffect(() => {
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

    if (typeof window !== "undefined") {
      const randomIndex = Math.floor(Math.random() * greetings.length);
      setGreeting(greetings[randomIndex]);
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        try {
          const clubs = await clubServices.getAllClubs();
          const userClub = clubs.find((club) => club.userId === user.uid);

          if (userClub) {
            setUserName(userClub.clubName);
            return;
          }

          const companies = await companyServices.getAllCompanies();
          const userCompany = companies.find(
            (company) => company.id === user.uid
          );

          if (userCompany) {
            setUserName(userCompany.companyName);
            return;
          }

          const displayName =
            user.displayName ?? user.email?.split("@")[0] ?? "夥伴";
          setUserName(displayName);
        } catch (error) {
          console.error("無法獲取組織名稱:", error);
          const displayName =
            user.displayName ?? user.email?.split("@")[0] ?? "夥伴";
          setUserName(displayName);
        }
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElNav(event.currentTarget);
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) =>
    setAnchorElUser(event.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);
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
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo & Menu */}
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

          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
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
                mt: 1, // 添加下拉菜單的頂部邊距
              }}
            >
              {pages.map((page) => (
                <MenuItem
                  key={page.name}
                  onClick={handleCloseNavMenu}
                  component={Link}
                  href={page.path}
                >
                  <Typography textAlign="center" component="span">
                    {page.name === "通知中心" ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Badge
                          color="error"
                          variant="dot"
                          overlap="circular"
                          invisible={!hasUnread}
                        >
                          <NotificationsIcon sx={{ mr: 1 }} />
                        </Badge>
                        {page.name}
                      </Box>
                    ) : (
                      page.name
                    )}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile Title */}
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

          {/* Desktop Menu */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                component={Link}
                href={page.path}
                onClick={handleCloseNavMenu}
                sx={{ color: "white", mx: 0.5, height: 40, minWidth: 40 }}
              >
                {page.name === "通知中心" ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Badge
                      color="error"
                      variant="dot"
                      overlap="circular"
                      invisible={!hasUnread}
                    >
                      <NotificationsIcon />
                    </Badge>
                  </Box>
                ) : page.name === "首頁" ? (
                  <HomeIcon />
                ) : (
                  page.name
                )}
              </Button>
            ))}
          </Box>

          {/* User Greeting */}
          {isLoggedIn && userName && (
            <Tooltip title="這是您的個人識別標誌">
              <Chip
                icon={<EmojiPeopleIcon />}
                label={`${greeting}${userName}`}
                variant="outlined"
                sx={{
                  mr: 2,
                  color: "white",
                  borderColor: "rgba(255,255,255,0.5)",
                  "& .MuiChip-icon": { color: "white" },
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                    transform: "scale(1.05)",
                  },
                }}
              />
            </Tooltip>
          )}

          {/* 通知鈴鐺 */}
          {isLoggedIn && (
            <IconButton
              component={Link}
              href="/messages"
              sx={{ color: "white", mr: 2 }}
            >
              <Badge
                color="error"
                variant="dot"
                overlap="circular"
                invisible={!hasUnread}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          )}

          {/* User Avatar Menu */}
          <Box sx={{ flexGrow: 0 }}>
            <IconButton
              onClick={handleOpenUserMenu}
              sx={{ p: 0 }}
            >
              <Avatar
                sx={{ bgcolor: isLoggedIn ? "secondary.main" : "inherit" }}
              >
                <AccountCircleIcon />
              </Avatar>
            </IconButton>

            <Menu
              sx={{ mt: "45px" }}
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {isLoggedIn ? (
                <MenuItem onClick={handleLogoutClick}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  <Typography textAlign="center" component="span">
                    登出
                  </Typography>
                </MenuItem>
              ) : (
                userOptions.map((option) => (
                  <MenuItem
                    key={option.name}
                    onClick={handleCloseUserMenu}
                    component={Link}
                    href={option.path}
                  >
                    <Typography textAlign="center" component="span">
                      {option.name}
                    </Typography>
                  </MenuItem>
                ))
              )}
            </Menu>
          </Box>
        </Toolbar>
      </Container>

      {/* Logout Confirmation */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
      >
        <DialogTitle>確認登出</DialogTitle>
        <DialogContent>
          <DialogContentText>您確定要登出嗎？</DialogContentText>
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
