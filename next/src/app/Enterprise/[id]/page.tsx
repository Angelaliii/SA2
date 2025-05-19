"use client";

import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import EmailIcon from "@mui/icons-material/Email";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Link as MuiLink,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import { auth, db } from "../../../firebase/config";
import { companyServices } from "../../../firebase/services/company-service";
import enterpriseService from "../../../firebase/services/enterprise-service";
import useHydration from "../../../hooks/useHydration";

interface EnterprisePost {
  id: string;
  title: string;
  companyName?: string;
  email?: string;
  content?: string;
  createdAt?: string | Date;
  status?: string;
  authorId?: string;
  announcementType?:
    | "specialOfferPartnership"
    | "activityCooperation"
    | "internshipCooperation";

  // 聯繫窗口（共用）
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  // 特約商店/行銷推廣特有欄位
  partnershipName?: string; // 特約商店名稱
  contractPeriodDuration?: string; // 合約期限
  marketingProductName?: string;
  marketingPeriodStart?: string;
  marketingPeriodEnd?: string;

  // 活動合作特有欄位
  activityName?: string;
  activityType?: string;
  activityStartDate?: string;
  activityEndDate?: string;
  activityDateTime?: string;
  activityLocation?: string;
  cooperationPurpose?: string;
  cooperationType?: string;
  partnerRequirements?: string;
  applicationDeadline?: string;
  documentURL?: string;

  // 實習合作特有欄位
  internshipTitle?: string;
  internshipDepartment?: string;
  internshipPeriod?: string;
  weeklyHours?: number | string;
  workLocation?: string;
  salary?: string;
  jobDescription?: string;
  requirements?: string;
  benefits?: string;
  internshipPositions?: number | string;
  internshipApplicationDeadline?: string;
  interviewMethod?: string;
  additionalDocumentURL?: string;
}

export default function EnterpriseDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [post, setPost] = useState<EnterprisePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();
  const hydrated = useHydration();

  // 更新頁面標題
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} - 企業牆`;
    } else {
      document.title = "企業牆 - 社團企業媒合平台";
    }
  }, [post]);

  // 維持企業用戶的身份狀態，確保從詳情頁返回列表頁時不會丟失狀態
  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const companies = await companyServices.getCompaniesByUserId(
            user.uid
          );
          if (companies.length > 0 && typeof window !== "undefined") {
            sessionStorage.setItem("isCompanyUser", "true");
          }
        } catch (error) {
          console.error("檢查企業用戶時出錯:", error);
        }
      }
    };

    checkUserRole();
  }, []);

  // 檢查用戶是否已收藏該文章
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (!auth.currentUser || !id) return;

      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", auth.currentUser.uid),
          where("articleId", "==", id)
        );

        const snapshot = await getDocs(q);
        setIsFavorite(!snapshot.empty);
      } catch (error) {
        console.error("Error checking favorite status:", error);
      }
    };

    checkFavoriteStatus();
  }, [id]);

  // 獲取文章詳情 - 使用 enterpriseService 來獲取資料
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const postData = await enterpriseService.getPostById(id);
        if (postData) {
          setPost({
            id: postData.id ?? id,
            title: postData.title || "無標題",
            companyName: postData.companyName ?? "未知企業",
            email: postData.email ?? "",
            content: postData.content || "",
            createdAt: postData.createdAt || new Date(),
            status: postData.status || "active",
            authorId: postData.authorId,
            announcementType: postData.announcementType,
            // 聯繫窗口
            contactName: postData.contactName,
            contactPhone: postData.contactPhone,
            contactEmail: postData.contactEmail,

            // 特約商店/行銷推廣
            partnershipName: postData.partnershipName,
            contractPeriodDuration: postData.contractPeriodDuration,

            // 活動合作
            activityName: postData.activityName,
            activityType: postData.activityType,
            activityStartDate: postData.activityStartDate,
            activityEndDate: postData.activityEndDate,
            activityLocation: postData.activityLocation,
            cooperationType: postData.cooperationType,
            partnerRequirements: postData.partnerRequirements,
            applicationDeadline: postData.applicationDeadline,
            documentURL: postData.documentURL,

            // 實習合作
            internshipTitle: postData.internshipTitle,
            internshipDepartment: postData.internshipDepartment,
            internshipPeriod: postData.internshipPeriod,
            weeklyHours: postData.weeklyHours,
            workLocation: postData.workLocation,
            salary: postData.salary,
            jobDescription: postData.jobDescription,
            requirements: postData.requirements,
            internshipPositions: postData.internshipPositions,
            internshipApplicationDeadline:
              postData.internshipApplicationDeadline,
            interviewMethod: postData.interviewMethod,
            additionalDocumentURL: postData.additionalDocumentURL,
            benefits: postData.benefits,
          });
        } else {
          console.error("Post not found");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // 處理收藏功能
  const handleToggleFavorite = async () => {
    if (!auth.currentUser) {
      setSnackbarMessage("請先登入後再進行收藏");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    if (!id || !post) return;

    setFavoriteLoading(true);

    try {
      const userId = auth.currentUser.uid;

      // 檢查是否已收藏
      const q = query(
        collection(db, "favorites"),
        where("userId", "==", userId),
        where("articleId", "==", id)
      );

      const snapshot = await getDocs(q);

      // 目前未收藏，進行收藏
      if (snapshot.empty) {
        const favoriteData = {
          userId,
          articleId: id,
          postType: "enterprise",
          title: post.title,
          companyName: post.companyName,
          content: post.content,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(collection(db, "favorites")), favoriteData);
        setIsFavorite(true);
        setSnackbarMessage("已成功加入收藏！");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
      // 已收藏，取消收藏
      else {
        const docToDelete = snapshot.docs[0];
        await deleteDoc(doc(db, "favorites", docToDelete.id));
        setIsFavorite(false);
        setSnackbarMessage("已取消收藏");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("收藏操作失敗:", error);
      setSnackbarMessage("操作失敗，請稍後再試");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatDate = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return "無日期";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return "日期格式錯誤";
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navbar />
        <Container>
          <Box sx={{ pt: "84px", textAlign: "center", py: 8 }}>
            <Typography variant="h5" color="text.secondary" gutterBottom>
              找不到文章
            </Typography>{" "}
            <Button
              variant="contained"
              color="primary"
              component={MuiLink}
              href="/Enterprise/EnterpriseList"
              sx={{ mt: 2 }}
            >
              返回列表
            </Button>
          </Box>
        </Container>
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
            {/* 標題與企業資訊 */}
            <Box sx={{ textAlign: "center", mb: 4, position: "relative" }}>
              <Typography
                variant="h4"
                gutterBottom
                fontWeight="bold"
                color="primary"
              >
                {post.title}
              </Typography>{" "}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                }}
              >
                <BusinessIcon sx={{ mr: 1, color: "text.secondary" }} />
                {post.authorId ? (
                  <Link
                    href={`/public-profile/${post.authorId}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Typography
                      variant="h6"
                      color="primary"
                      sx={{
                        cursor: "pointer",
                        fontWeight: "medium",
                        "&:hover": { textDecoration: "underline" },
                      }}
                    >
                      {post.companyName}
                    </Typography>
                  </Link>
                ) : (
                  <Typography variant="h6" color="text.secondary">
                    {post.companyName}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                發布時間：{hydrated ? formatDate(post.createdAt) : "載入中..."}
              </Typography>
            </Box>{" "}
            {/* 收藏按鈕 */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                variant={isFavorite ? "contained" : "outlined"}
                color="error"
                onClick={handleToggleFavorite}
                disabled={favoriteLoading}
                size="small"
                startIcon={
                  isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />
                }
                sx={{
                  borderRadius: 4,
                  px: 2,
                  boxShadow: isFavorite ? 2 : 0,
                  "&:hover": {
                    boxShadow: 1,
                  },
                }}
              >
                {isFavorite ? "已收藏" : "收藏"}
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            {/* 根據公告類型顯示特定欄位 */}
            {post.announcementType && (
              <Box sx={{ mb: 4 }}>
                {/* 特約商店特有欄位 */}
                {post.announcementType === "specialOfferPartnership" && (
                  <Box
                    sx={{
                      backgroundColor: "#f2f9ff",
                      p: 3,
                      borderRadius: 2,
                      border: "1px solid #d0e8ff",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "#1976d2",
                        borderBottom: "1px solid #d0e8ff",
                        pb: 1,
                      }}
                    >
                      特約商店資訊
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          特約商店名稱
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {post.partnershipName ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          合約期限
                        </Typography>
                        <Typography variant="body1">
                          {post.contractPeriodDuration ?? "未提供"}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* 活動合作特有欄位 */}
                {post.announcementType === "activityCooperation" && (
                  <Box
                    sx={{
                      backgroundColor: "#f6f9ff",
                      p: 3,
                      borderRadius: 2,
                      border: "1px solid #d6e4ff",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "#3f51b5",
                        borderBottom: "1px solid #d6e4ff",
                        pb: 1,
                      }}
                    >
                      活動合作資訊
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          活動名稱
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {post.activityName ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          活動類型
                        </Typography>
                        <Typography variant="body1">
                          {post.activityType ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          活動開始日期
                        </Typography>
                        <Typography variant="body1">
                          {post.activityStartDate
                            ? new Date(
                                post.activityStartDate
                              ).toLocaleDateString()
                            : "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          活動結束日期
                        </Typography>
                        <Typography variant="body1">
                          {post.activityEndDate
                            ? new Date(
                                post.activityEndDate
                              ).toLocaleDateString()
                            : "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          活動地點
                        </Typography>
                        <Typography variant="body1">
                          {post.activityLocation ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          申請截止日期
                        </Typography>
                        <Typography variant="body1">
                          {post.applicationDeadline
                            ? new Date(
                                post.applicationDeadline
                              ).toLocaleDateString()
                            : "未提供"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 2,
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          合作方式
                        </Typography>
                        <Typography variant="body1">
                          {post.cooperationType ?? "未提供"}
                        </Typography>
                      </Box>

                      {post.documentURL && (
                        <Box>
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                          >
                            相關文件
                          </Typography>{" "}
                          <MuiLink
                            href={post.documentURL}
                            target="_blank"
                            rel="noopener"
                          >
                            查看文件
                          </MuiLink>
                        </Box>
                      )}
                    </Box>

                    {post.partnerRequirements && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          徵求合作對象條件
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: "pre-line" }}
                        >
                          {post.partnerRequirements}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 實習合作特有欄位 */}
                {post.announcementType === "internshipCooperation" && (
                  <Box
                    sx={{
                      backgroundColor: "#f5fcf9",
                      p: 3,
                      borderRadius: 2,
                      border: "1px solid #d5f2ea",
                      mb: 3,
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        color: "#2e7d32",
                        borderBottom: "1px solid #d5f2ea",
                        pb: 1,
                      }}
                    >
                      實習合作資訊
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 2,
                        mb: 3,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          實習職缺名稱
                        </Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {post.internshipTitle ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          實習部門
                        </Typography>
                        <Typography variant="body1">
                          {post.internshipDepartment ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          實習期間
                        </Typography>
                        <Typography variant="body1">
                          {post.internshipPeriod ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          每週工作時數
                        </Typography>
                        <Typography variant="body1">
                          {post.weeklyHours ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          薪資待遇
                        </Typography>
                        <Typography variant="body1">
                          {post.salary ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          工作地點
                        </Typography>
                        <Typography variant="body1">
                          {post.workLocation ?? "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          申請截止日期
                        </Typography>
                        <Typography variant="body1">
                          {post.internshipApplicationDeadline
                            ? new Date(
                                post.internshipApplicationDeadline
                              ).toLocaleDateString()
                            : "未提供"}
                        </Typography>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          面試方式
                        </Typography>
                        <Typography variant="body1">
                          {post.interviewMethod ?? "未提供"}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        職務內容
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          whiteSpace: "pre-line",
                          bgcolor: "white",
                          p: 1.5,
                          borderRadius: 1,
                        }}
                      >
                        {post.jobDescription ?? "未提供"}
                      </Typography>
                    </Box>

                    {post.requirements && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          應徵條件
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: "pre-line" }}
                        >
                          {post.requirements}
                        </Typography>
                      </Box>
                    )}

                    {post.benefits && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          實習福利
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{ whiteSpace: "pre-line" }}
                        >
                          {post.benefits}
                        </Typography>
                      </Box>
                    )}

                    {post.additionalDocumentURL && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          附加說明文件
                        </Typography>{" "}
                        <MuiLink
                          href={post.additionalDocumentURL}
                          target="_blank"
                          rel="noopener"
                        >
                          查看文件
                        </MuiLink>
                      </Box>
                    )}
                  </Box>
                )}

                {/* 聯繫窗口資訊 */}
                <Box
                  sx={{
                    backgroundColor: "#f8f9fa",
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ borderBottom: "1px solid #e0e0e0", pb: 1 }}
                  >
                    聯繫窗口資訊
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        聯繫人姓名
                      </Typography>
                      <Typography variant="body1">
                        {post.contactName ?? "未提供"}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        聯繫電話
                      </Typography>
                      <Typography variant="body1">
                        {post.contactPhone ?? "未提供"}
                      </Typography>
                    </Box>

                    {post.email && (
                      <Box>
                        {" "}
                        <Typography variant="subtitle2" color="text.secondary">
                          電子郵件
                        </Typography>
                        <MuiLink href={`mailto:${post.email}`}>
                          {post.email}
                        </MuiLink>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            )}
            <Divider sx={{ mb: 3 }} />
            {/* 內容區 */}
            <Box
              sx={{
                backgroundColor: "#f9f9f9",
                p: 3,
                borderRadius: 2,
                mb: 4,
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                color="primary"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <DescriptionIcon />
                合作內容
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: "pre-line",
                  minHeight: "100px",
                  bgcolor: "background.paper",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                {post.content ?? "尚無合作內容說明"}
              </Typography>
            </Box>
            {/* 聯絡按鈕和返回列表按鈕 */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 4,
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                href="/Enterprise/EnterpriseList"
              >
                返回列表
              </Button>

              {post.email ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmailIcon />}
                  href={`mailto:${post.email}`}
                >
                  聯絡企業
                </Button>
              ) : (
                <Typography color="text.secondary">
                  此企業尚未提供聯絡方式
                </Typography>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>{" "}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
