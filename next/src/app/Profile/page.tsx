// 导入所需的库
"use client";

import ArticleIcon from "@mui/icons-material/Article";
import EventIcon from "@mui/icons-material/Event";
import HandshakeIcon from "@mui/icons-material/Handshake";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import ActivityFormDialog from "../../components/activities/ActivityFormDialog";
import Navbar from "../../components/Navbar";
import ClubProfileForm from "../../components/profile/ClubProfileForm";
import CompanyProfileForm from "../../components/profile/CompanyProfileForm";
import SideNavbar from "../../components/SideNavbar";
import { db } from "../../firebase/config";
import { authServices } from "../../firebase/services/auth-service";
import { Club, clubServices } from "../../firebase/services/club-service";
import {
  Company,
  companyServices,
} from "../../firebase/services/company-service";

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
  const [searchTerm, setSearchTerm] = useState("0");
  const drawerWidth = 200;
  const [activities, setActivities] = useState<any[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  // Add client-side only rendering state
  const [isMounted, setIsMounted] = useState(false);

  // Set isMounted to true when component mounts on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // When searchTerm changes, update the tab index
  useEffect(() => {
    if (searchTerm) {
      setValue(parseInt(searchTerm));
    }
  }, [searchTerm]);

  // Function to refresh activities after adding a new one
  const refreshActivities = async () => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    setActivitiesLoading(true);
    try {
      const q = query(
        collection(db, "activities"),
        where("uid", "==", currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const activitiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setActivities(activitiesData);
    } catch (err) {
      console.error("Error refreshing activities:", err);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // 獲取用戶活動資訊
  useEffect(() => {
    const fetchUserActivities = async () => {
      if (value !== 3) return; // 只有當選擇了活動資訊標籤時才獲取數據

      const currentUser = authServices.getCurrentUser();
      if (!currentUser) return;

      setActivitiesLoading(true);
      try {
        const q = query(
          collection(db, "activities"),
          where("uid", "==", currentUser.uid)
        );

        const snapshot = await getDocs(q);
        const activitiesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setActivities(activitiesData);
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    };

    fetchUserActivities();
  }, [value]);

  // 當新增活動成功後重新獲取活動列表
  const handleClubProfileUpdate = async (
    updatedData: Partial<Club>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!clubData?.id) throw new Error("無法找到社團資料");
      let logoURL = clubData.logoURL;
      if (logoFile) {
        logoURL = await clubServices.uploadClubLogo(clubData.id, logoFile);
      }
      await clubServices.updateClub(clubData.id, { ...updatedData, logoURL });
      const updatedClub = await clubServices.getClubById(clubData.id);
      if (updatedClub) setClubData(updatedClub);
      setSuccess("社團資料已成功更新");
      setSnackbarOpen(true);
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
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
      if (!companyData?.id) throw new Error("無法找到企業資料");
      let logoURL = companyData.logoURL;
      if (logoFile) {
        logoURL = await companyServices.uploadCompanyLogo(
          companyData.id,
          logoFile
        );
      }
      await companyServices.updateCompany(companyData.id, {
        ...updatedData,
        logoURL,
      });
      const updatedCompany = await companyServices.getCompanyById(
        companyData.id
      );
      if (updatedCompany) setCompanyData(updatedCompany);
      setSuccess("企業資料已成功更新");
      setSnackbarOpen(true);
      contentRef.current?.scrollIntoView({ behavior: "smooth" });
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
            pt: "64px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f2f2f7",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  // Only render complete UI on client-side to prevent hydration errors
  if (!isMounted) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            pt: "64px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "calc(100vh - 64px)",
            backgroundColor: "#f2f2f7",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  // 格式化日期顯示
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "未知日期";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      console.error("Date formatting error:", err);
      return "日期格式錯誤";
    }
  };

  return (
    <>
      <Navbar />
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
                borderRadius: 3,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
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
                  {error || success}
                </Alert>
              </Snackbar>

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

              {[1, 2, 3].map((i) => (
                <TabPanel key={i} value={value} index={i}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      py: 4,
                    }}
                  >
                    {" "}
                    {i === 1 ? (
                      <ArticleIcon
                        sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                      />
                    ) : i === 2 ? (
                      <HandshakeIcon
                        sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                      />
                    ) : (
                      <EventIcon
                        sx={{ fontSize: 80, color: "text.disabled", mb: 2 }}
                      />
                    )}{" "}
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      gutterBottom
                    >
                      {i === 1
                        ? "尚無已發佈文章"
                        : i === 2
                        ? "尚無合作紀錄"
                        : activities.length > 0
                        ? "您的活動資訊"
                        : "尚無活動資訊"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      align="center"
                      sx={{ mb: 2 }}
                    >
                      {i === 1
                        ? "您還沒有發佈任何文章。發佈功能正在開發中，敬請期待！"
                        : i === 2
                        ? "您目前沒有任何合作紀錄。合作紀錄功能正在開發中，敬請期待！"
                        : activities.length > 0
                        ? `您目前有 ${activities.length} 筆活動資訊`
                        : "您目前沒有任何活動資訊。點擊下方按鈕新增活動！"}
                    </Typography>
                    {i === 3 && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setActivityDialogOpen(true)}
                        sx={{ mt: 2 }}
                      >
                        {activities.length > 0 ? "新增更多活動" : "新增活動"}
                      </Button>
                    )}
                  </Box>
                </TabPanel>
              ))}
            </Paper>
          </Container>
        </Box>
      </Box>
      {/* Activity Form Dialog */}
      <ActivityFormDialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        onSuccess={() => {
          setActivityDialogOpen(false);
          refreshActivities();
        }}
      />
    </>
  );
}
