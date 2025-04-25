"use client";

import { Box, Container, Paper, Typography, CircularProgress, Button } from "@mui/material";
import BusinessIcon from '@mui/icons-material/Business';
import EmailIcon from '@mui/icons-material/Email';
import DescriptionIcon from '@mui/icons-material/Description';
import Link from '@mui/material/Link';
import Navbar from "../../../components/Navbar";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";

interface EnterprisePost {
  id: string;
  title: string;
  companyName?: string;
  email?: string;
  content?: string;
  createdAt?: string | Date;
  status?: string;
}

export default function EnterpriseDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<EnterprisePost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, "enterprisePosts", id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({
            id: docSnap.id,
            title: data.title || "無標題",
            companyName: data.companyName || "未知企業",
            email: data.email || "",
            content: data.content || "",
            createdAt: data.createdAt,
            status: data.status
          });
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const formatDate = (timestamp: string | Date | null | undefined) => {
    if (!timestamp) return "無日期";
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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
          <Typography>找不到文章</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box sx={{ pt: "84px", pb: 8, minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
        <Container maxWidth="md">
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              borderRadius: 2,
              backgroundColor: "white",
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)"
            }}
          >
            {/* 標題與企業資訊 */}
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
                {post.title}
              </Typography>
              
              {/* 企業資訊與聯絡方式 */}
              <Box sx={{ display: "flex", justifyContent: "center", gap: 3, mb: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <BusinessIcon color="primary" />
                  <Typography variant="subtitle1">
                    {post.companyName}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <EmailIcon color="primary" />
                  <Typography variant="subtitle1">
                    {post.email ? (
                      <Link 
                        href={`mailto:${post.email}`}
                        underline="hover"
                        sx={{ 
                          color: 'primary.main',
                          '&:hover': {
                            color: 'primary.dark'
                          }
                        }}
                      >
                        {post.email}
                      </Link>
                    ) : (
                      "無提供信箱"
                    )}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                發布時間：{formatDate(post.createdAt)}
              </Typography>
            </Box>

            {/* 內容區 */}
            <Box 
              sx={{ 
                backgroundColor: "#f9f9f9", 
                p: 3, 
                borderRadius: 2, 
                mb: 4,
                border: "1px solid",
                borderColor: "divider"
              }}
            >
              <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon />
                合作內容
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-line',
                  minHeight: '100px',
                  bgcolor: 'background.paper',
                  p: 2,
                  borderRadius: 1
                }}
              >
                {post.content || "尚無合作內容說明"}
              </Typography>
            </Box>

            {/* 聯絡按鈕 */}
            <Box sx={{ textAlign: "center", mt: 4 }}>
              {post.email ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<EmailIcon />}
                  href={`mailto:${post.email}`}
                  sx={{ 
                    minWidth: 200,
                    mb: 2
                  }}
                >
                  聯絡企業
                </Button>
              ) : (
                <Typography color="text.secondary">
                  此企業尚未提供聯絡方式
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
              
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}
