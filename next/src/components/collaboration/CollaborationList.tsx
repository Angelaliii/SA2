"use client";

import * as React from 'react';
import { JSX } from 'react';
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HandshakeIcon from "@mui/icons-material/Handshake";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
  Snackbar,
  Alert,
  Rating,
} from "@mui/material";
import { useEffect, useState, useCallback } from "react";
import { auth, db } from "../../firebase/config";
import { collaborationService } from "../../firebase/services/collaboration-service";
import { notificationService } from "../../firebase/services/notification-service";
import { getOrganizationName } from "../../firebase/services/post-service";
import { doc, getDoc } from "firebase/firestore";
import AcceptCollaborationDialog from "./AcceptCollaborationDialog";
import CancelCollaborationDialog from "./CancelCollaborationDialog";
import CollaborationResponseDialog from "./CollaborationResponseDialog";
import { CollaborationEndReviewDialog } from "./CollaborationReviewDialog";

interface CollaborationListProps {
  userId?: string;
  visibleTabs?: Array<"pending" | "active" | "review" | "complete" | "cancel">;
}

export default function CollaborationList({
  userId,
  visibleTabs = ["pending", "active", "review", "complete", "cancel"],
}: Readonly<CollaborationListProps>): JSX.Element {
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [acceptedCollaborations, setAcceptedCollaborations] = useState<any[]>(
    []
  );
  const [completedCollaborations, setCompletedCollaborations] = useState<any[]>(
    []
  );
  const [cancelledCollaborations, setCancelledCollaborations] = useState<any[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollaboration, setSelectedCollaboration] = useState<
    string | null
  >(null);
  const [endReviewType, setEndReviewType] = useState<
    "complete" | "cancel" | null
  >(null);  const [organizationNames, setOrganizationNames] = useState<{
    [key: string]: string;
  }>({});
  const [tabValue, setTabValue] = useState(0);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null
  );  const [selectedCancelId, setSelectedCancelId] = useState<string | null>(null);
  const [selectedAcceptId, setSelectedAcceptId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });
  const loadCollaborations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const uid = userId ?? auth.currentUser?.uid;
    if (!uid) {
      setError("請先登入或提供 userId");
      setLoading(false);
      return;
    }

    try {
      // 獲取收到的合作請求
      const received = await collaborationService.getReceivedRequests(uid);
      setReceivedRequests(received);

      // 獲取發送的合作請求
      const sent = await collaborationService.getSentRequests(uid);
      setSentRequests(sent);

      // 合併所有合作記錄並去重
      const allCollaborations = [...received, ...sent].filter(
        (collaboration, index, self) =>
          index === self.findIndex((c) => c.id === collaboration.id)
      );

      // 分類合作記錄
      const active = allCollaborations.filter(
        (c) => c.status === "accepted" || c.status === "pending_review"
      );
      const completed = allCollaborations.filter(
        (c) => c.status === "complete"
      );
      const cancelled = allCollaborations.filter((c) => c.status === "cancel");

      setAcceptedCollaborations(active);
      setCompletedCollaborations(completed);
      setCancelledCollaborations(cancelled);
    } catch (err) {
      console.error("Error loading collaborations:", err);
      setError("載入合作記錄時發生錯誤");
    } finally {
      setLoading(false);
    }
  }, [userId]);  // useEffect 確保僅在客戶端運行時才載入資料
  useEffect(() => {
    // 防止在服務器端運行
    if (typeof window === "undefined") return;

    loadCollaborations();
  }, [loadCollaborations]);
  const loadOrganizationName = useCallback(async (userId: string) => {
    if (organizationNames[userId]) return organizationNames[userId];

    try {
      const name = await getOrganizationName(userId);
      if (name) {
        setOrganizationNames((prev) => ({
          ...prev,
          [userId]: name,
        }));
        return name;
      }
      return "未知組織";
    } catch (err) {
      console.error("Error loading organization name:", err);
      return "未知組織";
    }
  }, [organizationNames]);  useEffect(() => {
    const loadCollaborationPartners = async () => {
      const allCollaborations = [
        ...receivedRequests,
        ...sentRequests,
        ...acceptedCollaborations,
        ...completedCollaborations,
        ...cancelledCollaborations,
      ];

      for (const collab of allCollaborations) {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) continue;

        // 確定合作對象的 ID
        const partnerId =
          currentUserId === collab.requesterId
            ? collab.receiverId
            : collab.requesterId;
        await loadOrganizationName(partnerId);
      }
    };

    loadCollaborationPartners();
  }, [
    receivedRequests,
    sentRequests,
    acceptedCollaborations,
    completedCollaborations,
    cancelledCollaborations,
    loadOrganizationName
  ]);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "等待審核",
          color: "warning" as const,
          icon: <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />,
        };
      case "accepted":
        return {
          label: "進行中",
          color: "success" as const,
          icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />,
        };
      case "pending_review":
        return {
          label: "待評價",
          color: "warning" as const,
          icon: <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />,
        };
      case "rejected":
        return {
          label: "已拒絕",
          color: "error" as const,
          icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />,
        };
      case "complete":
        return {
          label: "已完成",
          color: "primary" as const,
          icon: <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />,
        };
      case "cancel":
        return {
          label: "已取消",
          color: "error" as const,
          icon: <CancelIcon fontSize="small" sx={{ mr: 0.5 }} />,
        };
      default:
        return {
          label: "未知狀態",
          color: "default" as const,
          icon: undefined,
        };
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "未知時間";

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      return "日期格式錯誤";
    }
  };

  const getPartnerName = (collaboration: any) => {
    const currentUserId = auth.currentUser?.uid;
    const partnerId = currentUserId === collaboration.requesterId
      ? collaboration.receiverId
      : collaboration.requesterId;
    return organizationNames[partnerId] || "未知組織";
  };

  const handleOpenEndReview = (
    collaborationId: string,
    type: "complete" | "cancel"
  ) => {
    setSelectedCollaboration(collaborationId);
    setEndReviewType(type);
  };  const handleCloseEndReview = async () => {
    // 清空所有對話框相關的狀態
    setSelectedCollaboration(null);
    setEndReviewType(null);
    
    // 重新加載合作列表
    await loadCollaborations();
  };  
  
  const handleOpenReview = (
    collaborationId: string,
    type: "complete" | "cancel"
  ) => {
    // 設置狀態以打開評價對話框
    setSelectedCollaboration(collaborationId);
    setEndReviewType(type);
  };  // handleCloseEndReview 函數現在處理所有關閉評價對話框的邏輯

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
    const handleAcceptCollaboration = (collaborationId: string) => {
    // 開啟確認對話框
    setSelectedAcceptId(collaborationId);
  };
  
  const handleCloseAccept = () => {
    setSelectedAcceptId(null);
    loadCollaborations(); // 重新加載列表
  };

  const handleOpenReject = (collaborationId: string) => {
    // 直接開啟拒絕原因對話框
    setSelectedResponseId(collaborationId);
  };

  const handleCloseResponse = () => {
    setSelectedResponseId(null);
    loadCollaborations(); // 重新加載列表
  };

  const handleOpenCancel = (collaborationId: string) => {
    setSelectedCancelId(collaborationId);
  };

  const handleCloseCancel = () => {
    setSelectedCancelId(null);
    loadCollaborations(); // 重新加載列表
  };

  // Tab labels 和對應值的映射
  const tabConfig = [
    {
      value: "pending",
      label: `待回覆 (${
        receivedRequests.filter((req) => req.status === "pending").length
      })`,
      icon: <AccessTimeIcon />,
    },
    {
      value: "active",
      label: `進行中 (${
        acceptedCollaborations.filter((c) => c.status === "accepted").length
      })`,
      icon: <HandshakeIcon />,
    },
    {
      value: "review",
      label: `待評價 (${
        acceptedCollaborations.filter((c) => c.status === "pending_review")
          .length
      })`,
      icon: <AccessTimeIcon />,
    },
    {
      value: "complete",
      label: `已完成 (${completedCollaborations.length})`,
      icon: <CheckCircleIcon />,
    },
    {
      value: "cancel",
      label: `已取消 (${cancelledCollaborations.length})`,
      icon: <CancelIcon />,
    },
  ];

  // 根據 visibleTabs 過濾要顯示的標籤頁
  const visibleTabConfig = tabConfig.filter((tab) =>
    visibleTabs.includes(tab.value as any)
  );
  // 確保在顯示的 tab 切換時，tabValue 的對應
  useEffect(() => {
    // 如果當前選擇的標籤不在可見標籤中，則自動選擇第一個可見標籤
    if (visibleTabConfig.length > 0 && !visibleTabConfig[tabValue]) {
      setTabValue(0);
    }
  }, [visibleTabs, visibleTabConfig, tabValue]);

  // 獲取真正的 tab 值（而不僅僅是索引）
  const currentTabValue = visibleTabConfig[tabValue]?.value || visibleTabs[0];
  // 處理提醒對方評價的函數
  const handleRemindToReview = async (collaborationId: string) => {
    try {
      // 獲取合作資訊
      const docRef = doc(db, "collaborations", collaborationId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.error("找不到該合作記錄");
        return;
      }

      const data = docSnap.data();
      const remindUserId = data.pendingReviewFor; // 需要被提醒評價的用戶ID
      
      // 如果找不到需要提醒的用戶ID，直接返回
      if (!remindUserId) return;
      
      // 發送提醒通知訊息
      await notificationService.sendCollaborationNeedsReview(
        remindUserId,
        collaborationId,
        "提醒您儘快完成合作評價。"
      );
      
      // 顯示提醒成功訊息
      setSnackbar({ open: true, message: "提醒已發送", severity: "success" });
    } catch (error) {
      console.error("發送提醒失敗:", error);
      setSnackbar({ open: true, message: "發送提醒失敗", severity: "error" });
    }
  };

  const renderPendingReviewItem = (collaboration: any) => {
    const currentUserId = auth.currentUser?.uid;
    const isActionInitiator = currentUserId === collaboration.actionInitiator;
    // 確認當前用戶是否已經評價
    const hasReviewed = isActionInitiator;
    // 確認當前用戶是否是文章作者（receiverId）
    const isArticleAuthor = currentUserId === collaboration.receiverId;

    return (
      <Paper
        key={collaboration.id}
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "#fafafa",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            《{collaboration.postTitle}》 - {getPartnerName(collaboration)}
          </Typography>
          <Chip
            label={getStatusDisplay(collaboration.status).label}
            color={getStatusDisplay(collaboration.status).color}
            size="small"
            icon={getStatusDisplay(collaboration.status).icon}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          狀態更新時間：{formatDate(collaboration.updatedAt)}
        </Typography>

        {hasReviewed ? (
          // 已評價用戶看到的內容
          <Box
            sx={{ p: 2, bgcolor: "background.paper", borderRadius: 2, mt: 1 }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              您已完成評價，等待 {getPartnerName(collaboration)}{" "}
              完成評價後，此合作將移至已完成區域
            </Typography>
          </Box>
        ) : (
          // 未評價用戶看到的內容及按鈕
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            {isArticleAuthor ? (
              // 文章作者看到「提醒對方評價」按鈕
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleRemindToReview(collaboration.id)}
              >
                提醒對方評價
              </Button>
            ) : (
              // 合作請求發起者看到「完成並評價」按鈕
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenReview(collaboration.id, "complete")}
              >
                完成並評價
              </Button>
            )}
          </Box>
        )}
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" sx={{ py: 2 }}>
        {error}
      </Typography>
    );
  }

  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        textColor="primary"
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": {
            textTransform: "none",
            minHeight: "48px",
            fontWeight: "medium",
          },
        }}
      >
        {visibleTabConfig.map((tab) => (
          <Tab
            key={tab.value}
            label={tab.label}
            icon={tab.icon}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {/* Tab Panels */}
      <Box hidden={currentTabValue !== "pending"}>
        {/* 待回覆的合作請求 */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff" }}>
          {receivedRequests.filter((req) => req.status === "pending").length >
          0 ? (
            receivedRequests
              .filter((req) => req.status === "pending")
              .map((request) => (
                <Paper
                  key={request.id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.08)",
                    bgcolor: "#fafafa",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      《{request.postTitle}》合作申請
                    </Typography>
                    <Chip
                      label={getStatusDisplay(request.status).label}
                      color={getStatusDisplay(request.status).color}
                      size="small"
                      icon={getStatusDisplay(request.status).icon}
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    申請時間：{formatDate(request.createdAt)}
                  </Typography>                  {/* 移除 "誰誰誰邀請您合作" 的顯示區塊 */}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                      mt: 1,
                    }}
                  >                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => handleOpenReject(request.id)}
                    >
                      拒絕
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleAcceptCollaboration(request.id)}
                    >
                      接受
                    </Button>
                  </Box>
                </Paper>
              ))
          ) : (
            <Typography color="text.secondary">
              目前沒有待回覆的合作請求
            </Typography>
          )}
        </Paper>
      </Box>

      <Box hidden={currentTabValue !== "active"}>
        {/* 進行中的合作 */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff" }}>
          {acceptedCollaborations.filter((c) => c.status === "accepted")
            .length > 0 ? (
            acceptedCollaborations
              .filter((c) => c.status === "accepted")
              .map((collaboration) => (
                <Paper
                  key={collaboration.id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 2,
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.08)",
                    bgcolor: "#fafafa",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="medium">
                      《{collaboration.postTitle}》 -{" "}
                      {getPartnerName(collaboration)}
                    </Typography>
                    <Chip
                      label={getStatusDisplay(collaboration.status).label}
                      color={getStatusDisplay(collaboration.status).color}
                      size="small"
                      icon={getStatusDisplay(collaboration.status).icon}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    狀態更新時間：{formatDate(collaboration.updatedAt)}
                  </Typography>

                  {/* 根據合作狀態顯示不同內容 */}
                  {collaboration.status === "pending_review" ? (
                    /* 如果是待評價狀態，顯示等待訊息 */
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        mt: 1,
                      }}
                    >
                      {collaboration.actionInitiator ===
                      auth.currentUser?.uid ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          您已完成評價，等待 {getPartnerName(collaboration)}{" "}
                          完成評價後，此合作將移至已完成區域
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          {getPartnerName(collaboration)}{" "}
                          已提出評價，請前往「等待評價」區域完成評價
                        </Typography>
                      )}
                    </Box>                  ) : (
                    /* 如果是一般進行中狀態，檢查是否為文章發布者 */
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 1,
                      }}
                    >
                      {/* 在合作關係中，receiverId是文章發布者(authorId)，requesterId是合作請求發起者 */}
                      {/* 僅當當前用戶是文章發布者時才顯示按鈕 */}
                      {auth.currentUser?.uid === collaboration.receiverId && (
                        <>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleOpenCancel(collaboration.id)}
                          >
                            取消合作
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              handleOpenEndReview(collaboration.id, "complete")
                            }
                          >
                            完成合作
                          </Button>
                        </>
                      )}
                    </Box>
                  )}
                </Paper>
              ))
          ) : (
            <Typography color="text.secondary">目前沒有進行中的合作</Typography>
          )}
        </Paper>
      </Box>

      <Box hidden={currentTabValue !== "review"}>
        {/* 等待評價的合作 */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff" }}>
          {acceptedCollaborations.filter((c) => c.status === "pending_review")
            .length > 0 ? (
            acceptedCollaborations
              .filter((c) => c.status === "pending_review")
              .map(renderPendingReviewItem)
          ) : (
            <Typography color="text.secondary">
              目前沒有待評價的合作
            </Typography>
          )}
        </Paper>
      </Box>

      <Box hidden={currentTabValue !== "complete"}>
        {/* 已完成的合作 */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff" }}>
          {completedCollaborations.length > 0 ? (
            completedCollaborations.map((collaboration) => (
              <Paper
                key={collaboration.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "#fafafa",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="medium">
                    《{collaboration.postTitle}》 -{" "}
                    {getPartnerName(collaboration)}
                  </Typography>
                  <Chip
                    label={getStatusDisplay(collaboration.status).label}
                    color={getStatusDisplay(collaboration.status).color}
                    size="small"
                    icon={getStatusDisplay(collaboration.status).icon}
                  />
                </Box>                <Typography variant="body2" color="text.secondary">
                  完成時間：
                  {formatDate(collaboration.completeReview?.reviewedAt || collaboration.partnerCompleteReview?.reviewedAt)}
                </Typography>                  {/* 處理顯示評價，只顯示對方給的評價 */}
                {(() => {
                  const currentUserId = auth.currentUser?.uid;
                  
                  // 檢查誰的評價應該顯示
                  const isCompleteReviewer = collaboration.completeReview?.reviewerId === currentUserId;
                  const isPartnerReviewer = collaboration.partnerCompleteReview?.reviewerId === currentUserId;
                  
                  // 如果當前用戶是 completeReview 的撰寫者，則顯示 partnerCompleteReview (對方評價)
                  // 如果當前用戶是 partnerCompleteReview 的撰寫者，則顯示 completeReview (對方評價)
                  // 如果兩者都不是，則檢查有沒有任何評價可以顯示
                  let showReview = null;
                  if (isCompleteReviewer) {
                    showReview = collaboration.partnerCompleteReview;
                  } else if (isPartnerReviewer) {
                    showReview = collaboration.completeReview;
                  } else if (!isCompleteReviewer && collaboration.completeReview) {
                    // 如果用戶不是 completeReview 的撰寫者，則顯示 completeReview
                    showReview = collaboration.completeReview;
                  } else if (!isPartnerReviewer && collaboration.partnerCompleteReview) {
                    // 如果用戶不是 partnerCompleteReview 的撰寫者，則顯示 partnerCompleteReview
                    showReview = collaboration.partnerCompleteReview;
                  }
                  
                  return (
                    <>
                      {showReview ? (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>對方給您的評價：</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Rating
                              value={showReview.rating}
                              readOnly
                              size="small"
                              precision={0.5}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {showReview.comment}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          尚未收到對方評價
                        </Typography>
                      )}
                    </>
                  );
                })()}
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">目前沒有已完成的合作</Typography>
          )}
        </Paper>
      </Box>

      <Box hidden={currentTabValue !== "cancel"}>
        {/* 已取消的合作 */}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: "#fff" }}>
          {cancelledCollaborations.length > 0 ? (
            cancelledCollaborations.map((collaboration) => (
              <Paper
                key={collaboration.id}
                elevation={0}
                sx={{
                  p: 2.5,
                  mb: 2,
                  borderRadius: 2,
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "#fafafa",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="medium">
                    《{collaboration.postTitle}》 -{" "}
                    {getPartnerName(collaboration)}
                  </Typography>
                  <Chip
                    label={getStatusDisplay(collaboration.status).label}
                    color={getStatusDisplay(collaboration.status).color}
                    size="small"
                    icon={getStatusDisplay(collaboration.status).icon}
                  />
                </Box>                <Typography variant="body2" color="text.secondary">
                  取消時間：{formatDate(collaboration.cancelReview?.reviewedAt || collaboration.partnerCancelReview?.reviewedAt)}
                </Typography>                  {/* 處理顯示取消原因，只顯示一個取消原因 */}
                {(() => {
                  // 找出有取消原因的評價，優先使用 cancelReview
                  const cancelReason = collaboration.cancelReview?.comment || collaboration.partnerCancelReview?.comment;
                  const reviewerId = collaboration.cancelReview?.reviewerId || collaboration.partnerCancelReview?.reviewerId;
                  const currentUserId = auth.currentUser?.uid;
                  
                  // 判斷取消是由誰發起的
                  const cancelledByMe = reviewerId === currentUserId;
                  const cancelledBy = cancelledByMe ? "您" : getPartnerName(collaboration);
                  
                  return (
                    <>
                      {cancelReason ? (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            bgcolor: "background.paper",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>取消原因：</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                            {cancelReason}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            由 {cancelledBy} 提出取消
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          未提供取消原因
                        </Typography>
                      )}
                    </>
                  );
                })()}
              </Paper>
            ))
          ) : (
            <Typography color="text.secondary">目前沒有已取消的合作</Typography>
          )}
        </Paper>
      </Box>

      {/* Existing dialogs */}      {/* 只保留一個 CollaborationEndReviewDialog，現在在 handleOpenReview 中我們使用 selectedCollaboration 和 endReviewType 狀態 */}
      <CollaborationEndReviewDialog
        open={!!selectedCollaboration && !!endReviewType}
        onClose={handleCloseEndReview}
        collaborationId={selectedCollaboration}
        endType={endReviewType || "complete"}
        partnerName={
          selectedCollaboration
            ? getPartnerName(
                acceptedCollaborations.find(
                  (c) => c.id === selectedCollaboration
                )
              )
            : undefined
        }
      />

      <CollaborationResponseDialog
        open={!!selectedResponseId}
        onClose={handleCloseResponse}
        collaborationId={selectedResponseId}
        partnerName={
          selectedResponseId
            ? getPartnerName(
                receivedRequests.find((req) => req.id === selectedResponseId)
              )
            : undefined
        }
      />

      <CancelCollaborationDialog
        open={!!selectedCancelId}
        onClose={handleCloseCancel}
        collaborationId={selectedCancelId}
        partnerName={
          selectedCancelId
            ? getPartnerName(
                acceptedCollaborations.find((c) => c.id === selectedCancelId)
              )
            : undefined
        }
        postTitle={
          selectedCancelId
            ? acceptedCollaborations.find((c) => c.id === selectedCancelId)
                ?.postTitle
            : undefined
        }
      />
      
      <AcceptCollaborationDialog
        open={!!selectedAcceptId}
        onClose={handleCloseAccept}
        collaborationId={selectedAcceptId}
        partnerName={
          selectedAcceptId
            ? getPartnerName(
                receivedRequests.find((req) => req.id === selectedAcceptId)
              )
            : undefined
        }
        postTitle={
          selectedAcceptId
            ? receivedRequests.find((req) => req.id === selectedAcceptId)
                ?.postTitle
            : undefined
        }      />

      {/* 提醒訊息顯示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setSnackbar({...snackbar, open: false})} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
