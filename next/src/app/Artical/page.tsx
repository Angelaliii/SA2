"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

import AssignmentIcon from "@mui/icons-material/Assignment";
import InfoIcon from "@mui/icons-material/Info";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import DeleteDraftDialog from "../../components/article/DeleteDraftDialog";
import DemandDraftManager from "../../components/article/DemandDraftManager";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth } from "../../firebase/config";
import * as postService from "../../firebase/services/post-service";
import { ClientOnly } from "../../hooks/useHydration";

type FormErrorState = {
  title: boolean;
  selectedDemands: boolean;
  eventDate: boolean;
  cooperationReturn: boolean;
  organizationName: boolean;
  email: boolean;
  contactPerson: boolean;
  contactPhone: boolean;
  contactEmail: boolean;
  eventName: boolean;
  eventType: boolean;
  location: boolean;
  estimatedParticipants: boolean;
  participationType: boolean;
  promotionTopic: boolean;
  promotionTarget: boolean;
  promotionForm: boolean;
  schoolName: boolean;
  purposeType: boolean;
  eventEndDate: boolean;
  eventDescription: boolean;
  demandDescription: boolean;
  customItems: boolean;
};

interface DemandPostData {
  id?: string;
  title: string;
  organizationName: string;
  selectedDemands: string[];
  demandDescription?: string;
  cooperationReturn?: string;
  estimatedParticipants?: string;
  eventDate: string;
  eventName: string;
  eventType: string;
  content: string;
  location: string;
  postType: string;
  tags: string[];
  authorId: string;
  isDraft: boolean;
  email?: string;
  purposeType: string;
  participationType: string;
  customItems: string[];
  eventEndDate: string;
  eventDescription: string;
}

export default function DemandPostPage() {
  // 基本表單狀態
  const [title, setTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [demandItems, setDemandItems] = useState<string[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [demandDescription, setDemandDescription] = useState("");
  const [cooperationReturn, setCooperationReturn] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const eventTypes = ["講座", "工作坊", "表演", "比賽", "展覽", "營隊", "其他"];
  const participationOptions1 = [
    "物資捐贈",
    "金錢贊助",
    "人力支援（志工）",
    "媒體曝光",
    "合作活動",
    "企業到校演講",
  ];
  const participationOptions2 = [
    "教材贊助（書籍、講義、教具...）",
    "講師資源（派遣或補助講師...）",
    "場地提供",
    "物資捐贈（文具、學習用品...）",
    "金錢贊助",
  ];

  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [promotionTopic, setPromotionTopic] = useState("");
  const [promotionTarget, setPromotionTarget] = useState("");
  const [promotionForm, setPromotionForm] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [customItemInput, setCustomItemInput] = useState("");
  const [customItems, setCustomItems] = useState<string[]>([]);

  const finalEventDescription = eventDescription || "未填寫";
  const cleanedCustomItems = customItems.filter((item) => item.trim() !== "");
  const finalCustomItems =
    cleanedCustomItems.length > 0 ? cleanedCustomItems : ["未填寫"];
  const finalEventEndDate = eventEndDate || "未填寫";

  const router = useRouter();
  const [purposeOptions] = useState([
    "活動支援",
    "教育推廣",
    "社區服務",
    "校園宣傳",
  ]);

  // ✅ 表單錯誤狀態
  const [errors, setErrors] = useState<FormErrorState>({
    title: false,
    selectedDemands: false,
    eventDate: false,
    cooperationReturn: false,
    organizationName: false,
    email: false,
    contactPerson: false,
    contactPhone: false,
    contactEmail: false,
    eventName: false,
    eventType: false,
    location: false,
    estimatedParticipants: false,
    participationType: false,
    promotionTopic: false,
    promotionTarget: false,
    promotionForm: false,
    schoolName: false,
    purposeType: false,
    eventEndDate: false,
    eventDescription: false,
    demandDescription: false,
    customItems: false,
  });

  // 🔽 驗證邏輯擴充
  // ✅ 修正版 validateForm，根據 purposeType 判斷必填欄位
  const validateForm = () => {
    // 初始化所有錯誤為 false
    const newErrors: FormErrorState = {
      title: false,
      selectedDemands: false,
      eventDate: false,
      cooperationReturn: false,
      organizationName: false,
      email: false,
      contactPerson: false,
      contactPhone: false,
      contactEmail: false,
      eventName: false,
      eventType: false,
      location: false,
      estimatedParticipants: false,
      participationType: false,
      promotionTopic: false,
      promotionTarget: false,
      promotionForm: false,
      schoolName: false,
      purposeType: !purposeType.trim(),
      eventDescription: false,
      demandDescription: false,
      customItems: customItems.length === 0,
      eventEndDate: eventEndDate.trim() === "",
    };

    // 共用欄位驗證
    newErrors.title = !title.trim();
    newErrors.organizationName = !organizationName.trim();
    newErrors.email = !email.trim();
    newErrors.contactPerson = !contactPerson.trim();
    newErrors.contactPhone = !/^[0-9]+$/.test(contactPhone);
    newErrors.contactEmail = !contactEmail.trim();

    // 根據不同目的驗證欄位
    if (purposeType === "活動支援") {
      newErrors.eventName = !eventName.trim();
      newErrors.eventType = !eventType.trim();
      newErrors.estimatedParticipants = !estimatedParticipants.trim();
      newErrors.location = !location.trim();
      newErrors.eventDate = !eventDate;
      newErrors.eventEndDate = !eventEndDate;
      newErrors.participationType = !participationType.trim();
      newErrors.cooperationReturn = !cooperationReturn;
    }

    if (purposeType === "教育推廣") {
      newErrors.eventName = !eventName.trim();
      newErrors.estimatedParticipants = !estimatedParticipants.trim();
      newErrors.location = !location.trim();
      newErrors.eventDate = !eventDate;
      newErrors.eventEndDate = !eventEndDate;
      newErrors.participationType = !participationType.trim();
      newErrors.eventDescription = !eventDescription.trim();
      newErrors.demandDescription = !demandDescription.trim();
      newErrors.cooperationReturn = !cooperationReturn;
    }

    if (purposeType === "社區服務") {
      newErrors.eventName = !eventName.trim();
      newErrors.eventType = !eventType.trim();
      newErrors.estimatedParticipants = !estimatedParticipants.trim();
      newErrors.location = !location.trim();
      newErrors.eventDate = !eventDate;
      newErrors.eventEndDate = !eventEndDate;
      newErrors.participationType = !participationType.trim();
      newErrors.eventDescription = !eventDescription.trim();
      newErrors.demandDescription = !demandDescription.trim();
      newErrors.cooperationReturn = !cooperationReturn;
    }

    if (purposeType === "校園宣傳") {
      newErrors.promotionTopic = !promotionTopic.trim();
      newErrors.promotionTarget = !promotionTarget.trim();
      newErrors.promotionForm = !promotionForm.trim();
      newErrors.schoolName = !location.trim();
      newErrors.estimatedParticipants = !estimatedParticipants.trim();
      newErrors.eventDate = !eventDate;
      newErrors.eventEndDate = !eventEndDate;
      newErrors.participationType = !participationType.trim();
      newErrors.demandDescription = !demandDescription.trim();
      newErrors.cooperationReturn = !cooperationReturn;
    }

    // 檢查贊助截止日不可晚於活動開始日
    if (cooperationReturn && eventDate) {
      const deadline = new Date(cooperationReturn);
      const event = new Date(eventDate);
      if (deadline > event) newErrors.cooperationReturn = true;
    }

    const isValid = !Object.values(newErrors).some(Boolean);
    setErrors(newErrors);
    return { isValid, newErrors };
  };

  // 表單區塊參考
  const titleRef = React.useRef<HTMLDivElement>(null);
  const demandsRef = React.useRef<HTMLDivElement>(null);
  const eventDateRef = React.useRef<HTMLDivElement>(null);

  const [purposeType, setPurposeType] = useState("");
  const [participationType, setParticipationType] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 草稿相關狀態
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // UI狀態
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  useEffect(() => {
    if (eventDate && !cooperationReturn) {
      const event = new Date(eventDate);
      const autoDeadline = new Date(event);
      autoDeadline.setDate(autoDeadline.getDate() - 3);

      setCooperationReturn(autoDeadline.toISOString().split("T")[0]);
    }
  }, [eventDate]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);

        const organization = await postService.getOrganizationName(user.uid);
        setOrganizationName(organization ?? "未知組織");
        setEmail(user.email ?? "");

        const defaultItems = ["零食", "飲料", "生活用品", "戶外用品", "其他"];
        try {
          const items = await postService.getDemandItems();
          setDemandItems(items.length ? items : defaultItems);
        } catch {
          console.error("無法載入需求物資，使用預設值");
          setDemandItems(defaultItems);
        }
      } else {
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoggedIn === false) {
    return (
      <>
        <Navbar />
        <LoginPrompt />
      </>
    );
  }

  if (isLoggedIn === null) return null;
  const clearForm = () => {
    setTitle("");
    setSelectedDemands([]);
    setDemandDescription("");
    setCooperationReturn("");
    setEstimatedParticipants("");
    setEventDate("");
    setEventDescription("");
    setEventName("");
    setEventType("");
    setCurrentDraftId(null);
  };

  // 加載草稿列表
  const loadDrafts = async () => {
    setLoadingDrafts(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入以查看草稿");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoadingDrafts(false);
        return;
      }

      // 從資料庫獲取使用者的需求草稿
      const userDrafts = await postService.getUserDrafts(currentUser.uid);
      setDrafts(userDrafts);
      setOpenDraftsDialog(true);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // 加載特定草稿
  const loadDraft = async (draftId: string) => {
    try {
      const draft = await postService.getPostById(draftId);
      if (!draft) throw new Error("找不到指定草稿");

      setTitle(draft.title || "");
      setCurrentDraftId(draftId);

      setSelectedDemands(draft.selectedDemands || []);
      setDemandDescription(draft.demandDescription || "未填寫");
      setCooperationReturn(draft.cooperationReturn || "未填寫");
      setEstimatedParticipants(draft.estimatedParticipants || "未填寫");
      setEventDate(draft.eventDate || "未填寫");
      setEventDescription(draft.eventDescription || "未填寫");
      setEventName(draft.eventName || "未填寫");
      setEventType(draft.eventType || "未填寫");
      // 使用eventDate而不是不存在的eventEndDate
      setEventEndDate(draft.eventDate || "未填寫");

      // 確保demandDescription使用而不是customItems
      setCustomItems(["未填寫"]);

      setSnackbarMessage("草稿已載入");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDraftsDialog(false);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 確認刪除草稿
  const confirmDeleteDraft = (draftId: string) => {
    setDraftToDelete(draftId);
    setOpenDeleteDialog(true);
  };

  // 刪除草稿
  const deleteDraft = async () => {
    if (!draftToDelete) return;

    try {
      // 從資料庫刪除草稿
      await postService.deletePost(draftToDelete);

      // 更新本地草稿列表
      setDrafts(drafts.filter((draft) => draft.id !== draftToDelete));

      // 如果刪除的是當前正在編輯的草稿，則重置表單
      if (currentDraftId === draftToDelete) {
        clearForm();
      }

      // 更新UI通知
      setSnackbarMessage("草稿已刪除");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDeleteDialog(false);
      setDraftToDelete(null);
    } catch (error) {
      console.error("刪除草稿時出錯:", error);
      setSnackbarMessage("無法刪除草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleSubmit = async () => {
    // 驗證表單
    const { isValid, newErrors } = validateForm();

    // If form is invalid, update error states and scroll to the first error
    if (!isValid) {
      setErrors(newErrors);
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);

      // Scroll to first error field
      if (newErrors.title && titleRef.current) {
        titleRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      } else if (newErrors.selectedDemands && demandsRef.current) {
        demandsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      } else if (newErrors.eventDate && eventDateRef.current) {
        eventDateRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      return;
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("尚未登入");

      const postData: DemandPostData = {
        title,
        organizationName,
        selectedDemands,
        demandDescription,
        cooperationReturn,
        estimatedParticipants,
        eventDate,
        eventDescription,
        eventName,
        eventType,
        content: "",
        location,
        postType: "demand",
        authorId: currentUser.uid,
        isDraft: false,
        email,
        purposeType,
        participationType,
        tags: selectedTags ?? [], // ✅ 預防 undefined
        customItems: finalCustomItems, // ⭐ 加這行
        eventEndDate: finalEventEndDate, // ⭐ 加這行
      };

      // 如果是編輯現有草稿，則直接發布該草稿
      if (currentDraftId) {
        await postService.publishDraft(currentDraftId);
        setSnackbarMessage("草稿已成功發布");
      } else {
        // 否則創建新的發布
        const result = await postService.createPost(postData);
        if (!result.success) throw new Error("發布失敗");
        setSnackbarMessage("文章發布成功");
        setTimeout(() => {
          router.push("/Artical/DemandList"); // 這邊對應你紅筆框起來的路徑
        }, 2000);
      }
      // ✅ 加入跳轉邏輯（2 秒後跳轉）

      setSnackbarSeverity("success");
      clearForm();
    } catch (error) {
      console.error("發布文章時出錯:", error);
      setSnackbarMessage("發布失敗，請稍後再試");
      setSnackbarSeverity("error");
    } finally {
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    // 驗證表單
    const { isValid, newErrors } = validateForm();

    if (!isValid) {
      setErrors(newErrors);
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);

      // Scroll 到第一個錯誤欄位
      if (newErrors.title && titleRef.current) {
        titleRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      } else if (newErrors.selectedDemands && demandsRef.current) {
        demandsRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      } else if (newErrors.eventDate && eventDateRef.current) {
        eventDateRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }

      return; // 有錯就不繼續存草稿
    }

    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("尚未登入");

      const postData = {
        title,
        organizationName,
        selectedDemands,
        demandDescription,
        cooperationReturn,
        estimatedParticipants,
        eventDate,
        eventName,
        eventType,
        content: "",
        location,
        postType: "demand",
        authorId: currentUser.uid,
        isDraft: true,
        email,
        customItems: finalCustomItems,
        eventEndDate: finalEventEndDate,
        eventDescription: finalEventDescription,
        tags: selectedTags ?? [],
      };

      const result = await postService.createPost(postData);

      if (result.success) {
        setSnackbarMessage("草稿儲存成功");
        setSnackbarSeverity("success");
      } else {
        throw new Error("草稿儲存失敗");
      }
    } catch (error) {
      console.error("儲存草稿時出錯:", error);
      setSnackbarMessage("儲存草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
    } finally {
      setOpenSnackbar(true);
      setLoading(false);
    }
  };

  const handleViewDrafts = () => {
    loadDrafts();
  };

  return (
    <>
      <Navbar />
      <ClientOnly
        fallback={
          <Box sx={{ pt: 10, pb: 8 }}>
            <Container maxWidth="md">
              <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  載入中...
                </Typography>
              </Paper>
            </Container>
          </Box>
        }
      >
        <Box sx={{ pt: 10, pb: 8 }}>
          <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              {/* ✅ 圖示與標題分開處理 */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Box
                  component="img"
                  src="/image/findsponsor.png"
                  alt="find sponsor"
                  sx={{ width: 80, height: 80, mb: 1 }}
                />
                <Typography variant="h5" fontWeight="bold">
                  發布需求文章
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Box sx={{ mb: 3, px: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  * 表示必填欄位
                </Typography>
              </Box>

              {/* ➤ 基本資訊區塊 */}
              <Box
                ref={titleRef}
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <AssignmentIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="h6">填寫基本資訊</Typography>
                </Box>
                <TextField
                  fullWidth
                  label="標題 "
                  variant="standard"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  inputProps={{ maxLength: 80 }}
                  sx={{ mb: 3 }}
                  error={errors.title}
                  helperText={errors.title ? "標題為必填項目" : ""}
                  required
                />
                <TextField
                  fullWidth
                  label="組織名稱"
                  variant="standard"
                  value={organizationName}
                  disabled
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="聯絡信箱"
                  variant="standard"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  sx={{ mb: 3 }}
                  helperText="此信箱將作為合作洽談的聯絡方式"
                />
              </Box>
              {/* ➤ 聯繫窗口資訊區塊 */}
              <Box
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <InfoIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="h6">聯繫窗口資訊</Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    label={
                      <>
                        聯繫人姓名 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    sx={{ flex: 1 }}
                    error={errors.contactPerson}
                    helperText={errors.contactPerson ? "此欄為必填" : ""}
                  />
                  <TextField
                    label={
                      <>
                        連絡電話 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) =>
                      setContactPhone(e.target.value.replace(/\D/g, ""))
                    }
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    sx={{ flex: 1 }}
                    error={errors.contactPhone}
                    helperText={
                      errors.contactPhone ? "請填入有效電話（數字）" : ""
                    }
                  />

                  <TextField
                    label={
                      <>
                        聯絡信箱 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    sx={{ flex: 1 }}
                    error={errors.contactEmail}
                    helperText={errors.contactEmail ? "此欄為必填" : ""}
                  />
                </Box>
              </Box>

              {/* ➤ 需求分類（下拉式選單） */}

              <Autocomplete
                options={purposeOptions}
                value={purposeType}
                onChange={(_, newValue) => setPurposeType(newValue ?? "")}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={
                      <>
                        需求目的類型 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    error={Boolean(errors.purposeType)}
                    helperText={errors.purposeType ? "此欄為必填" : ""}
                  />
                )}
                sx={{ mb: 3 }}
              />

              {/* 根據需求目的切換表單內容 */}
              {purposeType === "活動支援" && (
                <Box
                  sx={{
                    backgroundColor: "#f9f9f9",
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    活動支援內容說明
                  </Typography>

                  <TextField
                    fullWidth
                    label={
                      <>
                        活動名稱 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    sx={{ mb: 3 }}
                    error={errors.eventName}
                    helperText={errors.eventName ? "此欄為必填" : ""}
                  />

                  <Autocomplete
                    options={eventTypes}
                    value={eventType}
                    onChange={(_, newValue) => setEventType(newValue ?? "")}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <>
                            活動性質 <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        variant="standard"
                        sx={{ mb: 3 }}
                        error={errors.eventType}
                        helperText={errors.eventType ? "此欄為必填" : ""}
                      />
                    )}
                  />

                  {/* 並排區塊：預估人數與活動地點 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      label={
                        <>
                          預估人數 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="number"
                      value={estimatedParticipants}
                      onChange={(e) => setEstimatedParticipants(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.estimatedParticipants}
                      helperText={
                        errors.estimatedParticipants ? "此欄為必填" : ""
                      }
                    />
                    <TextField
                      label={
                        <>
                          活動地點 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.location}
                      helperText={errors.location ? "此欄為必填" : ""}
                    />
                  </Box>

                  {/* 贊助截止時間 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        贊助截止日期 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    type="date"
                    value={cooperationReturn}
                    onChange={(e) => setCooperationReturn(e.target.value)}
                    sx={{ mb: 3 }}
                    InputLabelProps={{ shrink: true }}
                    error={errors.cooperationReturn}
                    helperText={
                      errors.cooperationReturn
                        ? "此欄為必填，且不可晚於活動時間"
                        : ""
                    }
                  />

                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    {/* 活動開始日期 */}
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動開始日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventDate}
                      helperText={errors.eventDate ? "此欄為必填" : ""}
                    />

                    {/* 活動結束日期 */}
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動結束日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventEndDate}
                      helperText={errors.eventEndDate ? "此欄為必填" : ""}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label={
                      <>
                        需求物資 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={customItems[0] || ""}
                    onChange={(e) => setCustomItems([e.target.value])}
                    sx={{ mb: 3 }}
                    error={errors.customItems}
                    helperText={errors.customItems ? "此欄為必填" : ""}
                  />

                  <Autocomplete
                    options={participationOptions1}
                    value={participationType}
                    onChange={(_, newValue) =>
                      setParticipationType(newValue ?? "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <>
                            希望企業參與方式{" "}
                            <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        variant="standard"
                        sx={{ mb: 3 }}
                        error={errors.participationType}
                        helperText={
                          errors.participationType ? "此欄為必填" : ""
                        }
                      />
                    )}
                  />

                  <TextField
                    fullWidth
                    label="回饋方式"
                    placeholder="例如：於社群平台標註企業、提供合作成果報告、活動現場感謝詞等"
                    multiline
                    rows={2}
                    value={demandDescription}
                    onChange={(e) => setDemandDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  <TextField
                    fullWidth
                    label="活動說明"
                    placeholder=""
                    multiline
                    rows={2}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </Box>
              )}

              {/* 教育推廣 */}
              {purposeType === "教育推廣" && (
                <Box
                  sx={{
                    backgroundColor: "#f9f9f9",
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    教育推廣內容說明
                  </Typography>

                  {/* 推廣主題 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        推廣主題 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    placeholder="例如：閱讀推廣 / 媒體素養 / 財商教育"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    sx={{ mb: 3 }}
                    error={errors.eventName}
                    helperText={errors.eventName ? "此欄為必填" : ""}
                  />

                  {/* 並排：預估人數 + 活動地點 + 預計推廣對象 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      label={
                        <>
                          預估人數 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="number"
                      value={estimatedParticipants}
                      onChange={(e) => setEstimatedParticipants(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.estimatedParticipants}
                      helperText={
                        errors.estimatedParticipants ? "此欄為必填" : ""
                      }
                    />
                    <TextField
                      label={
                        <>
                          活動地點 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.location}
                      helperText={errors.location ? "此欄為必填" : ""}
                    />
                    <Autocomplete
                      options={[
                        "國小學生",
                        "國中學生",
                        "高中職學生",
                        "大專院校",
                        "成人社區",
                        "其他",
                      ]}
                      value={promotionTarget}
                      onChange={(_, newValue) =>
                        setPromotionTarget(newValue ?? "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            <>
                              預計推廣對象{" "}
                              <span style={{ color: "#d32f2f" }}>*</span>
                            </>
                          }
                          variant="standard"
                          error={errors.eventDescription}
                          helperText={
                            errors.eventDescription ? "此欄為必填" : ""
                          }
                        />
                      )}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* 贊助截止時間 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        贊助截止日期 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    type="date"
                    sx={{ mb: 3 }}
                    InputLabelProps={{ shrink: true }}
                    value={cooperationReturn}
                    onChange={(e) => setCooperationReturn(e.target.value)}
                    error={errors.cooperationReturn}
                    helperText={
                      errors.cooperationReturn
                        ? "此欄為必填，且不可晚於活動時間"
                        : ""
                    }
                  />

                  {/* 活動開始與結束時間 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動開始日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventDate}
                      helperText={errors.eventDate ? "此欄為必填" : ""}
                    />
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動結束日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventEndDate}
                      helperText={errors.eventEndDate ? "此欄為必填" : ""}
                    />
                  </Box>
                  <TextField
                    fullWidth
                    label={
                      <>
                        需求物資 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={customItems[0] || ""}
                    onChange={(e) => setCustomItems([e.target.value])}
                    sx={{ mb: 3 }}
                    error={errors.customItems}
                    helperText={errors.customItems ? "此欄為必填" : ""}
                  />

                  {/* 合作方式（下拉） */}
                  <Autocomplete
                    options={participationOptions2}
                    value={participationType}
                    onChange={(_, newValue) =>
                      setParticipationType(newValue ?? "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <>
                            希望企業參與方式{" "}
                            <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        variant="standard"
                        error={errors.participationType}
                        helperText={
                          errors.participationType ? "此欄為必填" : ""
                        }
                      />
                    )}
                    sx={{ mb: 3 }}
                  />

                  {/* 回饋方式 */}
                  <TextField
                    fullWidth
                    label="回饋方式"
                    placeholder="例如：於社群平台標註企業、提供合作成果報告、活動現場感謝詞等"
                    multiline
                    rows={2}
                    value={demandDescription}
                    onChange={(e) => setDemandDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  {/* 教育推廣內容說明 */}
                  <TextField
                    fullWidth
                    label="內容說明"
                    placeholder="請具體說明推廣活動的形式與內容，例如：講座安排、互動活動設計等"
                    multiline
                    rows={3}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </Box>
              )}

              {purposeType === "社區服務" && (
                <Box
                  sx={{
                    backgroundColor: "#f9f9f9",
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    社區服務內容說明
                  </Typography>

                  {/* 服務主題 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        服務主題 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    placeholder="例如：社區清潔 / 陪伴長者 / 街道美化"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    sx={{ mb: 3 }}
                    error={errors.eventName}
                    helperText={errors.eventName ? "此欄為必填" : ""}
                  />

                  {/* 並排：預估人數、活動地點、服務對象 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      label={
                        <>
                          預估參與人數{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="number"
                      value={estimatedParticipants}
                      onChange={(e) => setEstimatedParticipants(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.estimatedParticipants}
                      helperText={
                        errors.estimatedParticipants ? "此欄為必填" : ""
                      }
                    />
                    <TextField
                      label={
                        <>
                          活動地點 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.location}
                      helperText={errors.location ? "此欄為必填" : ""}
                    />
                    <Autocomplete
                      options={[
                        "高齡長者",
                        "兒童與青少年",
                        "身心障礙者",
                        "偏鄉居民",
                        "一般社區居民",
                        "其他",
                      ]}
                      value={eventType}
                      onChange={(_, newValue) => setEventType(newValue ?? "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            <>
                              服務對象{" "}
                              <span style={{ color: "#d32f2f" }}>*</span>
                            </>
                          }
                          variant="standard"
                          error={errors.eventType}
                          helperText={errors.eventType ? "此欄為必填" : ""}
                        />
                      )}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* 贊助截止時間 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        贊助截止日期 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    type="date"
                    value={cooperationReturn}
                    onChange={(e) => setCooperationReturn(e.target.value)}
                    sx={{ mb: 3 }}
                    InputLabelProps={{ shrink: true }}
                    error={errors.cooperationReturn}
                    helperText={
                      errors.cooperationReturn
                        ? "此欄為必填，且不可晚於活動時間"
                        : ""
                    }
                  />

                  {/* 活動起訖時間 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動開始日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventDate}
                      helperText={errors.eventDate ? "此欄為必填" : ""}
                    />
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動結束日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventEndDate}
                      helperText={errors.eventEndDate ? "此欄為必填" : ""}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label={
                      <>
                        需求物資 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={customItems[0] || ""}
                    onChange={(e) => setCustomItems([e.target.value])}
                    error={errors.customItems}
                    helperText={errors.customItems ? "此欄為必填" : ""}
                    sx={{ mb: 3 }}
                  />

                  {/* 合作方式 */}
                  <Autocomplete
                    options={[
                      "物資捐贈（如清潔用品、食品、衣物...）",
                      "人力支援",
                      "專業支援（如法律、醫療、心理諮詢...）",
                      "場地提供或租借協助",
                      "金錢贊助",
                      "工具與設備提供（如掃具、音響、帳篷...）",
                    ]}
                    value={participationType}
                    onChange={(_, newValue) =>
                      setParticipationType(newValue ?? "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <>
                            希望企業參與方式{" "}
                            <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        variant="standard"
                        error={errors.participationType}
                        helperText={
                          errors.participationType ? "此欄為必填" : ""
                        }
                      />
                    )}
                    sx={{ mb: 3 }}
                  />

                  {/* 回饋方式 */}
                  <TextField
                    fullWidth
                    label="回饋方式"
                    placeholder="例如：於社群平台標註企業、提供合作成果報告、活動現場感謝詞等"
                    multiline
                    rows={2}
                    value={demandDescription}
                    onChange={(e) => setDemandDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  {/* 服務內容簡介 */}
                  <TextField
                    fullWidth
                    label="內容說明"
                    placeholder="例如：清潔打掃、環境綠美化、社區義診等"
                    multiline
                    rows={3}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </Box>
              )}

              {purposeType === "校園宣傳" && (
                <Box
                  sx={{
                    backgroundColor: "#f9f9f9",
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="bold"
                    gutterBottom
                  >
                    校園宣傳內容說明
                  </Typography>

                  {/* 宣傳主題 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        宣傳主題 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    placeholder="例如：品牌推廣 / 環保理念教育 / 活動宣傳"
                    value={promotionTopic}
                    onChange={(e) => setPromotionTopic(e.target.value)}
                    sx={{ mb: 3 }}
                    error={errors.promotionTopic}
                    helperText={errors.promotionTopic ? "此欄為必填" : ""}
                  />

                  {/* 並排：目標對象 + 宣傳形式 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <Autocomplete
                      options={[
                        "國小學生",
                        "國中學生",
                        "高中職學生",
                        "大專院校",
                        "教職員工",
                        "家長",
                        "社區民眾",
                      ]}
                      value={promotionTarget}
                      onChange={(_, newValue) =>
                        setPromotionTarget(newValue ?? "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            <>
                              目標對象{" "}
                              <span style={{ color: "#d32f2f" }}>*</span>
                            </>
                          }
                          variant="standard"
                          error={errors.promotionTarget}
                          helperText={
                            errors.promotionTarget ? "此欄為必填" : ""
                          }
                        />
                      )}
                      sx={{ flex: 1 }}
                    />
                    <Autocomplete
                      options={[
                        "校園宣講",
                        "海報展示",
                        "攤位設置",
                        "社群媒體宣傳",
                        "其他",
                      ]}
                      value={promotionForm}
                      onChange={(_, newValue) =>
                        setPromotionForm(newValue ?? "")
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            <>
                              宣傳形式{" "}
                              <span style={{ color: "#d32f2f" }}>*</span>
                            </>
                          }
                          variant="standard"
                          error={errors.promotionForm}
                          helperText={errors.promotionForm ? "此欄為必填" : ""}
                        />
                      )}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* 並排：活動地點 + 預估參與人數 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      label={
                        <>
                          預估參與人數{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="number"
                      value={estimatedParticipants}
                      onChange={(e) => setEstimatedParticipants(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.estimatedParticipants}
                      helperText={
                        errors.estimatedParticipants ? "此欄為必填" : ""
                      }
                    />
                    <TextField
                      label={
                        <>
                          欲宣傳學校名稱{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      sx={{ flex: 1 }}
                      error={errors.schoolName}
                      helperText={errors.schoolName ? "此欄為必填" : ""}
                    />
                  </Box>

                  {/* 贊助截止時間 */}
                  <TextField
                    fullWidth
                    label={
                      <>
                        贊助截止日期 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    type="date"
                    value={cooperationReturn}
                    onChange={(e) => setCooperationReturn(e.target.value)}
                    sx={{ mb: 3 }}
                    InputLabelProps={{ shrink: true }}
                    error={errors.cooperationReturn}
                    helperText={
                      errors.cooperationReturn
                        ? "贊助截止時間不可晚於活動時間"
                        : ""
                    }
                  />

                  {/* 並排：開始與結束日期 */}
                  <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動開始日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventDate}
                      helperText={errors.eventDate ? "此欄為必填" : ""}
                    />
                    <TextField
                      fullWidth
                      label={
                        <>
                          活動結束日期{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      type="date"
                      value={eventEndDate}
                      onChange={(e) => setEventEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      error={errors.eventEndDate}
                      helperText={errors.eventEndDate ? "此欄為必填" : ""}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label={
                      <>
                        需求物資 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={customItems}
                    sx={{ mb: 3 }}
                    error={errors.customItems}
                    helperText={errors.customItems ? "此欄為必填" : ""}
                  />

                  {/* 合作方式 */}
                  <Autocomplete
                    options={[
                      "宣傳物資（如 DM、海報...）",
                      "現場人力支援",
                      "攤位道具贊助（如帳篷、音響、展架...）",
                      "金錢贊助",
                      "聯名活動贊助品",
                    ]}
                    value={participationType}
                    onChange={(_, newValue) =>
                      setParticipationType(newValue ?? "")
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={
                          <>
                            希望企業參與方式{" "}
                            <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        variant="standard"
                        error={errors.participationType}
                        helperText={
                          errors.participationType ? "此欄為必填" : ""
                        }
                      />
                    )}
                    sx={{ mb: 3 }}
                  />

                  {/* 回饋方式 */}
                  <TextField
                    fullWidth
                    label="回饋方式"
                    placeholder="例如：於社群平台標註企業、提供合作成果報告、活動現場感謝詞等"
                    multiline
                    rows={2}
                    value={demandDescription}
                    onChange={(e) => setDemandDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />

                  {/* 補充說明 */}
                  <TextField
                    fullWidth
                    label="內容說明"
                    placeholder="例如：活動安排流程、企業曝光位置等"
                    multiline
                    rows={3}
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </Box>
              )}

              {/* ➤ 按鈕區塊 */}
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
              >
                {/* 左側：草稿操作 */}
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSaveDraft}
                    sx={{
                      backgroundColor: "#e0f2f1",
                      color: "#004d40",
                      "&:hover": { backgroundColor: "#b2dfdb" },
                    }}
                  >
                    儲存草稿
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleViewDrafts}
                    sx={{
                      color: "gray",
                      borderColor: "gray",
                      "&:hover": { borderColor: "#888" },
                    }}
                  >
                    查看草稿
                  </Button>
                </Box>

                {/* 右側：發布按鈕 */}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "發布中..." : "發布文章"}
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      </ClientOnly>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}{" "}
        </Alert>
      </Snackbar>

      {/* 草稿管理對話框 */}
      <DemandDraftManager
        open={openDraftsDialog}
        onClose={() => setOpenDraftsDialog(false)}
        drafts={drafts}
        loading={loadingDrafts}
        onLoadDraft={loadDraft}
        onDeleteDraft={confirmDeleteDraft}
      />

      {/* 刪除草稿確認對話框 */}
      <DeleteDraftDialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        onConfirm={deleteDraft}
      />
    </>
  );
}
