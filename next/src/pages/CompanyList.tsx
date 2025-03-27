"use client";

import {
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
import { collection, getDocs, query } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../assets/globals.module.css";
import { db } from "../firebase/config";

// Define Company type based on your Firebase structure
interface Company {
  id: string;
  companyName: string;
  businessId: string;
  industryType: string;
  contactName: string;
  contactPhone: string;
  email: string;
  companyDescription: string;
  logoURL?: string;
  businessCertificateURL?: string;
  status: string;
  registrationDate: any;
}

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all companies from Firebase on page load
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        console.log("Fetching companies from Firebase...");
        const companiesRef = collection(db, "company");
        // Create a query reference without filters to get all documents
        const companiesQuery = query(companiesRef);
        console.log("Query created, awaiting results...");
        const querySnapshot = await getDocs(companiesQuery);
        console.log("Query returned. Empty?", querySnapshot.empty);
        console.log("Number of documents:", querySnapshot.size);

        if (querySnapshot.empty) {
          console.log("No company documents found!");
          setCompanies([]);
          setLoading(false);
          return;
        }

        const companyList: Company[] = [];
        querySnapshot.forEach((doc) => {
          console.log("Processing document:", doc.id);
          const data = doc.data();
          companyList.push({
            id: doc.id,
            companyName: data.companyName || "未命名",
            businessId: data.businessId || "",
            industryType: data.industryType || "",
            contactName: data.contactName || "",
            contactPhone: data.contactPhone || "",
            email: data.email || "",
            companyDescription: data.companyDescription || "",
            logoURL: data.logoURL,
            businessCertificateURL: data.businessCertificateURL,
            status: data.status || "pending",
            registrationDate: data.registrationDate,
          });
        });

        console.log("獲取的公司資料:", companyList);
        console.log("獲取的公司數量:", companyList.length);
        setCompanies(companyList);
      } catch (err) {
        console.error("Error fetching companies:", err);
        setError("資料載入失敗，請稍後再試");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";

    try {
      // Handle Firebase Timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString("zh-TW");
      }
      // Handle regular date
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

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ textAlign: "center", my: 5 }}>
              <Typography color="error">{error}</Typography>
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
