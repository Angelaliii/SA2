"use client";

import {
  Box,
  Container,
  Typography,
  Chip,
  Paper,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import * as postService from "../../../firebase/services/post-service";
import Navbar from "../../../components/Navbar";
import InventoryIcon from "@mui/icons-material/Inventory";
import EventIcon from "@mui/icons-material/Event";
import InfoIcon from "@mui/icons-material/Info";

export default function DemandPostDetailPage() {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const data = await postService.getPostById(id as string);
      setPost(data);
    };
    fetchPost();
  }, [id]);

  if (!post) return null;

  return (
    <>
      <Navbar />
      <Container maxWidth="md" sx={{ pt: 10, pb: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* 標題 */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {post.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              發布社團：{post.organizationName || "未知社團"}
            </Typography>
          </Box>

          {/* 需求物資 */}
          <Box sx={{ backgroundColor: "#f0f7ff", p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InventoryIcon sx={{ mr: 1, color: "#1976d2" }} />
              <Typography variant="h6">需求物資</Typography>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {post.selectedDemands?.map((item: string, index: number) => (
                <Chip key={index} label={item} color="primary" />
              ))}
            </Box>
            <Typography variant="body1" sx={{ mt: 2 }}>
              {post.demandDescription || "無補充說明"}
            </Typography>
          </Box>

          {/* 活動資訊 */}
          <Box sx={{ backgroundColor: "#fff9eb", p: 3, borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <EventIcon sx={{ mr: 1, color: "#ff9800" }} />
              <Typography variant="h6">活動資訊</Typography>
            </Box>

            {post.eventName && (
              <Typography variant="body2" gutterBottom>
                活動名稱：{post.eventName}
              </Typography>
            )}

            {post.eventType && (
              <Typography variant="body2" gutterBottom>
                活動性質：{post.eventType}
              </Typography>
            )}

            <Typography variant="body2" gutterBottom>
              預估人數：{post.estimatedParticipants || "未填寫"}
            </Typography>

            <Typography variant="body2" gutterBottom>
              活動日期：{post.eventDate || "未填寫"}
            </Typography>
          </Box>

          {/* 回饋與補充說明 */}
          <Box sx={{ backgroundColor: "#f1f8e9", p: 3, borderRadius: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <InfoIcon sx={{ mr: 1, color: "#689f38" }} />
              <Typography variant="h6">補充說明與回饋</Typography>
            </Box>
            <Typography variant="body2" gutterBottom>
              {post.cooperationReturn || "未提供回饋方案"}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {post.eventDescription || "無補充說明"}
            </Typography>
          </Box>
        </Paper>
      </Container>
    </>
  );
}
