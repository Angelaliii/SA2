/**
 * 用戶資料管理 Hook
 * 這個檔案實現了一個自定義 Hook，用於處理用戶資料的獲取和更新
 */
import { useEffect, useState } from "react";
import { authServices } from "../../../firebase/services/auth-service";
import { Club, clubServices } from "../../../firebase/services/club-service";
import {
  Company,
  companyServices,
} from "../../../firebase/services/company-service";

/**
 * 自定義 Hook - 用於管理用戶個人資料
 * 處理社團或企業用戶的資料獲取和更新
 */
export function useProfileData() {
  // 狀態變數宣告區域
  const [loading, setLoading] = useState(true); // 控制載入狀態
  const [error, setError] = useState<string | null>(null); // 儲存錯誤訊息
  const [success, setSuccess] = useState<string | null>(null); // 儲存成功訊息
  const [clubData, setClubData] = useState<Club | null>(null); // 儲存社團資料
  const [companyData, setCompanyData] = useState<Company | null>(null); // 儲存企業資料
  const [userType, setUserType] = useState<"club" | "company" | "unknown">(
    "unknown"
  ); // 用戶類型：社團、企業或未知
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // 是否已認證

  /**
   * 在元件首次渲染時自動獲取用戶資料
   * 透過空陣列依賴確保只在首次渲染時執行一次
   */
  useEffect(() => {
    fetchUserProfile();
  }, []);

  /**
   * 獲取當前登入用戶的資料
   * 會嘗試查詢用戶是社團還是企業類型
   */
  const fetchUserProfile = async () => {
    // 開始載入，清除先前的錯誤訊息
    setLoading(true);
    setError(null);

    // 獲取當前登入的用戶
    const currentUser = authServices.getCurrentUser();

    // 檢查是否已登入
    if (!currentUser) {
      setError("請先登入系統"); // 設定錯誤訊息
      setLoading(false); // 關閉載入狀態
      return;
    }

    try {
      // 嘗試查詢用戶是否為社團類型
      const allClubs = await clubServices.getAllClubs(); // 獲取所有社團
      // 尋找符合當前用戶 ID 的社團
      const userClub = allClubs.find((club) => club.userId === currentUser.uid);

      // 如果找到匹配的社團資料
      if (userClub) {
        setClubData(userClub); // 設定社團資料
        setUserType("club"); // 設定用戶類型為社團
        setLoading(false); // 關閉載入狀態
        return; // 提前返回，不執行後續代碼
      }

      // 如果不是社團，嘗試查詢用戶是否為企業類型
      const allCompanies = await companyServices.getAllCompanies(); // 獲取所有企業
      // 尋找符合當前用戶 email 的企業
      const userCompany = allCompanies.find(
        (company) => company.email === currentUser.email
      );

      // 如果找到匹配的企業資料
      if (userCompany) {
        setCompanyData(userCompany); // 設定企業資料
        setUserType("company"); // 設定用戶類型為企業
        setLoading(false); // 關閉載入狀態
        return; // 提前返回
      }

      // 如果既不是社團也不是企業，則表示用戶資料不完整
      setError("找不到您的用戶資料，請確認您已完成註冊流程");
      setLoading(false); // 關閉載入狀態
    } catch (err) {
      // 處理可能發生的錯誤
      console.error("Error fetching profile:", err);
      setError("載入用戶資料時發生錯誤，請稍後再試");
      setLoading(false); // 關閉載入狀態
    }
  };

  /**
   * 更新社團資料的函數
   * @param updatedData 要更新的社團資料
   * @param logoFile 可選的新標誌檔案
   * @returns 是否更新成功
   */
  const handleClubProfileUpdate = async (
    updatedData: Partial<Club>,
    logoFile?: File
  ) => {
    // 開始載入，清除先前的訊息
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 檢查是否有社團 ID
      if (!clubData?.id) throw new Error("無法找到社團資料");

      // 註：原本可能有上傳頭像功能，但現已移除
      // 使用社團服務更新資料
      await clubServices.updateClub(clubData.id, updatedData);

      // 重新獲取更新後的社團資料
      const updatedClub = await clubServices.getClubById(clubData.id);
      if (updatedClub) setClubData(updatedClub); // 更新狀態

      // 設定成功訊息
      setSuccess("社團資料已成功更新");
      setLoading(false); // 關閉載入狀態
      return true; // 返回成功
    } catch (err) {
      // 處理錯誤
      console.error("Error updating club profile:", err);
      setError("更新社團資料時發生錯誤，請稍後再試");
      setLoading(false); // 關閉載入狀態
      return false; // 返回失敗
    }
  };

  /**
   * 更新企業資料的函數
   * @param updatedData 要更新的企業資料
   * @param logoFile 可選的新標誌檔案
   * @returns 是否更新成功
   */
  const handleCompanyProfileUpdate = async (
    updatedData: Partial<Company>,
    logoFile?: File
  ) => {
    // 開始載入，清除先前的訊息
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 檢查是否有企業 ID
      if (!companyData?.id) throw new Error("無法找到企業資料");

      // 註：原本可能有上傳頭像功能，但現已移除
      // 使用企業服務更新資料
      await companyServices.updateCompany(companyData.id, updatedData);

      // 重新獲取更新後的企業資料
      const updatedCompany = await companyServices.getCompanyById(
        companyData.id
      );
      if (updatedCompany) setCompanyData(updatedCompany); // 更新狀態

      // 設定成功訊息
      setSuccess("企業資料已成功更新");
      setLoading(false); // 關閉載入狀態
      return true; // 返回成功
    } catch (err) {
      // 處理錯誤
      console.error("Error updating company profile:", err);
      setError("更新企業資料時發生錯誤，請稍後再試");
      setLoading(false); // 關閉載入狀態
      return false; // 返回失敗
    }
  };

  /**
   * 設定用戶認證狀態
   * 如果狀態為已認證，則自動獲取用戶資料
   * @param state 認證狀態 (true=已認證, false=未認證)
   */
  const setAuthState = (state: boolean) => {
    setIsAuthenticated(state); // 更新認證狀態
    if (state) {
      // 如果已認證，則獲取用戶資料
      fetchUserProfile();
    }
  };

  // 返回所有需要在元件中使用的狀態和函數
  return {
    loading, // 載入狀態
    error, // 錯誤訊息
    success, // 成功訊息
    clubData, // 社團資料
    companyData, // 企業資料
    userType, // 用戶類型 (club/company/unknown)
    isAuthenticated, // 認證狀態
    setError, // 設定錯誤訊息的函數
    setSuccess, // 設定成功訊息的函數
    setLoading, // 設定載入狀態的函數
    fetchUserProfile, // 獲取用戶資料的函數
    handleClubProfileUpdate, // 更新社團資料的函數
    handleCompanyProfileUpdate, // 更新企業資料的函數
    setAuthState, // 設定認證狀態的函數
  };
}
