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

import LoginPrompt from "../../components/LoginPromp";
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/config";
import * as postService from "../../firebase/services/post-service";
import Navbar from "../../components/Navbar";
import AssignmentIcon from "@mui/icons-material/Assignment";
import InventoryIcon from "@mui/icons-material/Inventory";
import RedeemIcon from "@mui/icons-material/Redeem";
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";


export default function DemandPostPage() {
  const [title, setTitle] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [demandItems, setDemandItems] = useState<string[]>([]);
  const [selectedDemands, setSelectedDemands] = useState<string[]>([]);
  const [demandDescription, setDemandDescription] = useState("");
  const [cooperationReturn, setCooperationReturn] = useState("");
  const [estimatedParticipants, setEstimatedParticipants] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
  
        const organization = await postService.getOrganizationName(user.uid);
        setOrganizationName(organization || "未知組織");
  
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
  };

  const handleSubmit = async () => {
    if (!title || !selectedDemands.length || !eventDate) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
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
        content: "",
        location: "",
        postType: "demand",
        tags: [],
        authorId: currentUser.uid,
        isDraft: false,
      };

      const result = await postService.createPost(postData);

      if (result.success) {
        setSnackbarMessage("文章發布成功");
        setSnackbarSeverity("success");
        clearForm();
      } else {
        throw new Error("發布失敗");
      }
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
        content: "",
        location: "",
        postType: "demand",
        tags: [],
        authorId: currentUser.uid,
        isDraft: true,
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
    window.location.href = "/post/drafts";
  };

  return (
    <>
      <Navbar />
  
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
  
            {/* ➤ 基本資訊區塊 */}
            <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6">填寫基本資訊</Typography>
              </Box>
              <TextField
                fullWidth
                label="標題"
                variant="standard"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                inputProps={{ maxLength: 80 }}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="組織名稱"
                variant="standard"
                value={organizationName}
                disabled
                sx={{ mb: 3 }}
              />
            </Box>
  
            {/* ➤ 需求物資區塊 */}
            <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
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
                  <TextField {...params} label="請選擇需求物資" placeholder="選擇需求物資" />
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
  
              <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <RedeemIcon  sx={{ mr: 1, color: "#1976d2" }} />
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
            <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <EventIcon  sx={{ mr: 1, color: "#1976d2" }} />
          
                <Typography variant="h6">補充活動資訊</Typography>
              </Box>
              <TextField
                fullWidth
                label="活動預估人數"
                variant="standard"
                value={estimatedParticipants}
                onChange={(e) => setEstimatedParticipants(e.target.value)}
                sx={{ mb: 3 }}
              />
              <TextField
                fullWidth
                label="活動日期"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                sx={{ mb: 3 }}
              />
            </Box>
  
            {/* ➤ 活動說明 */}
            
                <Box sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <InfoIcon  sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6">補充說明</Typography>
              </Box>
              <TextField
                fullWidth
                label="活動說明"
                placeholder="請輸入活動的詳細說明"
                multiline
                rows={4}
                variant="outlined"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
              />
            </Box>
  
            {/* ➤ 按鈕區塊 */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
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
    </>
  );
  }