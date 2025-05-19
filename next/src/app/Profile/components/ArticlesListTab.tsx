"use client";

import ArticleIcon from "@mui/icons-material/Article";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";
import ArticleDeleteDialog from "../../../components/article/ArticleDeleteDialog";
import ArticleEditDialog from "../../../components/article/ArticleEditDialog";
import EnterpriseDeleteDialog from "../../../components/article/EnterpriseDeleteDialog";
import EnterpriseEditDialog from "../../../components/article/EnterpriseEditDialog";
import { useArticlesData } from "../hooks/useArticlesData";
import { formatDate } from "../utils/dateUtils";

export default function ArticlesListTab() {
  const {
    publishedArticles,
    publishedEnterpriseAnnouncements,
    loadingArticles,
    refreshAllPublishedContent,
  } = useArticlesData();

  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);
  const [articleEditDialogOpen, setArticleEditDialogOpen] = useState(false);
  const [articleDeleteDialogOpen, setArticleDeleteDialogOpen] = useState(false);
  const [announcementEditDialogOpen, setAnnouncementEditDialogOpen] =
    useState(false);
  const [announcementDeleteDialogOpen, setAnnouncementDeleteDialogOpen] =
    useState(false);

  // 處理需求文章編輯
  const handleEditArticle = (article: any) => {
    setSelectedArticle(article);
    setArticleEditDialogOpen(true);
  };

  // 處理需求文章刪除
  const handleDeleteArticle = (article: any) => {
    setSelectedArticle(article);
    setArticleDeleteDialogOpen(true);
  };

  // 處理公告編輯
  const handleEditAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementEditDialogOpen(true);
  };

  // 處理公告刪除
  const handleDeleteAnnouncement = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementDeleteDialogOpen(true);
  };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <ArticleIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          我的文章與企業公告
        </Typography>
      </Box>

      {loadingArticles ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          {publishedArticles.length === 0 &&
          publishedEnterpriseAnnouncements.length === 0 ? (
            <Typography>目前尚無已發布的文章或企業公告。</Typography>
          ) : (
            <>
              {publishedArticles.map((article) => (
                <Paper
                  key={article.id}
                  sx={{
                    p: 3,
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography variant="h6">
                      {article.title ?? "(未命名文章)"}
                    </Typography>

                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditArticle(article)}
                        title="編輯文章"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteArticle(article)}
                        title="刪除文章"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {article.demandType && (
                    <Chip
                      label={article.demandType}
                      color={
                        article.demandType === "物資"
                          ? "primary"
                          : article.demandType === "金錢"
                          ? "error"
                          : "success"
                      }
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      whiteSpace: "pre-line",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {article.demandDescription || article.content || ""}
                  </Typography>

                  {/* 根據 demandType 顯示不同資訊 */}
                  {article.demandType === "物資" && (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        物資類型：
                        {article.itemType ||
                          (article.customItems?.length > 0
                            ? article.customItems.join(", ")
                            : "未指定")}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        回饋方式：{article.feedbackDetails || "未提供"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        贊助截止時間：
                        {article.sponsorDeadline
                          ? new Date(
                              article.sponsorDeadline
                            ).toLocaleDateString("zh-TW")
                          : "未設定日期"}
                        　人數：{article.estimatedParticipants || "0"}人
                      </Typography>
                    </>
                  )}

                  {article.demandType === "金錢" && (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        金額區間：{article.moneyLowerLimit || "未指定"} -{" "}
                        {article.moneyUpperLimit || "未指定"} 元
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        回饋方式：{article.feedbackDetails || "未提供"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        贊助截止時間：
                        {article.sponsorDeadline
                          ? new Date(
                              article.sponsorDeadline
                            ).toLocaleDateString("zh-TW")
                          : "未設定日期"}
                        　人數：{article.estimatedParticipants || "0"}人
                      </Typography>
                    </>
                  )}

                  {article.demandType === "講師" && (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        講師類型：{article.speakerType || "未指定"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        回饋方式：{article.feedbackDetails || "未提供"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        贊助截止時間：
                        {article.sponsorDeadline
                          ? new Date(
                              article.sponsorDeadline
                            ).toLocaleDateString("zh-TW")
                          : "未設定日期"}
                        　人數：{article.estimatedParticipants || "0"}人
                      </Typography>
                    </>
                  )}

                  <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    發布日期：{formatDate(article.createdAt)}
                  </Typography>
                </Paper>
              ))}

              {publishedEnterpriseAnnouncements.map((announcement) => (
                <Paper
                  key={announcement.id}
                  sx={{
                    p: 3,
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography variant="h6">
                      {announcement.title ?? "(未命名公告)"}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditAnnouncement(announcement)}
                        title="編輯公告"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteAnnouncement(announcement)}
                        title="刪除公告"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mt: 1,
                      whiteSpace: "pre-line",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {announcement.content || ""}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                    發布日期：{formatDate(announcement.createdAt)}
                  </Typography>
                </Paper>
              ))}
            </>
          )}
        </Box>
      )}

      {/* 需求文章相關對話框 */}
      <ArticleEditDialog
        open={articleEditDialogOpen}
        onClose={() => setArticleEditDialogOpen(false)}
        onSuccess={() => {
          setArticleEditDialogOpen(false);
          refreshAllPublishedContent();
        }}
        article={selectedArticle}
      />

      <ArticleDeleteDialog
        open={articleDeleteDialogOpen}
        onClose={() => setArticleDeleteDialogOpen(false)}
        onSuccess={() => {
          setArticleDeleteDialogOpen(false);
          refreshAllPublishedContent();
        }}
        article={selectedArticle}
      />

      {/* 企業公告相關對話框 */}
      <EnterpriseEditDialog
        open={announcementEditDialogOpen}
        onClose={() => setAnnouncementEditDialogOpen(false)}
        onSuccess={() => {
          setAnnouncementEditDialogOpen(false);
          refreshAllPublishedContent();
        }}
        announcement={selectedAnnouncement}
      />

      <EnterpriseDeleteDialog
        open={announcementDeleteDialogOpen}
        onClose={() => setAnnouncementDeleteDialogOpen(false)}
        onSuccess={() => {
          setAnnouncementDeleteDialogOpen(false);
          refreshAllPublishedContent();
        }}
        announcement={selectedAnnouncement}
      />
    </>
  );
}
