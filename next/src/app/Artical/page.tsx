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
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";
import InventoryIcon from "@mui/icons-material/Inventory";
import RedeemIcon from "@mui/icons-material/Redeem";
import { onAuthStateChanged } from "firebase/auth";
import DeleteDraftDialog from "../../components/article/DeleteDraftDialog";
import DemandDraftManager from "../../components/article/DemandDraftManager";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth } from "../../firebase/config";
import * as postService from "../../firebase/services/post-service";
import { ClientOnly } from "../../hooks/useHydration";

interface DemandPostData {
  id?: string;
  title: string;
  organizationName: string;
  selectedDemands: string[];
  demandDescription?: string;
  cooperationReturn?: string;
  estimatedParticipants?: string;
  eventDate: string;
  eventDescription?: string;
  eventName: string; // Make sure this property exists
  eventType: string; // Make sure this property exists
  content: string;
  location: string;
  postType: string;
  tags: string[];
  authorId: string;
  isDraft: boolean;
  email?: string;
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
  const [email, setEmail] = useState("");

  // 表單錯誤狀態
  const [errors, setErrors] = useState({
    title: false,
    selectedDemands: false,
    eventDate: false,
  });

  // 表單區塊參考
  const titleRef = React.useRef<HTMLDivElement>(null);
  const demandsRef = React.useRef<HTMLDivElement>(null);
  const eventDateRef = React.useRef<HTMLDivElement>(null);

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
      // 從資料庫獲取草稿
      const draft = await postService.getPostById(draftId);
      if (!draft) {
        throw new Error("找不到指定草稿");
      }

      // 填充表單基本資料
      setTitle(draft.title || "");
      setCurrentDraftId(draftId);

      // 設置其他字段
      if (draft.selectedDemands) setSelectedDemands(draft.selectedDemands);
      if (draft.demandDescription)
        setDemandDescription(draft.demandDescription);
      if (draft.cooperationReturn)
        setCooperationReturn(draft.cooperationReturn);
      if (draft.estimatedParticipants)
        setEstimatedParticipants(draft.estimatedParticipants);
      if (draft.eventDate) setEventDate(draft.eventDate);
      if (draft.eventDescription) setEventDescription(draft.eventDescription);
      if (draft.eventName) setEventName(draft.eventName);
      if (draft.eventType) setEventType(draft.eventType);

      // 更新UI狀態
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

  // 將部分邏輯抽離出來，減少 handleSubmit 的複雜度
  const validateForm = () => {
    // Reset error states
    setErrors({
      title: false,
      selectedDemands: false,
      eventDate: false,
    });

    // Validate form and track if all required fields are filled
    let isValid = true;
    const newErrors = {
      title: false,
      selectedDemands: false,
      eventDate: false,
    };

    if (!title.trim()) {
      newErrors.title = true;
      isValid = false;
    }

    if (!selectedDemands.length) {
      newErrors.selectedDemands = true;
      isValid = false;
    }

    if (!eventDate) {
      newErrors.eventDate = true;
      isValid = false;
    }

    return { isValid, newErrors };
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
        location: "",
        postType: "demand",
        tags: [],
        authorId: currentUser.uid,
        isDraft: false,
        email,
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
      }

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
        eventDescription,
        eventName,
        eventType,
        content: "",
        location: "",
        postType: "demand",
        tags: [],
        authorId: currentUser.uid,
        isDraft: true,
        email,
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
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center", // 垂直方向置中
                    mb: 3,
                  }}
                >
                  <Box
                    component="img"
                    src="/image/findsponsor.png"
                    alt="find sponsor"
                    sx={{ width: 80, height: 80, mb: 1 }} // 更大圖，並與文字留一點距離
                  />
                  <Typography variant="h5" fontWeight="bold">
                    發布需求文章
                  </Typography>
                </Box>
              </Typography>
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

              {/* ➤ 需求物資區塊 */}
              <Box
                ref={demandsRef}
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <InventoryIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="h6">選擇你需要的資源</Typography>
                </Box>
                <Autocomplete
                  multiple
                  options={demandItems}
                  value={selectedDemands}
                  onChange={(_, newValue) => setSelectedDemands(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="請選擇需求物資"
                      placeholder="選擇需求物資"
                      error={errors.selectedDemands}
                      helperText={
                        errors.selectedDemands ? "請選擇至少一項需求物資" : ""
                      }
                    />
                  )}
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="需求物資說明"
                  placeholder="請輸入需求物資的詳細說明"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={demandDescription}
                  onChange={(e) => setDemandDescription(e.target.value)}
                />
              </Box>

              {/* ➤ 回饋方案 */}
              <Box
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <RedeemIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="h6">說明你的回饋方式</Typography>
                </Box>
                <TextField
                  fullWidth
                  label="回饋方案"
                  placeholder="請輸入回饋方案（可換行）"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={cooperationReturn}
                  onChange={(e) => setCooperationReturn(e.target.value)}
                />
              </Box>

              {/* ➤ 活動資訊 */}
              <Box
                ref={eventDateRef}
                sx={{
                  backgroundColor: "#f9f9f9",
                  p: 2,
                  borderRadius: 2,
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <EventIcon sx={{ mr: 1, color: "#1976d2" }} />
                  <Typography variant="h6">活動資訊</Typography>
                </Box>
                <TextField
                  fullWidth
                  label="活動名稱"
                  variant="standard"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  sx={{ mb: 3 }}
                />

                <Autocomplete
                  options={eventTypes}
                  value={eventType}
                  onChange={(_, newValue) => setEventType(newValue ?? "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="活動性質"
                      variant="standard"
                      sx={{ mb: 3 }}
                    />
                  )}
                />
                <TextField
                  fullWidth
                  label="活動預估人數 "
                  variant="standard"
                  type="number"
                  value={estimatedParticipants}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (value > 0 || e.target.value === "") {
                      setEstimatedParticipants(e.target.value);
                    }
                  }}
                  // 使用標準 HTML input 屬性限制最小值
                  inputProps={{ min: 1 }}
                  sx={{ mb: 3 }}
                  required
                  error={
                    parseInt(estimatedParticipants) <= 0 &&
                    estimatedParticipants !== ""
                  }
                  helperText={
                    parseInt(estimatedParticipants) <= 0 &&
                    estimatedParticipants !== ""
                      ? "人數必須大於0"
                      : ""
                  }
                />
                <TextField
                  fullWidth
                  label="活動日期 "
                  type="date"
                  // 替換棄用的 InputLabelProps
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  sx={{ mb: 3 }}
                  error={errors.eventDate}
                  helperText={errors.eventDate ? "活動日期為必填項目" : ""}
                  required
                />
              </Box>

              {/* ➤ 活動說明 */}
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
                  <Typography variant="h6">補充說明</Typography>
                </Box>
                <TextField
                  fullWidth
                  label="說明"
                  placeholder="請輸入補充資料"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                />
              </Box>

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
