// firebase/services/user-service.ts
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config";
import { clubServices } from "./club-service";
import { companyServices } from "./company-service";

// 根據 uid 查找用戶資料（club 或 company）
export async function getUserById(uid: string) {
  try {
    console.log("getUserById 被調用，uid:", uid);

    if (!uid) {
      console.error("getUserById 收到無效的 uid");
      return null;
    }

    // 先嘗試直接用 ID 從 clubs 集合中獲取
    try {
      const clubData = await clubServices.getClubById(uid);
      if (clubData) {
        console.log("在 clubs 集合中找到資料:", clubData.clubName);
        return { ...clubData, type: "club" };
      }
    } catch (clubError) {
      console.error("嘗試從 clubs 集合獲取時出錯:", clubError);
    }

    // 再嘗試直接用 ID 從 companies 集合中獲取
    try {
      const companyData = await companyServices.getCompanyById(uid);
      if (companyData) {
        console.log("在 companies 集合中找到資料:", companyData.companyName);
        return { ...companyData, type: "company" };
      }
    } catch (companyError) {
      console.error("嘗試從 companies 集合獲取時出錯:", companyError);
    }

    // 如果以上都沒有找到，再嘗試通過 userId 進行查詢
    try {
      console.log("嘗試通過 userId 查詢 clubs 集合");
      const clubsQuery = query(
        collection(db, "clubs"),
        where("userId", "==", uid)
      );
      const clubsSnapshot = await getDocs(clubsQuery);
      if (!clubsSnapshot.empty) {
        const clubDoc = clubsSnapshot.docs[0];
        const clubData = clubDoc.data();
        console.log("通過 userId 在 clubs 集合中找到資料:", clubData.clubName);
        return { ...clubData, id: clubDoc.id, type: "club" };
      }
    } catch (clubsQueryError) {
      console.error("通過 userId 查詢 clubs 集合時出錯:", clubsQueryError);
    }

    // 再查 company
    try {
      console.log("嘗試通過 userId 查詢 companies 集合");
      const companiesQuery = query(
        collection(db, "companies"),
        where("userId", "==", uid)
      );
      const companiesSnapshot = await getDocs(companiesQuery);
      if (!companiesSnapshot.empty) {
        const companyDoc = companiesSnapshot.docs[0];
        const companyData = companyDoc.data();
        console.log(
          "通過 userId 在 companies 集合中找到資料:",
          companyData.companyName
        );
        return { ...companyData, id: companyDoc.id, type: "company" };
      }
    } catch (companiesQueryError) {
      console.error(
        "通過 userId 查詢 companies 集合時出錯:",
        companiesQueryError
      );
    }

    // 查無資料
    console.log("未找到任何匹配的組織資料");
    return null;
  } catch (error) {
    console.error("獲取用戶資料時出錯:", error);
    return null;
  }
}
