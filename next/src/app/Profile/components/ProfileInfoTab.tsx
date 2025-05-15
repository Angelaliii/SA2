"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import ClubProfileForm from "../../../components/profile/ClubProfileForm";
import CompanyProfileForm from "../../../components/profile/CompanyProfileForm";
import { useProfileData } from "../hooks/useProfileData";

export default function ProfileInfoTab() {
  const {
    clubData,
    companyData,
    userType,
    handleClubProfileUpdate,
    handleCompanyProfileUpdate,
    loading,
  } = useProfileData();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {userType === "club" && clubData && (
        <ClubProfileForm
          clubData={clubData}
          onSubmit={async (data, file) => {
            await handleClubProfileUpdate(data, file);
          }}
        />
      )}
      {userType === "company" && companyData && (
        <CompanyProfileForm
          companyData={companyData}
          onSubmit={async (data, file) => {
            await handleCompanyProfileUpdate(data, file);
          }}
        />
      )}
      {userType === "unknown" && (
        <Typography>請先完成註冊流程以管理您的個人資料</Typography>
      )}
    </>
  );
}
