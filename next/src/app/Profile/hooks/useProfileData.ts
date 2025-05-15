"use client";

import { useState } from "react";
import { authServices } from "../../../firebase/services/auth-service";
import { Club, clubServices } from "../../../firebase/services/club-service";
import {
  Company,
  companyServices,
} from "../../../firebase/services/company-service";

export function useProfileData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clubData, setClubData] = useState<Club | null>(null);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [userType, setUserType] = useState<"club" | "company" | "unknown">(
    "unknown"
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // 獲取用戶資料
  const fetchUserProfile = async () => {
    setLoading(true);
    setError(null);

    const currentUser = authServices.getCurrentUser();

    if (!currentUser) {
      setError("請先登入系統");
      setLoading(false);
      return;
    }

    try {
      const allClubs = await clubServices.getAllClubs();
      const userClub = allClubs.find((club) => club.userId === currentUser.uid);
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

  // 處理社團資料更新
  const handleClubProfileUpdate = async (
    updatedData: Partial<Club>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!clubData?.id) throw new Error("無法找到社團資料");
      // 移除上傳頭像的功能
      await clubServices.updateClub(clubData.id, updatedData);
      const updatedClub = await clubServices.getClubById(clubData.id);
      if (updatedClub) setClubData(updatedClub);
      setSuccess("社團資料已成功更新");
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error updating club profile:", err);
      setError("更新社團資料時發生錯誤，請稍後再試");
      setLoading(false);
      return false;
    }
  };

  // 處理企業資料更新
  const handleCompanyProfileUpdate = async (
    updatedData: Partial<Company>,
    logoFile?: File
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!companyData?.id) throw new Error("無法找到企業資料");
      // 移除上傳頭像的功能
      await companyServices.updateCompany(companyData.id, updatedData);
      const updatedCompany = await companyServices.getCompanyById(
        companyData.id
      );
      if (updatedCompany) setCompanyData(updatedCompany);
      setSuccess("企業資料已成功更新");
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error updating company profile:", err);
      setError("更新企業資料時發生錯誤，請稍後再試");
      setLoading(false);
      return false;
    }
  };

  // 設定認證狀態
  const setAuthState = (state: boolean) => {
    setIsAuthenticated(state);
    if (state) {
      fetchUserProfile();
    }
  };

  return {
    loading,
    error,
    success,
    clubData,
    companyData,
    userType,
    isAuthenticated,
    setError,
    setSuccess,
    setLoading,
    fetchUserProfile,
    handleClubProfileUpdate,
    handleCompanyProfileUpdate,
    setAuthState,
  };
}
