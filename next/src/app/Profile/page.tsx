"use client";

import ArticleIcon from "@mui/icons-material/Article";
import EventIcon from "@mui/icons-material/Event";
import HandshakeIcon from "@mui/icons-material/Handshake";
import BookmarksIcon from '@mui/icons-material/Bookmarks';
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
import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import ClubProfileForm from "../../components/profile/ClubProfileForm";
import CompanyProfileForm from "../../components/profile/CompanyProfileForm";
import SideNavbar from "../../components/SideNavbar";
import { authServices } from "../../firebase/services/auth-service";
import { Club, clubServices } from "../../firebase/services/club-service";
import {
  Company,
  companyServices,
} from "../../firebase/services/company-service";

// Tab panel component for content display
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [clubData, setClubData] = useState<Club | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [userType, setUserType] = useState<"club" | "company" | "unknown">(
    "unknown"
  );
  const [selectedTag, setSelectedTag] = useState<string | null>("個人檔案");
  const [searchTerm, setSearchTerm] = useState("0"); // 將 searchTerm 用作頁籤索引
  const drawerWidth = 200; // 側邊欄寬度設定為200px

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentUser = authServices.getCurrentUser();
        if (!currentUser) {
          setError("請先登入系統");
          setLoading(false);
          return;
        }

        // Try to fetch club data
        const allClubs = await clubServices.getAllClubs();
        const userClub = allClubs.find(
          (club) => club.userId === currentUser.uid
        );

        if (userClub) {
          setClubData(userClub);
          setUserType("club");
          setLoading(false);
          return;
        }

        // If no club data, try to fetch company data
        const allCompanies = await companyServices.getAllCompanies();
        const userCompany = allCompanies.find(
          (company) => company.email === currentUser.email
        );

        if (userCompany) {
          setCompanyData(userCompany);
          setUserType("company");
          setLoading(false);
          return;
        }

        setError("找不到您的用戶資料，請確認您已完成註冊流程");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("載入用戶資料時發生錯誤，請稍後再試");
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // 監聽 searchTerm 變化，更新選項卡索引
  useEffect(() => {
    if (searchTerm) {
      setValue(parseInt(searchTerm));
    }
  }, [searchTerm]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleClubProfileUpdate = async (
    updatedData: Partial<Club>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!clubData?.id) {
        throw new Error("無法找到社團資料");
      }

      let logoURL = clubData.logoURL;

      // Upload new logo if provided
      if (logoFile) {
        logoURL = await clubServices.uploadClubLogo(clubData.id, logoFile);
      }

      // Update club information
      await clubServices.updateClub(clubData.id, {
        ...updatedData,
        logoURL,
      });

      // Refresh club data
      const updatedClub = await clubServices.getClubById(clubData.id);
      if (updatedClub) {
        setClubData(updatedClub);
      }

      setSuccess("社團資料已成功更新");
      setSnackbarOpen(true);
      // Scroll to top of the content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error updating club profile:", err);
      setError("更新社團資料時發生錯誤，請稍後再試");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyProfileUpdate = async (
    updatedData: Partial<Company>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!companyData?.id) {
        throw new Error("無法找到企業資料");
      }

      let logoURL = companyData.logoURL;

      // Upload new logo if provided
      if (logoFile) {
        logoURL = await companyServices.uploadCompanyLogo(
          companyData.id,
          logoFile
        );
      }

      // Update company information
      await companyServices.updateCompany(companyData.id, {
        ...updatedData,
        logoURL,
      });

      // Refresh company data
      const updatedCompany = await companyServices.getCompanyById(
        companyData.id
      );
      if (updatedCompany) {
        setCompanyData(updatedCompany);
      }

      setSuccess("企業資料已成功更新");
      setSnackbarOpen(true);
      // Scroll to top of the content
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      console.error("Error updating company profile:", err);
      setError("更新企業資料時發生錯誤，請稍後再試");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            pt: "64px", // 為頂部導航條留出空間
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      {/* 頂部導航列 */}
      <Navbar />

      {/* 主要布局 */}
      <Box
        sx={{
          display: "flex",
          pt: "64px", // 為頂部導航條留出空間
          minHeight: "calc(100vh - 64px)",
          backgroundColor: (theme) => theme.palette.grey[50], // 淺灰色背景增加層次感
        }}
      >
        {/* 側邊導航 */}
        <SideNavbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          drawerWidth={drawerWidth}
        />

        {/* 主要內容區域 */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 4 }, // 響應式內邊距
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
          }}
        >
          <Container maxWidth="md" sx={{ pb: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                mb: 4,
                borderRadius: 2,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
              }}
            >
              <Box ref={contentRef}>
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
                  用戶中心
                </Typography>

                <Divider sx={{ my: 2 }} />
              </Box>

              {/* Replaced Alert with Snackbar for better UX */}
              <Snackbar
                open={snackbarOpen && (!!error || !!success)}
                autoHideDuration={5000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity={error ? "error" : "success"}
                  sx={{
                    width: "100%",
                    boxShadow: 3,
                    "& .MuiAlert-icon": { alignItems: "center" },
                  }}
                  onClose={() => setSnackbarOpen(false)}
                >
                  {error || success}
                </Alert>
              </Snackbar>

              {/* 內容區域 - 根據側邊欄選擇顯示不同內容 */}

              <TabPanel value={value} index={0}>
                {userType === "club" && clubData && (
                  <ClubProfileForm
                    clubData={clubData}
                    onSubmit={handleClubProfileUpdate}
                  />
                )}

                {userType === "company" && companyData && (
                  <CompanyProfileForm
                    companyData={companyData}
                    onSubmit={handleCompanyProfileUpdate}
                  />
                )}

                {userType === "unknown" && (
                  <Typography>請先完成註冊流程以管理您的個人資料</Typography>
                )}
              </TabPanel>

              <TabPanel value={value} index={1}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <ArticleIcon
                    sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    尚無已發佈文章
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    您還沒有發佈任何文章。發佈功能正在開發中，敬請期待！
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={value} index={2}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <HandshakeIcon
                    sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    尚無合作紀錄
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    您目前沒有任何合作紀錄。合作紀錄功能正在開發中，敬請期待！
                  </Typography>
                </Box>
              </TabPanel>

              <TabPanel value={value} index={3}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <EventIcon
                    sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    尚無活動資訊
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    您目前沒有任何活動資訊。活動資訊功能正在開發中，敬請期待！
                  </Typography>
                </Box>
              </TabPanel>
              <TabPanel value={value} index={4}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 4,
                  }}
                >
                  <BookmarksIcon
                    sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    尚無收藏
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                  >
                    您目前沒有任何收藏。多多去需求牆瀏覽吧!
                  </Typography>
                </Box>
              </TabPanel>
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
}
