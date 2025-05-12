import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import HomeIcon from "@mui/icons-material/Home";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
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
import { clubServices } from "../firebase/services/club-service";
import { companyServices } from "../firebase/services/company-service";
import { ClientOnly } from "../hooks/useHydration";
import { useNotifications } from "../hooks/useNotifications";

const pages = [
  { name: "首頁", path: "/", icon: <HomeIcon /> },
  { name: "企業牆", path: "/Enterprise/EnterpriseList" },
  { name: "需求牆", path: "/Artical/DemandList" },
  { name: "組織列表", path: "/OrganizationList" },
  { name: "個人資料", path: "/Profile" },
  { name: "活動資訊", path: "/Activities" },
];

const userOptions = [
  { name: "登入", path: "/LoginPage" },
  { name: "企業註冊", path: "/CompanyRegister" },
  { name: "社團註冊", path: "/ClubRegister" },
];

export default function Navbar({
  hasUnread = false, // 保留參數以維持向後兼容
}: Readonly<{ hasUnread?: boolean }>) {
  // 從 useHydration 取得水合狀態，確保只在客戶端渲染後才使用動態數據
  const [isHydrated, setIsHydrated] = useState(false);

  // 初始化通知狀態為 false，確保服務器端和客戶端初始渲染一致
  const [displayUnread, setDisplayUnread] = useState(false);

  // 從通知上下文獲取未讀通知狀態
  const { hasUnreadNotifications } = useNotifications();

  // Initialize all state to consistent values for both server and client
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Initialize to false explicitly
  const [openLogoutDialog, setOpenLogoutDialog] = useState<boolean>(false);
  const [userName, setUserName] = useState<string | null>(null);
  // 使用 userRole 而不是 userType，因為 userType 的值被使用了
  const [userRole, setUserRole] = useState<"club" | "company" | "unknown">(
    "unknown"
  );
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const greeting = "您好，";

  // 使用 useEffect 在客戶端渲染後設置水合狀態
  useEffect(() => {
    if (typeof window !== "undefined") {
      // 使用雙重動畫幀來確保真正在客戶端渲染後
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsHydrated(true);
        });
      });
    }
  }, []);

  // 在客戶端水合後，根據實際通知狀態更新 displayUnread
  useEffect(() => {
    if (isHydrated) {
      setDisplayUnread(hasUnread || hasUnreadNotifications);
    }
  }, [isHydrated, hasUnread, hasUnreadNotifications]);

  // 只在客戶端執行用戶驗證
  useEffect(() => {
    if (!isHydrated) return;

    // Skip the first render to prevent hydration mismatch
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);
      if (user) {
        try {
          // Try to find user in clubs collection first
          const clubData = await clubServices.getClubByUserId(user.uid);
          if (clubData) {
            setUserName(clubData.clubName);
            setUserRole("club");
            return;
          }

          // If not found in clubs, try to find in companies collection
          const companies = await companyServices.getCompaniesByUserId(
            user.uid
          );
          if (companies && companies.length > 0) {
            setUserName(companies[0].companyName);
            setUserRole("company");
            return;
          }

          // If still not found, use default display name
          const displayName =
            user.displayName ?? user.email?.split("@")[0] ?? "夥伴";
          setUserName(displayName);
          setUserRole("unknown");
        } catch (error) {
          console.error("無法獲取組織名稱:", error);
          const displayName =
            user.displayName ?? user.email?.split("@")[0] ?? "夥伴";
          setUserName(displayName);
          setUserRole("unknown");
        }
      } else {
        setUserName(null);
        setUserRole("unknown");
      }
    });

    return () => unsubscribe();
  }, [isHydrated, isInitialized]); // 添加 isHydrated 依賴

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
      await auth.signOut();
      setOpenLogoutDialog(false);
    } catch (error) {
      console.error("登出時發生錯誤:", error);
    }
  };

  return (
    <ClientOnly
      fallback={
        <div
          style={{
            height: "64px",
            backgroundColor: "#1976d2",
            width: "100%",
            position: "fixed",
            top: 0,
            zIndex: 1100,
          }}
        />
      }
    >
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Logo & Menu */}
            <ClientOnly
              fallback={
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
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
              }
            >
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
            </ClientOnly>
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <ClientOnly
                fallback={
                  <IconButton size="large" color="inherit">
                    <MenuIcon />
                  </IconButton>
                }
              >
                <IconButton
                  size="large"
                  onClick={handleOpenNavMenu}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              </ClientOnly>
              <ClientOnly>
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
                    mt: 1,
                  }}
                >
                  {" "}
                  {pages.map((page) => (
                    <MenuItem
                      key={page.name}
                      onClick={handleCloseNavMenu}
                      component={Link}
                      href={page.path}
                    >
                      <Typography textAlign="center" component="span">
                        {" "}
                        {page.name === "通知中心" ? (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Badge
                              color="error"
                              variant="dot"
                              overlap="circular"
                              invisible={!hasUnread} // 使用 props 傳進來的 hasUnread
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
                  ))}{" "}
                  {/* 移動按鈕到對應的頁面 */}
                </Menu>
              </ClientOnly>
            </Box>
            {/* Mobile Title */}
            <ClientOnly
              fallback={
                <Typography
                  variant="h5"
                  noWrap
                  component="div"
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
              }
            >
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
            </ClientOnly>
            {/* Desktop Menu */}
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              <ClientOnly>
                {pages.map((page) => (
                  <Button
                    key={page.name}
                    component={Link}
                    href={page.path}
                    onClick={handleCloseNavMenu}
                    sx={{ color: "white", mx: 0.5, height: 40, minWidth: 40 }}
                  >
                    {page.name}
                  </Button>
                ))}{" "}
                {/* 移動按鈕到對應的頁面 */}
              </ClientOnly>
            </Box>
            {/* User Greeting */}
            <ClientOnly>
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
            </ClientOnly>{" "}
            {/* 通知鈴鐺 */}
            <ClientOnly
              fallback={
                <IconButton sx={{ color: "white", mr: 2 }}>
                  <Badge
                    color="error"
                    variant="dot"
                    overlap="circular"
                    invisible={true} // 服務端始終不顯示紅點
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              }
            >
              {isLoggedIn && (
                <IconButton
                  component={Link}
                  href="/messages"
                  sx={{ color: "white", mr: 2 }}
                >
                  {" "}
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
            </ClientOnly>
            {/* User Avatar Menu */}
            <Box sx={{ flexGrow: 0 }}>
              <ClientOnly
                fallback={
                  <IconButton sx={{ p: 0 }}>
                    <Avatar sx={{ bgcolor: "secondary.main" }}>
                      <AccountCircleIcon />
                    </Avatar>
                  </IconButton>
                }
              >
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: "secondary.main" }}>
                    <AccountCircleIcon />
                  </Avatar>
                </IconButton>
              </ClientOnly>
              <ClientOnly>
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
                        {" "}
                        <Typography textAlign="center" component="span">
                          {(() => {
                            // 使用立即執行函數來處理邏輯判斷
                            if (
                              userRole === "club" &&
                              option.name === "社團註冊"
                            ) {
                              return null;
                            }
                            if (
                              userRole === "company" &&
                              option.name === "企業註冊"
                            ) {
                              return null;
                            }
                            return option.name;
                          })()}
                        </Typography>
                      </MenuItem>
                    ))
                  )}
                </Menu>
              </ClientOnly>
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
        </Dialog>{" "}
      </AppBar>
    </ClientOnly>
  );
}
