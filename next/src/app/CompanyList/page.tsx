"use client";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { companyServices } from "../../firebase/services";
import type { Company } from "../../firebase/services/company-service";

// 可折疊行元件
function CollapsibleRow({
  company,
  formatDate,
}: {
  company: Company;
  formatDate: (timestamp: string | null | undefined) => string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TableRow
        sx={{
          "&:hover": {
            backgroundColor: (theme) => theme.palette.action.hover,
          },
          cursor: "pointer",
          "& > *": { borderBottom: "unset" },
        }}
        onClick={() => setOpen(!open)}
      >
        <TableCell component="th" scope="row">
          {company.companyName}
        </TableCell>
        <TableCell>{company.businessId}</TableCell>
        <TableCell>{company.industryType}</TableCell>
        <TableCell>{company.contactName}</TableCell>
        <TableCell>
          <Box
            sx={{
              display: "inline-block",
              px: 1,
              py: 0.5,
              borderRadius: 1,
              backgroundColor:
                company.status === "approved"
                  ? "#e6f7e6"
                  : company.status === "rejected"
                  ? "#ffebee"
                  : "#fff8e1",
              color:
                company.status === "approved"
                  ? "#388e3c"
                  : company.status === "rejected"
                  ? "#d32f2f"
                  : "#f57c00",
            }}
          >
            {company.status === "approved"
              ? "已核准"
              : company.status === "rejected"
              ? "已拒絕"
              : "審核中"}
          </Box>
        </TableCell>
        <TableCell>{formatDate(company.registrationDate)}</TableCell>
        <TableCell padding="checkbox">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, py: 2 }}>
              <Typography variant="h6" gutterBottom component="div">
                詳細資訊
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                  },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    聯絡電話
                  </Typography>
                  <Typography variant="body1">
                    {company.contactPhone || "未填寫"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    電子郵件
                  </Typography>
                  <Typography variant="body1">
                    {company.email || "未填寫"}
                  </Typography>
                </Box>
              </Box>

              {company.companyDescription && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    公司簡介
                  </Typography>
                  <Typography variant="body1">
                    {company.companyDescription}
                  </Typography>
                </Box>
              )}

              <Button
                variant="contained"
                size="small"
                sx={{ mt: 1 }}
                disabled={company.status !== "approved"}
              >
                查看合作方案
              </Button>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<{ status: string }>({
    status: "連線中...",
  });

  // 從 Firebase 獲取公司資料
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        console.log("從 Firebase 獲取公司資料...");

        // 檢查 Firebase 連線狀態
        try {
          // 增加延遲以確保頁面完全載入且 Firebase 初始化
          await new Promise((resolve) => setTimeout(resolve, 500));

          const companiesData = await companyServices.getAllCompanies();
          console.log("獲取的公司數量:", companiesData.length);
          setCompanies(companiesData);
          setFirebaseStatus({
            status: "連線正常",
          });
        } catch (fetchErr) {
          console.error("Firebase 資料獲取失敗:", fetchErr);
          setFirebaseStatus({
            status: "連線失敗",
          });

          // 提供更詳細的錯誤信息
          let errorMessage = "無法從 Firebase 獲取資料";
          if (fetchErr instanceof Error) {
            errorMessage = `Firebase 錯誤: ${fetchErr.message}`;
          }
          setError(errorMessage);
          // 如果是認證錯誤，給出更具體的提示
          if (
            fetchErr instanceof Error &&
            fetchErr.message.includes("permission-denied")
          ) {
            setError(
              "您沒有訪問此數據的權限。請確保您已登入並有權訪問公司數據。"
            );
          }
        }
      } catch (err) {
        console.error("獲取公司資料時發生錯誤:", err);

        let errorMessage = "資料載入失敗";
        if (err instanceof Error) {
          errorMessage = `資料載入失敗: ${err.message}`;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    // 設定延遲等待組件完全掛載
    const timer = setTimeout(() => {
      fetchCompanies();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Format date for display
  const formatDate = (timestamp: string | null | undefined) => {
    if (!timestamp) return "N/A";

    try {
      // Parse ISO date string
      return new Date(timestamp).toLocaleDateString("zh-TW");
    } catch (err) {
      return "無效日期";
    }
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          pt: "64px",
          minHeight: "calc(100vh - 64px)",
          backgroundColor: "#f2f2f7",
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 4 },
          }}
        >
          <Container maxWidth="md" sx={{ pb: 5 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3, md: 4 },
                mb: 4,
                borderRadius: 3,
                border: "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.06)",
              }}
            >
              <Box>
                <Typography
                  variant="h4"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    color: (theme) => theme.palette.primary.main,
                  }}
                >
                  公司列表
                </Typography>
                <Divider sx={{ my: 2 }} />
              </Box>

              {/* Firebase 狀態顯示 */}
              <Alert
                severity={
                  firebaseStatus.status === "連線正常" ? "info" : "warning"
                }
                sx={{ mb: 3 }}
              >
                Firebase 狀態: {firebaseStatus.status}
              </Alert>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box sx={{ textAlign: "center", my: 5 }}>
                  <Alert severity="error">{error}</Alert>
                </Box>
              ) : companies.length === 0 ? (
                <Box sx={{ textAlign: "center", my: 5 }}>
                  <Typography>目前沒有公司資料</Typography>
                </Box>
              ) : (
                <TableContainer sx={{ borderRadius: 2 }}>
                  <Table aria-label="公司列表">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: (theme) => theme.palette.grey[50],
                        }}
                      >
                        <TableCell>公司名稱</TableCell>
                        <TableCell>統一編號</TableCell>
                        <TableCell>產業類型</TableCell>
                        <TableCell>聯絡人</TableCell>
                        <TableCell>狀態</TableCell>
                        <TableCell>註冊日期</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {companies.map((company) => (
                        <CollapsibleRow
                          key={company.id}
                          company={company}
                          formatDate={formatDate}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Container>
        </Box>
      </Box>
    </>
  );
}
