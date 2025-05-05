"use client";

import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EnterpriseDeleteDraftDialog from "../../components/article/EnterpriseDeleteDraftDialog";
import EnterpriseDraftManager from "../../components/article/EnterpriseDraftManager";
import LoginPrompt from "../../components/LoginPromp";
import Navbar from "../../components/Navbar";
import { auth } from "../../firebase/config";
import { companyServices } from "../../firebase/services";
import enterpriseService from "../../firebase/services/enterprise-service";

export default function EnterprisePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [companyEmail, setCompanyEmail] = useState<string>("");
  const [isDraft, setIsDraft] = useState<boolean>(false);

  // 草稿相關狀態
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // 新增公告類型與相關欄位狀態
  const [announcementType, setAnnouncementType] = useState<
    "marketing" | "activity" | "internship" | ""
  >("");

  // 行銷推廣相關狀態
  const [marketingProductName, setMarketingProductName] = useState<string>("");
  const [marketingPeriodStart, setMarketingPeriodStart] = useState<string>("");
  const [marketingPeriodEnd, setMarketingPeriodEnd] = useState<string>("");

  // 聯繫窗口（共用）
  const [contactName, setContactName] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  // 活動合作相關狀態
  const [activityName, setActivityName] = useState<string>("");
  const [activityType, setActivityType] = useState<string>("");
  const [activityDateTime, setActivityDateTime] = useState<string>("");
  const [activityLocation, setActivityLocation] = useState<string>("");
  const [cooperationPurpose, setCooperationPurpose] = useState<string>("");
  const [cooperationType, setCooperationType] = useState<string>("");
  const [partnerRequirements, setPartnerRequirements] = useState<string>("");
  const [documentURL, setDocumentURL] = useState<string>("");

  // 實習合作相關狀態
  const [internshipTitle, setInternshipTitle] = useState<string>("");
  const [internshipDepartment, setInternshipDepartment] = useState<string>("");
  const [internshipPeriod, setInternshipPeriod] = useState<string>("");
  const [weeklyHours, setWeeklyHours] = useState<number | "">("");
  const [workLocation, setWorkLocation] = useState<string>("");
  const [salary, setSalary] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [requirements, setRequirements] = useState<string>("");
  const [benefits, setBenefits] = useState<string>("");
  const [applicationDeadline, setApplicationDeadline] = useState<string>("");
  const [interviewMethod, setInterviewMethod] = useState<string>("");
  const [additionalDocumentURL, setAdditionalDocumentURL] =
    useState<string>("");

  // 活動類型選項
  const activityTypeOptions = ["演講", "工作坊", "展覽", "比賽", "其他"];
  // 合作方式選項
  const cooperationTypeOptions = [
    "贊助",
    "場地提供",
    "技術支援",
    "媒體宣傳",
    "其他",
  ];
  // 面試方式選項
  const interviewMethodOptions = [
    "線上面試",
    "實體面試",
    "電話面試",
    "專案測試",
    "多輪面試",
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setIsLoggedIn(!!user);

      if (user) {
        try {
          const companies = await companyServices.getCompaniesByUserId(
            user.uid
          );
          if (companies && companies.length > 0) {
            setCompanyName(companies[0].companyName);
            setCompanyEmail(companies[0].email ?? user.email ?? "");
          }
        } catch (error) {
          console.error("Error fetching company info:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 載入用戶草稿
  const loadUserDrafts = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoadingDrafts(true);
    try {
      const userDrafts = await enterpriseService.getUserDrafts(currentUser.uid);
      setDrafts(userDrafts);
    } catch (error) {
      console.error("載入草稿失敗:", error);
      setSnackbarMessage("載入草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // 點擊查看草稿按鈕時載入草稿
  useEffect(() => {
    if (openDraftsDialog) {
      loadUserDrafts();
    }
  }, [openDraftsDialog]);

  // 載入選擇的草稿
  const handleLoadDraft = async (draftId: string) => {
    setLoadingDrafts(true);
    try {
      const draft = await enterpriseService.getPostById(draftId);
      if (draft) {
        // 設置基本欄位
        setTitle(draft.title);
        setContent(draft.content);
        setCurrentDraftId(draftId);

        // 設置公告類型
        if (draft.announcementType) {
          setAnnouncementType(draft.announcementType);
        }

        // 設置共用欄位
        setContactName(draft.contactName || "");
        setContactPhone(draft.contactPhone || "");

        // 根據公告類型設置特定欄位
        if (draft.announcementType === "marketing") {
          setMarketingProductName(draft.marketingProductName || "");
          setMarketingPeriodStart(draft.marketingPeriodStart || "");
          setMarketingPeriodEnd(draft.marketingPeriodEnd || "");
        } else if (draft.announcementType === "activity") {
          setActivityName(draft.activityName || "");
          setActivityType(draft.activityType || "");
          setActivityDateTime(draft.activityDateTime || "");
          setActivityLocation(draft.activityLocation || "");
          setCooperationPurpose(draft.cooperationPurpose || "");
          setCooperationType(draft.cooperationType || "");
          setPartnerRequirements(draft.partnerRequirements || "");
          setDocumentURL(draft.documentURL || "");
        } else if (draft.announcementType === "internship") {
          setInternshipTitle(draft.internshipTitle || "");
          setInternshipDepartment(draft.internshipDepartment || "");
          setInternshipPeriod(draft.internshipPeriod || "");
          setWeeklyHours(draft.weeklyHours || "");
          setWorkLocation(draft.workLocation || "");
          setSalary(draft.salary || "");
          setJobDescription(draft.jobDescription || "");
          setRequirements(draft.requirements || "");
          setBenefits(draft.benefits || "");
          setApplicationDeadline(draft.applicationDeadline || "");
          setInterviewMethod(draft.interviewMethod || "");
          setAdditionalDocumentURL(draft.additionalDocumentURL || "");
        }

        setOpenDraftsDialog(false);
      }
    } catch (error) {
      console.error("載入草稿失敗:", error);
      setSnackbarMessage("載入草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoadingDrafts(false);
    }
  };

  // 刪除草稿
  const handleDeleteDraft = async () => {
    if (!draftToDelete) return;

    try {
      await enterpriseService.deletePost(draftToDelete);
      setDrafts(drafts.filter((draft) => draft.id !== draftToDelete));
      setSnackbarMessage("草稿已刪除");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("刪除草稿失敗:", error);
      setSnackbarMessage("刪除草稿失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setOpenDeleteDialog(false);
      setDraftToDelete(null);
    }
  };

  const handleSubmit = async (isDraftParam: boolean = false) => {
    // Validate required fields based on announcement type
    if (!title || !content) {
      setSnackbarMessage("請填寫標題和內容");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    if (announcementType === "marketing") {
      if (
        !marketingProductName ||
        !marketingPeriodStart ||
        !marketingPeriodEnd ||
        !contactName ||
        !contactPhone
      ) {
        setSnackbarMessage("請填寫所有行銷推廣必填欄位");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
    } else if (announcementType === "activity") {
      if (
        !activityName ||
        !activityType ||
        !activityDateTime ||
        !activityLocation ||
        !cooperationPurpose ||
        !contactName ||
        !contactPhone
      ) {
        setSnackbarMessage("請填寫所有活動合作必填欄位");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
    } else if (announcementType === "internship") {
      if (
        !internshipTitle ||
        !internshipDepartment ||
        !internshipPeriod ||
        !workLocation ||
        !jobDescription ||
        !applicationDeadline ||
        !contactName ||
        !contactPhone
      ) {
        setSnackbarMessage("請填寫所有實習合作必填欄位");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("尚未登入");

      // 建立基本資料
      const postData: any = {
        title,
        content,
        authorId: currentUser.uid,
        companyName,
        email: companyEmail,
        createdAt: new Date().toISOString(),
        status: "active" as const,
        postType: "enterprise" as const,
        isDraft: isDraftParam, // 使用函數參數而非組件狀態
        announcementType,
        contactName,
        contactPhone,
      };

      // 根據公告類型加入特定欄位
      if (announcementType === "marketing") {
        postData.marketingProductName = marketingProductName;
        postData.marketingPeriodStart = marketingPeriodStart;
        postData.marketingPeriodEnd = marketingPeriodEnd;
      } else if (announcementType === "activity") {
        postData.activityName = activityName;
        postData.activityType = activityType;
        postData.activityDateTime = activityDateTime;
        postData.activityLocation = activityLocation;
        postData.cooperationPurpose = cooperationPurpose;
        postData.cooperationType = cooperationType;
        postData.partnerRequirements = partnerRequirements;
        postData.documentURL = documentURL;
      } else if (announcementType === "internship") {
        postData.internshipTitle = internshipTitle;
        postData.internshipDepartment = internshipDepartment;
        postData.internshipPeriod = internshipPeriod;
        // Convert empty string to undefined, or string to number
        postData.weeklyHours =
          weeklyHours === ""
            ? undefined
            : typeof weeklyHours === "string"
            ? Number(weeklyHours)
            : weeklyHours;
        postData.workLocation = workLocation;
        postData.salary = salary;
        postData.jobDescription = jobDescription;
        postData.requirements = requirements;
        postData.benefits = benefits;
        postData.applicationDeadline = applicationDeadline;
        postData.interviewMethod = interviewMethod;
        postData.additionalDocumentURL = additionalDocumentURL;
      }

      if (currentDraftId) {
        // 如果是編輯現有草稿，則更新該草稿
        await enterpriseService.updatePost(currentDraftId, postData);
        if (!isDraftParam) {
          // 使用函數參數
          // 如果不是儲存為草稿，則發布
          await enterpriseService.publishDraft(currentDraftId);
        }
        setSnackbarMessage(isDraftParam ? "草稿已更新！" : "草稿已成功發布！"); // 使用函數參數
      } else {
        // 創建新文章
        const result = await enterpriseService.createPost(postData);
        if (result.success) {
          setSnackbarMessage(isDraftParam ? "草稿儲存成功！" : "發布成功！"); // 使用函數參數
        } else {
          throw new Error(isDraftParam ? "儲存草稿失敗" : "發布失敗"); // 使用函數參數
        }
      }

      setSnackbarSeverity("success");

      // 清空表單
      setTitle("");
      setContent("");
      setAnnouncementType("");
      setMarketingProductName("");
      setMarketingPeriodStart("");
      setMarketingPeriodEnd("");
      setContactName("");
      setContactPhone("");
      setActivityName("");
      setActivityType("");
      setActivityDateTime("");
      setActivityLocation("");
      setCooperationPurpose("");
      setCooperationType("");
      setPartnerRequirements("");
      setDocumentURL("");
      setInternshipTitle("");
      setInternshipDepartment("");
      setInternshipPeriod("");
      setWeeklyHours("");
      setWorkLocation("");
      setSalary("");
      setJobDescription("");
      setRequirements("");
      setBenefits("");
      setApplicationDeadline("");
      setInterviewMethod("");
      setAdditionalDocumentURL("");

      setCurrentDraftId(null);

      // 僅在非草稿時跳轉
      if (!isDraftParam) {
        // 使用函數參數
        router.push("/Enterprise/EnterpriseList");
      }
    } catch (error) {
      console.error("發布失敗:", error);
      setSnackbarMessage(
        error instanceof Error ? error.message : "發布失敗，請稍後再試"
      );
      setSnackbarSeverity("error");
    }
    setOpenSnackbar(true);
  };

  if (isLoggedIn === false) {
    return (
      <>
        <Navbar />
        <LoginPrompt />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          pt: "84px",
          pb: 8,
          minHeight: "100vh",
          backgroundColor: "#f5f7fa",
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 2,
              backgroundColor: "white",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            {" "}
            <Typography
              variant="h4"
              fontWeight="bold"
              gutterBottom
              align="center"
              color="primary"
              sx={{ mt: 2 }}
            >
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
                  src="/image/things.png"
                  alt="enterprise post"
                  sx={{ width: 80, height: 80, mb: 1 }}
                />
                <Typography variant="h5" fontWeight="bold" color="black">
                  發布企業公告
                </Typography>
              </Box>
            </Typography>
            <Divider sx={{ mb: 4 }} />
            <Box sx={{ mb: 3, px: 1 }}>
              <Typography variant="body2" color="text.secondary">
                * 表示必填欄位
              </Typography>
            </Box>{" "}
            {/* 發布者資訊 */}
            <Box
              sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <BusinessIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6">企業資訊</Typography>
              </Box>
              <TextField
                fullWidth
                label="公司名稱"
                value={companyName}
                disabled
                sx={{ mb: 2 }}
                variant="standard"
                // Use slotProps instead of InputProps
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
              />
              <TextField
                fullWidth
                label="聯絡信箱"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                type="email"
                sx={{ mb: 2 }}
                variant="standard"
                helperText="此信箱將作為合作洽談的主要聯絡方式"
              />
            </Box>{" "}
            {/* 公告內容區塊 */}
            <Box
              sx={{ backgroundColor: "#f9f9f9", p: 2, borderRadius: 2, mb: 3 }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <DescriptionIcon sx={{ mr: 1, color: "#1976d2" }} />
                <Typography variant="h6">公告內容</Typography>
              </Box>
              <TextField
                fullWidth
                label="標題"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mb: 3 }}
                required
                variant="standard"
                placeholder="請輸入能吸引目標合作對象的標題"
              />

              {/* 公告類型選擇 */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  sx={{ fontWeight: "medium" }}
                >
                  公告類型{" "}
                  <Box component="span" sx={{ color: "error.main" }}>
                    *
                  </Box>
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Button
                    variant={
                      announcementType === "marketing"
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => setAnnouncementType("marketing")}
                    sx={{ flex: 1 }}
                  >
                    行銷推廣
                  </Button>
                  <Button
                    variant={
                      announcementType === "activity" ? "contained" : "outlined"
                    }
                    onClick={() => setAnnouncementType("activity")}
                    sx={{ flex: 1 }}
                  >
                    活動合作
                  </Button>
                  <Button
                    variant={
                      announcementType === "internship"
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => setAnnouncementType("internship")}
                    sx={{ flex: 1 }}
                  >
                    實習合作
                  </Button>
                </Box>
              </Box>

              {/* 共用聯繫窗口欄位 */}
              {announcementType && (
                <Box sx={{ mb: 3, p: 2, bgcolor: "#f0f5ff", borderRadius: 1 }}>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: "medium" }}
                  >
                    聯繫窗口資訊 *
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="聯繫人姓名"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="聯繫電話"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              )}

              {/* 行銷推廣特有欄位 */}
              {announcementType === "marketing" && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "#1976d2",
                      borderBottom: "1px solid #e0e0e0",
                      pb: 1,
                    }}
                  >
                    行銷推廣資訊
                  </Typography>

                  <TextField
                    fullWidth
                    label="推廣產品/服務名稱"
                    value={marketingProductName}
                    onChange={(e) => setMarketingProductName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      label="推廣開始日期"
                      type="date"
                      value={marketingPeriodStart}
                      onChange={(e) => setMarketingPeriodStart(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="推廣結束日期"
                      type="date"
                      value={marketingPeriodEnd}
                      onChange={(e) => setMarketingPeriodEnd(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              )}

              {/* 活動合作特有欄位 */}
              {announcementType === "activity" && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "#1976d2",
                      borderBottom: "1px solid #e0e0e0",
                      pb: 1,
                    }}
                  >
                    活動合作資訊
                  </Typography>

                  <TextField
                    fullWidth
                    label="活動名稱"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      select
                      label="活動類型"
                      value={activityType}
                      onChange={(e) => setActivityType(e.target.value)}
                      required
                      SelectProps={{
                        native: true,
                      }}
                      sx={{ flex: 1 }}
                    >
                      <option value=""></option>
                      {activityTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>

                    <TextField
                      label="活動日期與時間"
                      type="datetime-local"
                      value={activityDateTime}
                      onChange={(e) => setActivityDateTime(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="活動地點"
                    value={activityLocation}
                    onChange={(e) => setActivityLocation(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="合作說明與目的"
                    value={cooperationPurpose}
                    onChange={(e) => setCooperationPurpose(e.target.value)}
                    required
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      select
                      label="合作方式"
                      value={cooperationType}
                      onChange={(e) => setCooperationType(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                      sx={{ flex: 1 }}
                    >
                      <option value=""></option>
                      {cooperationTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>

                    <TextField
                      label="相關文件連結"
                      value={documentURL}
                      onChange={(e) => setDocumentURL(e.target.value)}
                      placeholder="請輸入文件的URL連結"
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="徵求合作對象條件"
                    value={partnerRequirements}
                    onChange={(e) => setPartnerRequirements(e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />
                </Box>
              )}

              {/* 實習合作特有欄位 */}
              {announcementType === "internship" && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      color: "#1976d2",
                      borderBottom: "1px solid #e0e0e0",
                      pb: 1,
                    }}
                  >
                    實習合作資訊
                  </Typography>

                  <TextField
                    fullWidth
                    label="實習職缺名稱"
                    value={internshipTitle}
                    onChange={(e) => setInternshipTitle(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      label="實習部門"
                      value={internshipDepartment}
                      onChange={(e) => setInternshipDepartment(e.target.value)}
                      required
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      label="實習期間"
                      value={internshipPeriod}
                      onChange={(e) => setInternshipPeriod(e.target.value)}
                      required
                      placeholder="例：3個月/1學期"
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      label="每週工作時數"
                      type="number"
                      value={weeklyHours}
                      onChange={(e) =>
                        setWeeklyHours(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      inputProps={{ min: 0 }}
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      label="薪資待遇"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      placeholder="例：時薪165元/月薪25,000元"
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  <TextField
                    fullWidth
                    label="工作地點"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="職務內容"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    required
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="應徵條件"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    multiline
                    rows={2}
                    placeholder="例：科系、年級、技能等"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="實習福利"
                    value={benefits}
                    onChange={(e) => setBenefits(e.target.value)}
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />

                  <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                      label="申請截止日期"
                      type="date"
                      value={applicationDeadline}
                      onChange={(e) => setApplicationDeadline(e.target.value)}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />

                    <TextField
                      select
                      label="面試方式"
                      value={interviewMethod}
                      onChange={(e) => setInterviewMethod(e.target.value)}
                      SelectProps={{
                        native: true,
                      }}
                      sx={{ flex: 1 }}
                    >
                      <option value=""></option>
                      {interviewMethodOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </TextField>
                  </Box>

                  <TextField
                    fullWidth
                    label="附加說明文件連結"
                    value={additionalDocumentURL}
                    onChange={(e) => setAdditionalDocumentURL(e.target.value)}
                    placeholder="請輸入文件的URL連結"
                  />
                </Box>
              )}

              <TextField
                fullWidth
                label="內容"
                multiline
                rows={announcementType ? 4 : 8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                variant="outlined"
                placeholder="詳細描述合作內容、期望與條件"
              />
            </Box>{" "}
            {/* 按鈕區塊 */}{" "}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setOpenDraftsDialog(true)}
                size="large"
              >
                查看草稿
              </Button>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button
                  variant="outlined"
                  component={Link}
                  href="/Enterprise/EnterpriseList"
                  size="large"
                  sx={{ display: "none" }}
                >
                  返回列表
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(true)}
                  size="large"
                  color="secondary"
                >
                  儲存草稿
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit(false)}
                  size="large"
                  color="primary"
                >
                  發布公告
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>{" "}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
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
      <EnterpriseDraftManager
        open={openDraftsDialog}
        onClose={() => setOpenDraftsDialog(false)}
        drafts={drafts}
        loading={loadingDrafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={(draftId) => {
          setDraftToDelete(draftId);
          setOpenDeleteDialog(true);
        }}
      />
      {/* 刪除草稿確認對話框 */}
      <EnterpriseDeleteDraftDialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setDraftToDelete(null);
        }}
        onConfirm={handleDeleteDraft}
      />
    </>
  );
}
