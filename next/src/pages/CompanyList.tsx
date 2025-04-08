"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../assets/globals.module.css";
import Navbar from "../components/Navbar";
import { companyServices } from "../firebase/services";
import type { Company } from "../firebase/services/company-service";

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
    <div className={styles.page}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, mt: 4, mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h4">公司列表</Typography>
            <Button variant="contained" component={Link} href="/">
              返回首頁
            </Button>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Firebase 狀態顯示 */}
          <Alert
            severity={firebaseStatus.status === "連線正常" ? "info" : "warning"}
            sx={{ mb: 2 }}
          >
            Firebase 狀態: {firebaseStatus.status}
          </Alert>
          <Navbar />

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
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>公司名稱</TableCell>
                      <TableCell>統一編號</TableCell>
                      <TableCell>產業類型</TableCell>
                      <TableCell>聯絡人</TableCell>
                      <TableCell>狀態</TableCell>
                      <TableCell>註冊日期</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.companyName}</TableCell>
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
                        <TableCell>
                          {formatDate(company.registrationDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Typography variant="subtitle2" sx={{ mt: 4, mb: 2 }}>
                詳細資訊
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {companies.map((company) => (
                  <Card key={company.id} variant="outlined">
                    <CardContent>
                      <Typography variant="h6">
                        {company.companyName}
                      </Typography>
                      <Divider sx={{ my: 1 }} />

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(2, 1fr)",
                          gap: 2,
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            統一編號
                          </Typography>
                          <Typography variant="body1">
                            {company.businessId}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            產業類型
                          </Typography>
                          <Typography variant="body1">
                            {company.industryType}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            聯絡人
                          </Typography>
                          <Typography variant="body1">
                            {company.contactName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            聯絡電話
                          </Typography>
                          <Typography variant="body1">
                            {company.contactPhone}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            電子郵件
                          </Typography>
                          <Typography variant="body1">
                            {company.email}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            狀態
                          </Typography>
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

                      <Box sx={{ display: "flex", gap: 2 }}>
                        {company.logoURL && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              公司標誌
                            </Typography>
                            <Box sx={{ mt: 1, maxWidth: "100px" }}>
                              <img
                                src={company.logoURL}
                                alt={`${company.companyName} 標誌`}
                                style={{ maxWidth: "100%" }}
                              />
                            </Box>
                          </Box>
                        )}

                        {company.businessCertificateURL && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              營業證明文件
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              sx={{ mt: 1 }}
                              href={company.businessCertificateURL}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              檢視文件
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </div>
  );
}
