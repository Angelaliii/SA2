"use client";

import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import SideNavbar from "../../components/SideNavbar";
import { authServices } from "../../firebase/services/auth-service";
import { ClientOnly } from "../../hooks/useHydration";
import ActivitiesTab from "./components/ActivitiesTab";
import ArticlesListTab from "./components/ArticlesListTab";
import CollaborationTab from "./components/CollaborationTab";
import FavoritesTab from "./components/FavoritesTab";
import ProfileInfoTab from "./components/ProfileInfoTab";
import SubscriptionTab from "./components/SubscriptionTab";
import { TabPanel } from "./components/TabPanel";

export default function Profile() {
  const [value, setValue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>("個人檔案");
  const [searchTerm, setSearchTerm] = useState("0");
  const contentRef = useRef<HTMLDivElement>(null);
  const drawerWidth = 240;

  // 認證監聽器
  useEffect(() => {
    const unsubscribe = authServices.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 當 searchTerm 更改時，更新標籤索引
  useEffect(() => {
    if (searchTerm) {
      setValue(parseInt(searchTerm));
    }
  }, [searchTerm]);

  // 基本載入中的回退組件，與客戶端結構完全匹配
  const LoadingFallback = () => (
    <Box
      sx={{
        display: "flex",
        pt: "64px",
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#f2f2f7",
      }}
    >
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 4 },
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    </Box>
  );

  // 認證檢查期間顯示載入狀態
  if (isAuthenticated === null) {
    return (
      <>
        <Navbar />
        <LoadingFallback />
      </>
    );
  }

  // 未認證時重定向
  if (isAuthenticated === false) {
    return (
      <>
        <Navbar />
        <LoginPrompt />
      </>
    );
  }

  // 主 UI，帶有客戶端反應式組件
  return (
    <>
      <Navbar />
      <ClientOnly fallback={<LoadingFallback />}>
        <Box
          sx={{
            display: "flex",
            pt: "64px",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f2f2f7",
          }}
        >
          <SideNavbar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            drawerWidth={drawerWidth}
          />

          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 4 },
              width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
              ml: { xs: 0, md: `${drawerWidth}px` },
              transition: (theme) =>
                theme.transitions.create(["margin", "width"], {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
            }}
          >
            <Container
              maxWidth={false}
              sx={{
                pb: 5,
                maxWidth: { xs: "100%", lg: "90%", xl: "85%" },
                transition: "max-width 0.3s ease-in-out",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, sm: 3, md: 4 },
                  mb: 4,
                  borderRadius: 3,
                  border: "1px solid rgba(0, 0, 0, 0.05)",
                  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
                }}
              >
                <Box ref={contentRef}>
                  {" "}
                  <Typography
                    variant="h4"
                    component="h1"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: (theme) => theme.palette.primary.main,
                    }}
                  >
                    您的個人檔案
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                </Box>

                {/* 個人資料標籤 */}
                <TabPanel value={value} index={0}>
                  <ProfileInfoTab />
                </TabPanel>

                {/* 文章列表標籤 */}
                <TabPanel value={value} index={1}>
                  <ArticlesListTab />
                </TabPanel>

                {/* 訂閱標籤 */}
                <TabPanel value={value} index={2}>
                  <SubscriptionTab />
                </TabPanel>

                {/* 收藏標籤 */}
                <TabPanel value={value} index={3}>
                  <FavoritesTab />
                </TabPanel>

                {/* 活動標籤 */}
                <TabPanel value={value} index={4}>
                  <ActivitiesTab />
                </TabPanel>

                {/* 合作標籤 */}
                <TabPanel value={value} index={5}>
                  <CollaborationTab />
                </TabPanel>
              </Paper>
            </Container>
          </Box>
        </Box>
      </ClientOnly>

      <Snackbar
        open={snackbarOpen && (!!error || !!success)}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={error ? "error" : "success"}
          sx={{ width: "100%", boxShadow: 3 }}
          onClose={() => setSnackbarOpen(false)}
        >
          {error ?? success}
        </Alert>
      </Snackbar>
    </>
  );
}
