import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import React from "react";

interface DemandDraft {
  id: string;
  title: string;
  organizationName?: string;
  createdAt: string;
}

/**
 * 需求草稿管理組件
 * 顯示用戶所有需求草稿，並提供載入和刪除功能
 */
export default function DemandDraftManager({
  open,
  onClose,
  drafts,
  loading,
  onLoadDraft,
  onDeleteDraft,
}: {
  open: boolean;
  onClose: () => void;
  drafts: DemandDraft[];
  loading: boolean;
  onLoadDraft: (draftId: string) => Promise<void>;
  onDeleteDraft: (draftId: string) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>已儲存需求草稿</DialogTitle>
      <DialogContent dividers>
        {/* 載入中顯示 */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : drafts.length > 0 ? (
          // 草稿列表
          <List>
            {drafts.map((draft) => (
              <ListItem key={draft.id} disablePadding divider>
                <ListItemButton
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onLoadDraft(draft.id);
                  }}
                >
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
                              {draft.organizationName || "未知組織"} •
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
                  </Box>
                </ListItemButton>
                <ListItemSecondaryAction>
                  {" "}
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteDraft(draft.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          // 無草稿時顯示
          <Typography variant="body1" align="center" py={3}>
            您目前沒有已儲存的需求草稿
          </Typography>
        )}
      </DialogContent>{" "}
      <DialogActions>
        <Button
          onClick={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          關閉
        </Button>
      </DialogActions>
    </Dialog>
  );
}
