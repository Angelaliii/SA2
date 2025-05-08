// firebase/services/user-service.ts
import { doc, getDoc, getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../config";

// 根據 uid 查找用戶資料（club 或 company）
export async function getUserById(uid: string) {
  // 先查 club
  const clubsQuery = query(collection(db, "clubs"), where("userId", "==", uid));
  const clubsSnapshot = await getDocs(clubsQuery);
  if (!clubsSnapshot.empty) {
    const clubDoc = clubsSnapshot.docs[0];
    return { ...clubDoc.data(), type: "club" };
  }

  // 再查 company
  const companiesQuery = query(collection(db, "companies"), where("userId", "==", uid));
  const companiesSnapshot = await getDocs(companiesQuery);
  if (!companiesSnapshot.empty) {
    const companyDoc = companiesSnapshot.docs[0];
    return { ...companyDoc.data(), type: "company" };
  }

  // 查無資料
  return null;
}

