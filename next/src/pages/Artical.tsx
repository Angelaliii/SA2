"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PreviewIcon from "@mui/icons-material/Preview";
import SaveIcon from "@mui/icons-material/Save";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter } from "next/router";
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { auth } from "../firebase/config";
import { postService } from "../firebase/services";

const postLocations = ["企業版", "社團版"];
const tagOptions = [
  "教學",
  "科技",
  "活動",
  "合作",
  "研討會",
  "實習",
  "比賽",
  "志工",
];
const postTypes = ["一般文章", "企業合作需求", "社團活動合作"];
const cooperationTypes = [
  "專案合作",
  "贊助合作",
  "資源共享",
  "顧問諮詢",
  "實習機會",
  "其他",
];
const visibilityOptions = ["公開", "僅特定對象可見"];

// 格式化日期的簡單函數
const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return date.toISOString().split("T")[0]; // 返回YYYY-MM-DD格式
};

// 將字符串轉換為Date對象的函數
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  return new Date(dateStr);
};

export default function PublishPage() {
  const [location, setLocation] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [openSnackbar, setOpenSnackbar] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState("");
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<
    "success" | "error"
  >("success");

  // 新增狀態
  const [postType, setPostType] = React.useState("");
  const [cooperationDeadline, setCooperationDeadline] =
    React.useState<Date | null>(null);
  const [cooperationType, setCooperationType] = React.useState("");
  const [budgetMin, setBudgetMin] = React.useState("");
  const [budgetMax, setBudgetMax] = React.useState("");
  const [eventDate, setEventDate] = React.useState<Date | null>(null);
  const [visibility, setVisibility] = React.useState(visibilityOptions[0]);
  const [previewMode, setPreviewMode] = React.useState(false);
  const [isDraft, setIsDraft] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);
  const [errors, setErrors] = React.useState<{ [key: string]: string }>({});
  const [isUnSaved, setIsUnSaved] = React.useState(false);
  const [currentDraftId, setCurrentDraftId] = React.useState<
    string | undefined
  >(undefined);

  // 草稿相關狀態
  const [drafts, setDrafts] = useState<any[]>([]);
  const [openDraftsDialog, setOpenDraftsDialog] = useState(false);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  // 日期字符串狀態 (用於表單輸入)
  const [cooperationDeadlineStr, setCooperationDeadlineStr] =
    React.useState("");
  const [eventDateStr, setEventDateStr] = React.useState("");

  // 同步日期對象和字符串
  useEffect(() => {
    if (cooperationDeadline) {
      setCooperationDeadlineStr(formatDate(cooperationDeadline));
    }
    if (eventDate) {
      setEventDateStr(formatDate(eventDate));
    }
  }, [cooperationDeadline, eventDate]);

  // 更新日期對象當字符串改變
  useEffect(() => {
    setCooperationDeadline(parseDate(cooperationDeadlineStr));
  }, [cooperationDeadlineStr]);

  useEffect(() => {
    setEventDate(parseDate(eventDateStr));
  }, [eventDateStr]);

  const router = useRouter();
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 確認表單是否有變更
  const checkFormChanged = () => {
    if (title || content || location || tags.length > 0 || postType) {
      setIsUnSaved(true);
    } else {
      setIsUnSaved(false);
    }
  };

  // 監聽表單變更
  useEffect(() => {
    checkFormChanged();
  }, [title, content, location, tags, postType]);

  // 設置自動保存
  useEffect(() => {
    if (isUnSaved && !previewMode) {
      autoSaveTimerRef.current = setTimeout(() => {
        handleSaveDraft();
      }, 60000); // 每60秒自動保存
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isUnSaved, title, content, tags, postType, location]);

  // 離開頁面前提醒
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUnSaved) {
        e.preventDefault();
        const message = "您有未保存的修改，確定要離開嗎？";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUnSaved]);

  // 驗證表單
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title) newErrors.title = "請輸入標題";
    if (!content) newErrors.content = "請輸入內容";
    if (!postType) newErrors.postType = "請選擇文章類型";

    // 合作需求特有欄位的驗證
    if (postType === "企業合作需求" || postType === "社團活動合作") {
      if (!cooperationDeadlineStr)
        newErrors.cooperationDeadline = "請設定合作期限";
      if (!cooperationType) newErrors.cooperationType = "請選擇合作類型";

      if (postType === "企業合作需求") {
        if (!budgetMin && !budgetMax) newErrors.budget = "請填寫預算範圍";
        else if (Number(budgetMin) > Number(budgetMax) && budgetMax) {
          newErrors.budget = "最低預算不應高於最高預算";
        }
      }

      if (postType === "社團活動合作" && !eventDateStr) {
        newErrors.eventDate = "請設定活動日期";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 載入草稿列表 - 使用真實資料庫
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

      // 從資料庫獲取使用者的草稿
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

  // 載入特定草稿 - 使用真實資料
  const loadDraft = async (draftId: string) => {
    try {
      // 從資料庫獲取草稿
      const draft = await postService.getPostById(draftId);
      if (!draft) {
        throw new Error("找不到指定草稿");
      }

      // 填充表單
      setTitle(draft.title);
      setContent(draft.content);
      setPostType(draft.postType);
      setCurrentDraftId(draftId);

      // 設置其他字段
      if (draft.tags) setTags(draft.tags);
      if (draft.location) setLocation(draft.location);
      if (draft.cooperationType) setCooperationType(draft.cooperationType);

      if (draft.cooperationDeadline) {
        const date = new Date(draft.cooperationDeadline);
        setCooperationDeadline(date);
        setCooperationDeadlineStr(formatDate(date));
      }

      if (draft.budget) {
        setBudgetMin(draft.budget.min.toString());
        setBudgetMax(draft.budget.max.toString());
      }

      if (draft.eventDate) {
        const date = new Date(draft.eventDate);
        setEventDate(date);
        setEventDateStr(formatDate(date));
      }

      if (draft.visibility) setVisibility(draft.visibility);

      setSnackbarMessage("草稿已載入");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setOpenDraftsDialog(false);
      setIsDraft(true);
    } catch (error) {
      console.error("載入草稿時出錯:", error);
      setSnackbarMessage("無法載入草稿");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 刪除草稿 - 使用真實資料
  const deleteDraft = async (draftId: string) => {
    try {
      await postService.deletePost(draftId);
      setDrafts(drafts.filter((draft) => draft.id !== draftId));

      // 如果刪除的是當前正在編輯的草稿，則重置表單
      if (currentDraftId === draftId) {
        resetForm();
      }

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

  // 確認刪除草稿
  const confirmDeleteDraft = (draftId: string) => {
    setDraftToDelete(draftId);
    setOpenDeleteDialog(true);
  };

  // 重置表單
  const resetForm = () => {
    setTitle("");
    setContent("");
    setLocation("");
    setPostType("");
    setTags([]);
    setCooperationDeadline(null);
    setCooperationDeadlineStr("");
    setCooperationType("");
    setBudgetMin("");
    setBudgetMax("");
    setEventDate(null);
    setEventDateStr("");
    setVisibility(visibilityOptions[0]);
    setCurrentDraftId(undefined);
    setIsDraft(false);
  };

  // 儲存草稿 - 使用真實資料
  const handleSaveDraft = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        return;
      }

      // 準備要儲存的草稿資料
      const draftData = {
        title,
        content,
        location,
        postType,
        tags,
        authorId: currentUser.uid,
        cooperationDeadline: cooperationDeadline
          ? cooperationDeadline.toISOString()
          : null,
        cooperationType,
        budget:
          budgetMin || budgetMax
            ? { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 }
            : null,
        eventDate: eventDate ? eventDate.toISOString() : null,
        visibility,
        isDraft: true,
      };

      // 儲存草稿到資料庫
      const result = await postService.saveDraft(draftData, currentDraftId);

      if (result.success) {
        // 如果是新草稿，設置當前草稿ID
        if (result.id && !currentDraftId) {
          setCurrentDraftId(result.id);
        }

        const now = new Date();
        setLastSaved(
          `上次保存時間：${now.getHours().toString().padStart(2, "0")}:${now
            .getMinutes()
            .toString()
            .padStart(2, "0")}`
        );
        setSnackbarMessage("草稿已保存");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setIsUnSaved(false);
        setIsDraft(true);
      } else {
        throw new Error("儲存草稿失敗");
      }
    } catch (error) {
      console.error("儲存草稿時出錯:", error);
      setSnackbarMessage("儲存草稿失敗");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  // 發布文章或將草稿轉為正式文章
  const handlePublish = async () => {
    // 使用更完善的表單驗證
    if (!validateForm()) {
      setSnackbarMessage("請填寫所有必填欄位");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setSnackbarMessage("請先登入");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setLoading(false);
        return;
      }

      let result;

      // 如果是現有草稿，則將其發布
      if (currentDraftId) {
        result = await postService.publishDraft(currentDraftId);
      } else {
        // 否則建立新的正式文章
        const postData = {
          title,
          content,
          location,
          postType,
          tags,
          authorId: currentUser.uid,
          cooperationDeadline: cooperationDeadline
            ? cooperationDeadline.toISOString()
            : null,
          cooperationType: postType.includes("合作") ? cooperationType : null,
          budget:
            postType === "企業合作需求" && (budgetMin || budgetMax)
              ? { min: Number(budgetMin) || 0, max: Number(budgetMax) || 0 }
              : null,
          eventDate:
            postType === "社團活動合作" && eventDate
              ? eventDate.toISOString()
              : null,
          visibility,
          isDraft: false,
          viewCount: 0,
          interactionCount: 0,
        };

        result = await postService.createPost(postData);
      }

      if (result.success) {
        setSnackbarMessage("文章發布成功");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        setIsUnSaved(false);

        // 重設表單
        resetForm();

        // 導航到文章列表頁面
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        throw new Error("發布失敗");
      }
    } catch (error) {
      console.error("發布文章時出錯:", error);
      setSnackbarMessage("發布失敗，請稍後再試");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", py: 6 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h5">
              {previewMode
                ? "預覽文章"
                : currentDraftId
                ? "編輯草稿"
                : "發布文章"}
            </Typography>
            <Box>
              {!previewMode && lastSaved && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mr: 2 }}
                >
                  {lastSaved}
                </Typography>
              )}
              <Tooltip title="查看已儲存草稿">
                <IconButton onClick={loadDrafts} disabled={loadingDrafts}>
                  <ListAltIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={previewMode ? "返回編輯" : "預覽文章"}>
                <IconButton onClick={togglePreview}>
                  <PreviewIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* 草稿對話框 */}
          <Dialog
            open={openDraftsDialog}
            onClose={() => setOpenDraftsDialog(false)}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle>
              <Typography variant="h6">已儲存草稿</Typography>
            </DialogTitle>
            <DialogContent dividers>
              {loadingDrafts ? (
                <Typography variant="body1" align="center" py={2}>
                  正在載入草稿...
                </Typography>
              ) : drafts.length > 0 ? (
                <List>
                  {drafts.map((draft) => (
                    <ListItem key={draft.id} disablePadding divider>
                      <ListItemButton onClick={() => loadDraft(draft.id)}>
                        <Box width="100%">
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <ListItemText
                              primary={draft.title || "無標題草稿"}
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" component="span">
                                    {draft.postType} •
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    component="span"
                                    color="text.secondary"
                                  >
                                    {" "}
                                    上次儲存:{" "}
                                    {new Date(draft.createdAt).toLocaleString()}
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                            <Chip
                              label="草稿"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mt: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {draft.content}
                          </Typography>
                        </Box>
                      </ListItemButton>
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => confirmDeleteDraft(draft.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" align="center" py={3}>
                  您目前沒有已儲存的草稿
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDraftsDialog(false)}>關閉</Button>
            </DialogActions>
          </Dialog>

          {/* 刪除確認對話框 */}
          <Dialog
            open={openDeleteDialog}
            onClose={() => setOpenDeleteDialog(false)}
          >
            <DialogTitle>確認刪除</DialogTitle>
            <DialogContent>
              <DialogContentText>
                確定要刪除此草稿嗎？此操作無法復原。
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>取消</Button>
              <Button
                onClick={() => draftToDelete && deleteDraft(draftToDelete)}
                color="error"
                autoFocus
              >
                刪除
              </Button>
            </DialogActions>
          </Dialog>

          {previewMode ? (
            // 預覽模式
            <Box>
              <Typography variant="h4" gutterBottom>
                {title || "無標題"}
              </Typography>
              <Box display="flex" gap={1} mb={1}>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                gutterBottom
              >
                發布位置: {location || "未指定"} | 文章類型:{" "}
                {postType || "未指定"} | 可見性: {visibility}
              </Typography>

              <Divider sx={{ my: 2 }} />

              {/* Replace dangerouslySetInnerHTML with pre-formatted text for preview */}
              <Box sx={{ mt: 2, whiteSpace: "pre-wrap" }}>{content}</Box>

              {(postType === "企業合作需求" || postType === "社團活動合作") && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    合作詳情
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>合作類型：</strong>{" "}
                        {cooperationType || "未指定"}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        <strong>合作期限：</strong>{" "}
                        {cooperationDeadline
                          ? cooperationDeadline.toLocaleDateString()
                          : "未指定"}
                      </Typography>
                    </Grid>
                    {postType === "企業合作需求" && (
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>預算範圍：</strong> {budgetMin || "0"} -{" "}
                          {budgetMax || "不限"} 元
                        </Typography>
                      </Grid>
                    )}
                    {postType === "社團活動合作" && (
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>活動日期：</strong>{" "}
                          {eventDate
                            ? eventDate.toLocaleDateString()
                            : "未指定"}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}

              <Box display="flex" justifyContent="center" mt={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={togglePreview}
                  sx={{ mr: 2 }}
                >
                  返回編輯
                </Button>

                <Button
                  variant="contained"
                  color="success"
                  onClick={handlePublish}
                  disabled={loading}
                >
                  {loading ? "發布中..." : "確認發布"}
                </Button>
              </Box>
            </Box>
          ) : (
            // 編輯模式
            <Stack spacing={2} mt={2}>
              {/* 基本信息區域 */}
              <Grid container spacing={2} alignItems="flex-start">
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={!!errors.postType}
                    sx={{ m: 0 }}
                  >
                    <InputLabel id="post-type-label">文章類型</InputLabel>
                    <Select
                      labelId="post-type-label"
                      value={postType}
                      label="文章類型"
                      onChange={(e) => setPostType(e.target.value)}
                    >
                      {postTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.postType && (
                      <FormHelperText>{errors.postType}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth sx={{ m: 0 }}>
                    <InputLabel id="location-label">發布位置</InputLabel>
                    <Select
                      labelId="location-label"
                      value={location}
                      label="發布位置"
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      {postLocations.map((loc) => (
                        <MenuItem key={loc} value={loc}>
                          {loc}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="標題"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={!!errors.title}
                helperText={errors.title}
              />

              {/* Replace ReactQuill with a simple textarea */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  內容
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  placeholder="請輸入文章內容..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  error={!!errors.content}
                  helperText={errors.content || ""}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 1,
                      borderColor: errors.content ? "red" : "#ccc",
                    },
                  }}
                />
              </Box>

              <Autocomplete
                multiple
                options={tagOptions}
                value={tags}
                onChange={(_, newValue) => setTags(newValue)}
                renderInput={(params) => <TextField {...params} label="標籤" />}
              />

              {/* 合作需求特有欄位 */}
              {(postType === "企業合作需求" || postType === "社團活動合作") && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    合作詳情
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth error={!!errors.cooperationType}>
                        <InputLabel id="cooperation-type-label">
                          合作類型
                        </InputLabel>
                        <Select
                          labelId="cooperation-type-label"
                          value={cooperationType}
                          label="合作類型"
                          onChange={(e) => setCooperationType(e.target.value)}
                        >
                          {cooperationTypes.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.cooperationType && (
                          <FormHelperText>
                            {errors.cooperationType}
                          </FormHelperText>
                        )}
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="合作期限"
                        type="date"
                        value={cooperationDeadlineStr}
                        onChange={(e) =>
                          setCooperationDeadlineStr(e.target.value)
                        }
                        InputLabelProps={{
                          shrink: true,
                        }}
                        error={!!errors.cooperationDeadline}
                        helperText={errors.cooperationDeadline}
                      />
                    </Grid>
                    {postType === "企業合作需求" && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="最低預算"
                            type="number"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              ),
                            }}
                            value={budgetMin}
                            onChange={(e) => setBudgetMin(e.target.value)}
                            error={!!errors.budget}
                            helperText={errors.budget}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="最高預算"
                            type="number"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  $
                                </InputAdornment>
                              ),
                            }}
                            value={budgetMax}
                            onChange={(e) => setBudgetMax(e.target.value)}
                          />
                        </Grid>
                      </>
                    )}
                    {postType === "社團活動合作" && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="活動日期"
                          type="date"
                          value={eventDateStr}
                          onChange={(e) => setEventDateStr(e.target.value)}
                          InputLabelProps={{
                            shrink: true,
                          }}
                          error={!!errors.eventDate}
                          helperText={errors.eventDate}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              )}

              {/* 可見範圍設定 */}
              <FormControl fullWidth>
                <InputLabel id="visibility-label">可見範圍</InputLabel>
                <Select
                  labelId="visibility-label"
                  value={visibility}
                  label="可見範圍"
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  {visibilityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 操作按鈕 */}
              <Box display="flex" justifyContent="space-between" mt={2}>
                <Box>
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveDraft}
                    sx={{ mr: 1 }}
                  >
                    {currentDraftId ? "更新草稿" : "儲存為草稿"}
                  </Button>

                  {currentDraftId && (
                    <>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => confirmDeleteDraft(currentDraftId)}
                        sx={{ mr: 1 }}
                      >
                        刪除草稿
                      </Button>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={resetForm}
                      >
                        建立新文章
                      </Button>
                    </>
                  )}
                </Box>

                <Box>
                  <Button
                    variant="outlined"
                    onClick={togglePreview}
                    sx={{ mr: 2 }}
                  >
                    預覽
                  </Button>

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePublish}
                    disabled={loading || isDraft}
                  >
                    {isDraft
                      ? "儲存草稿"
                      : loading
                      ? "發布中..."
                      : currentDraftId
                      ? "發布草稿"
                      : "發布文章"}
                  </Button>
                </Box>
              </Box>
            </Stack>
          )}
        </Paper>
      </Container>

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
    </Box>
  );
}
