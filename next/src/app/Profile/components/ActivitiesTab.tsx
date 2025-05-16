"use client";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import EventIcon from "@mui/icons-material/Event";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Typography,
} from "@mui/material";
import ActivityDeleteDialog from "../../../components/activities/ActivityDeleteDialog";
import ActivityEditDialog from "../../../components/activities/ActivityEditDialog";
import ActivityFormDialog from "../../../components/activities/ActivityFormDialog";
import { useActivitiesData } from "../hooks/useActivitiesData";
import { formatDate } from "../utils/dateUtils";

export default function ActivitiesTab() {
  const {
    activities,
    activitiesLoading,
    selectedActivity,
    activityDialogOpen,
    activityEditDialogOpen,
    activityDeleteDialogOpen,
    setActivityDialogOpen,
    setActivityEditDialogOpen,
    setActivityDeleteDialogOpen,
    refreshActivities,
    handleEditActivity,
    handleDeleteActivity,
  } = useActivitiesData();

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <EventIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          活動管理
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setActivityDialogOpen(true)}
          sx={{ mt: 2 }}
        >
          新增活動
        </Button>
      </Box>

      {activitiesLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ mt: 3 }}>
          {activities.map((activity) => (
            <Paper
              key={activity.id}
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
                  {activity.title ?? activity.name}
                </Typography>
                <Box>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleEditActivity(activity)}
                    title="編輯活動"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteActivity(activity)}
                    title="刪除活動"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {activity.description ?? activity.content}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                活動日期：{formatDate(activity.date)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                活動類型：{activity.type ?? "未指定"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                參與人數：{activity.participants ?? "未指定"}
              </Typography>
              {activity.partnerCompany && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  合作企業：{activity.partnerCompany}
                </Typography>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                建立日期：{formatDate(activity.createdAt)}
              </Typography>
            </Paper>
          ))}
          {activities.length === 0 && (
            <Typography color="text.secondary">目前還沒有任何活動</Typography>
          )}
        </Box>
      )}

      {/* 活動相關對話框 */}
      <ActivityFormDialog
        open={activityDialogOpen}
        onClose={() => setActivityDialogOpen(false)}
        onSuccess={() => {
          setActivityDialogOpen(false);
          refreshActivities();
        }}
      />

      <ActivityEditDialog
        open={activityEditDialogOpen}
        onClose={() => setActivityEditDialogOpen(false)}
        onSuccess={() => {
          setActivityEditDialogOpen(false);
          refreshActivities();
        }}
        activity={selectedActivity}
      />

      <ActivityDeleteDialog
        open={activityDeleteDialogOpen}
        onClose={() => setActivityDeleteDialogOpen(false)}
        onSuccess={() => {
          setActivityDeleteDialogOpen(false);
          refreshActivities();
        }}
        activity={selectedActivity}
      />
    </>
  );
}
