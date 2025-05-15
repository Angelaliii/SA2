"use client";

import AssignmentIcon from "@mui/icons-material/Assignment";
import InfoIcon from "@mui/icons-material/Info";
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
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import DeleteDraftDialog from "../../components/article/DeleteDraftDialog";
import DemandDraftManager from "../../components/article/DemandDraftManager";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth } from "../../firebase/config";
import * as postService from "../../firebase/services/post-service";
import { ClientOnly } from "../../hooks/useHydration";

// 定義活動性質選項
const eventNatureOptions = [
  "迎新",
  "講座",
  "比賽",
  "展覽",
  "工作坊",
  "營隊",
  "其他",
];

export default function DemandPostPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [eventName, setEventName] = useState("");
  const [eventNature, setEventNature] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");
  const [location, setLocation] = useState("");
  const [sponsorDeadline, setSponsorDeadline] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [title, setTitle] = useState("");

  const [demandType, setDemandType] = useState("");
  const [materialCategory, setMaterialCategory] = useState<string[]>([]);
  const [materialDetails, setMaterialDetails] = useState("");
  const [moneyLowerLimit, setMoneyLowerLimit] = useState("");
  const [moneyUpperLimit, setMoneyUpperLimit] = useState("");
  const [moneyPurpose, setMoneyPurpose] = useState("");
  const [speakerType, setSpeakerType] = useState("");
  const [speakerDetail, setSpeakerDetail] = useState("");

  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );

  // 草稿相關狀態
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // 表單錯誤狀態
  const [errors, setErrors] = useState({
    title: false,
    contactName: false,
    contactPhone: false,
    contactEmail: false,
    eventName: false,
    eventNature: false,
    estimatedParticipants: false,
    sponsorDeadline: false,
    eventStart: false,
    eventEnd: false,
    demandType: false,
    materialCategory: false,
    materialDetails: false,
    moneyLowerLimit: false,
    moneyUpperLimit: false,
    moneyPurpose: false,
    speakerType: false,
    speakerDetail: false,
    feedbackDetails: false,
  });

  // 表單區塊參考
  const titleRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        setEmail(user.email ?? "");
        const organization = await postService.getOrganizationName(user.uid);
        setOrganizationName(organization ?? "未知組織");
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

  const validateForm = () => {
    const newErrors = {
      title: !title.trim(),
      contactName: !contactName.trim(),
      contactPhone: !contactPhone.trim(),
      contactEmail: !contactEmail.trim(),
      eventName: !eventName.trim(),
      eventNature: !eventNature.trim(),
      estimatedParticipants: Number(estimatedParticipants) <= 0,
      sponsorDeadline: !sponsorDeadline,
      eventStart: !eventStart,
      eventEnd: !eventEnd,
      demandType: !demandType,
      materialCategory: demandType === "物資" && materialCategory.length === 0,
      materialDetails: demandType === "物資" && !materialDetails.trim(),
      moneyLowerLimit: demandType === "金錢" && !moneyLowerLimit.trim(),
      moneyUpperLimit: demandType === "金錢" && !moneyUpperLimit.trim(),
      moneyPurpose: demandType === "金錢" && !moneyPurpose.trim(),
      speakerType: demandType === "講師" && !speakerType,
      speakerDetail: demandType === "講師" && !speakerDetail.trim(),
      feedbackDetails: !feedbackDetails.trim(),
    };

    // 檢查贊助截止日是否早於活動開始日
    if (sponsorDeadline && eventStart) {
      const deadline = new Date(sponsorDeadline);
      const start = new Date(eventStart);
      if (deadline > start) newErrors.sponsorDeadline = true;
    }

    // 檢查活動開始日是否早於或等於結束日
    if (eventStart && eventEnd) {
      const start = new Date(eventStart);
      const end = new Date(eventEnd);
      if (start > end) newErrors.eventEnd = true;
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  const clearForm = () => {
    setTitle("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setEventName("");
    setEventNature("");
    setEstimatedParticipants("");
    setLocation("");
    setSponsorDeadline("");
    setEventStart("");
    setEventEnd("");
    setDemandType("");
    setMaterialCategory([]);
    setMaterialDetails("");
    setMoneyLowerLimit("");
    setMoneyUpperLimit("");
    setMoneyPurpose("");
    setSpeakerType("");
    setSpeakerDetail("");
    setFeedbackDetails("");
    setNotes("");
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

      setOpenDraftsDialog(false);

      setTimeout(() => {
        setCurrentDraftId(draftId);
        setTitle(draft.title || "");
        setContactName(draft.contactName ?? "");
        setContactPhone(draft.contactPhone ?? "");
        setContactEmail(draft.contactEmail ?? "");
        setEventName(draft.eventName ?? "");
        setEventNature(draft.eventNature ?? "");
        setEstimatedParticipants(draft.estimatedParticipants ?? "");
        setLocation(draft.location ?? "");
        setSponsorDeadline(draft.sponsorDeadline ?? "");
        setEventStart(draft.eventStart ?? "");
        setEventEnd(draft.eventEnd ?? "");
        setDemandType(draft.demandType ?? "");
        setMaterialCategory(draft.materialCategory ?? []);
        setMaterialDetails(draft.materialDetails ?? "");
        setMoneyLowerLimit(draft.moneyLowerLimit ?? "");
        setMoneyUpperLimit(draft.moneyUpperLimit ?? "");
        setMoneyPurpose(draft.moneyPurpose ?? "");
        setSpeakerType(draft.speakerType ?? "");
        setSpeakerDetail(draft.speakerDetail ?? "");
        setFeedbackDetails(draft.feedbackDetails ?? "");
        setNotes(draft.notes ?? "");

        setSnackbarMessage("草稿已載入");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }, 100);
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
      setOpenDeleteDialog(false);
      setDraftToDelete(null);

      setTimeout(async () => {
        await postService.deletePost(draftToDelete);
        setDrafts(drafts.filter((draft) => draft.id !== draftToDelete));

        if (currentDraftId === draftToDelete) {
          clearForm();
        }

        setSnackbarMessage("草稿已刪除");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }, 100);
    } catch (error) {
      console.error("刪除草稿時出錯:", error);
      setSnackbarMessage("無法刪除草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);

      // Scroll to first error field
      if (titleRef.current) {
        titleRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("尚未登入");

      const postData = {
        title,
        organizationName,
        email,
        contactName,
        contactPhone,
        contactEmail,
        eventName,
        eventNature,
        estimatedParticipants,
        location,
        sponsorDeadline,
        eventStart,
        eventEnd,
        demandType,
        materialCategory,
        materialDetails,
        moneyLowerLimit,
        moneyUpperLimit,
        moneyPurpose,
        speakerType,
        speakerDetail,
        feedbackDetails,
        notes,
        postType: "demand",
        authorId: currentUser.uid,
        isDraft: false,
        content: "", // Add empty content as it's required by PostData type
        tags: [], // Add empty tags array as it's required by PostData type
        createdAt: new Date().toISOString(),
      };

      if (currentDraftId) {
        await postService.publishDraft(currentDraftId);
        setSnackbarMessage("草稿已成功發布");
      } else {
        const result = await postService.createPost(postData);
        if (!result.success) throw new Error("發布失敗");
        setSnackbarMessage("文章發布成功");
      }

      setSnackbarSeverity("success");
      setOpenSnackbar(true);

      setTimeout(() => {
        router.push("/Artical/DemandList");
      }, 2000);

      clearForm();
    } catch (error) {
      console.error("發布文章時出錯:", error);
      setSnackbarMessage("發布失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    // 不檢查必填欄位，直接儲存草稿
    setLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("尚未登入");

      const postData = {
        title: title || "未命名草稿",
        organizationName,
        email,
        contactName,
        contactPhone,
        contactEmail,
        eventName,
        eventNature,
        estimatedParticipants,
        location,
        sponsorDeadline,
        eventStart,
        eventEnd,
        demandType,
        materialCategory,
        materialDetails,
        moneyLowerLimit,
        moneyUpperLimit,
        moneyPurpose,
        speakerType,
        speakerDetail,
        feedbackDetails,
        notes,
        postType: "demand",
        authorId: currentUser.uid,
        isDraft: true,
        content: "",
        tags: [],
        createdAt: new Date().toISOString(),
      };

      let result;

      if (currentDraftId) {
        // 更新現有草稿
        result = await postService.updatePost(currentDraftId, postData);
      } else {
        // 創建新草稿
        result = await postService.createPost(postData);
        if (result.success && result.id) {
          setCurrentDraftId(result.id);
        }
      }

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
              {/* 基本資訊區塊 */}
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
                  <Typography variant="h6">基本資訊</Typography>
                </Box>
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
                  disabled
                  type="email"
                  sx={{ mb: 3 }}
                />
              </Box>
              {/* 聯繫窗口資訊區塊 */}
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
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    sx={{ flex: 1 }}
                    error={errors.contactName}
                    helperText={errors.contactName ? "此欄為必填" : ""}
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
              {/* 贊助依序區塊 */}{" "}
              <Box
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  贊助活動
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
                  options={eventNatureOptions}
                  value={eventNature}
                  onChange={(_, val) => setEventNature(val ?? "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={
                        <>
                          活動性質 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      error={errors.eventNature}
                      helperText={errors.eventNature ? "此欄為必填" : ""}
                      sx={{ mb: 3 }}
                    />
                  )}
                />

                <TextField
                  fullWidth
                  label={
                    <>
                      預估人數 <span style={{ color: "#d32f2f" }}>*</span>
                    </>
                  }
                  type="number"
                  variant="standard"
                  value={estimatedParticipants}
                  onChange={(e) => setEstimatedParticipants(e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={{ mb: 3 }}
                  error={errors.estimatedParticipants}
                  helperText={errors.estimatedParticipants ? "必須大於0" : ""}
                />

                <TextField
                  fullWidth
                  label="活動地點"
                  variant="standard"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label={
                    <>
                      贊助截止日期 <span style={{ color: "#d32f2f" }}>*</span>
                    </>
                  }
                  type="date"
                  value={sponsorDeadline}
                  onChange={(e) => setSponsorDeadline(e.target.value)}
                  sx={{ mb: 3 }}
                  InputLabelProps={{ shrink: true }}
                  error={errors.sponsorDeadline}
                  helperText={
                    errors.sponsorDeadline
                      ? "贊助截止日期必須早於活動開始日期"
                      : ""
                  }
                />

                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                  <TextField
                    fullWidth
                    label={
                      <>
                        活動開始日期 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    type="date"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    error={errors.eventStart}
                    helperText={errors.eventStart ? "此欄為必填" : ""}
                  />

                  <TextField
                    fullWidth
                    label={
                      <>
                        活動結束日期 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    type="date"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    error={errors.eventEnd}
                    helperText={
                      errors.eventEnd
                        ? "活動結束日期必須晚於或等於開始日期"
                        : ""
                    }
                  />
                </Box>
              </Box>
              {/* 公告內容區塊 */}{" "}
              <Box
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  公告內容
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label={
                      <>
                        標題 <span style={{ color: "#d32f2f" }}>*</span>
                      </>
                    }
                    variant="standard"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ mb: 3 }}
                    error={errors.title}
                    helperText={errors.title ? "此欄為必填" : ""}
                  />
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: "medium" }}
                  >
                    需求類型{" "}
                    <Box component="span" sx={{ color: "error.main" }}>
                      *
                    </Box>
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant={demandType === "物資" ? "contained" : "outlined"}
                      onClick={() => setDemandType("物資")}
                    >
                      物資
                    </Button>

                    <Button
                      variant={demandType === "金錢" ? "contained" : "outlined"}
                      onClick={() => setDemandType("金錢")}
                    >
                      金錢
                    </Button>

                    <Button
                      variant={demandType === "講師" ? "contained" : "outlined"}
                      onClick={() => setDemandType("講師")}
                    >
                      講師
                    </Button>
                  </Box>
                </Box>

                {demandType === "物資" && (
                  <>
                    <Autocomplete
                      multiple
                      options={["飲料", "食物", "生活用品", "戶外用品", "其他"]}
                      value={materialCategory}
                      onChange={(_, val) => setMaterialCategory(val)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            <>
                              物資類型{" "}
                              <span style={{ color: "#d32f2f" }}>*</span>
                            </>
                          }
                          error={errors.materialCategory}
                          helperText={
                            errors.materialCategory ? "請選擇至少一種類型" : ""
                          }
                          sx={{ mb: 3 }}
                        />
                      )}
                    />

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={
                        <>
                          需求物資 <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      value={materialDetails}
                      onChange={(e) => setMaterialDetails(e.target.value)}
                      error={errors.materialDetails}
                      helperText={errors.materialDetails ? "此欄為必填" : ""}
                      sx={{ mb: 3 }}
                    />
                  </>
                )}

                {demandType === "金錢" && (
                  <>
                    <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                      <TextField
                        fullWidth
                        label={
                          <>
                            金額下限 <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        type="number"
                        value={moneyLowerLimit}
                        onChange={(e) => setMoneyLowerLimit(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <Box component="span" sx={{ mr: 1 }}>
                              NT$
                            </Box>
                          ),
                        }}
                        error={errors.moneyLowerLimit}
                        helperText={errors.moneyLowerLimit ? "此欄為必填" : ""}
                      />
                      <TextField
                        fullWidth
                        label={
                          <>
                            金額上限 <span style={{ color: "#d32f2f" }}>*</span>
                          </>
                        }
                        type="number"
                        value={moneyUpperLimit}
                        onChange={(e) => setMoneyUpperLimit(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <Box component="span" sx={{ mr: 1 }}>
                              NT$
                            </Box>
                          ),
                        }}
                        error={errors.moneyUpperLimit}
                        helperText={errors.moneyUpperLimit ? "此欄為必填" : ""}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={
                        <>
                          金錢用途說明{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      placeholder="請說明金錢的使用規劃和用途"
                      value={moneyPurpose}
                      onChange={(e) => setMoneyPurpose(e.target.value)}
                      error={errors.moneyPurpose}
                      helperText={errors.moneyPurpose ? "此欄為必填" : ""}
                      sx={{ mb: 3 }}
                    />
                  </>
                )}

                {demandType === "講師" && (
                  <>
                    <Autocomplete
                      options={[
                        "專業技能（如行銷、程式）",
                        "職涯分享",
                        "產業趨勢",
                        "其他",
                      ]}
                      value={speakerType}
                      onChange={(_, val) => setSpeakerType(val ?? "")}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            <>
                              講師性質{" "}
                              <span style={{ color: "#d32f2f" }}>*</span>
                            </>
                          }
                          error={errors.speakerType}
                          helperText={errors.speakerType ? "此欄為必填" : ""}
                          sx={{ mb: 3 }}
                        />
                      )}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label={
                        <>
                          講師具體需求{" "}
                          <span style={{ color: "#d32f2f" }}>*</span>
                        </>
                      }
                      placeholder="希望講師具備電商經驗，分享創業歷程"
                      value={speakerDetail}
                      onChange={(e) => setSpeakerDetail(e.target.value)}
                      error={errors.speakerDetail}
                      helperText={errors.speakerDetail ? "此欄為必填" : ""}
                      sx={{ mb: 3 }}
                    />{" "}
                  </>
                )}

                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  sx={{ mt: 3, mb: 1 }}
                >
                  回饋方式
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label={
                    <>
                      回饋方式說明 <span style={{ color: "#d32f2f" }}>*</span>
                    </>
                  }
                  placeholder="請描述您可提供的回饋，例如：活動曝光產品、IG宣傳等"
                  value={feedbackDetails}
                  onChange={(e) => setFeedbackDetails(e.target.value)}
                  error={errors.feedbackDetails}
                  helperText={errors.feedbackDetails ? "此欄為必填" : ""}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="補充說明（非必填）"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mb: 1 }}
                />
              </Box>
              {/* 按鈕區塊 */}
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
                    disabled={loading}
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
                    disabled={loading}
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
          {snackbarMessage}
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
