// 草稿管理組件
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Box,
  Button,
  Chip,
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
import { DraftManagerProps } from "../../types/article";

/**
 * 草稿管理組件
 * 顯示用戶所有草稿，並提供載入和刪除功能
 */
export default function DraftManager({
  open,
  onClose,
  drafts,
  loading,
  onLoadDraft,
  onDeleteDraft,
}: DraftManagerProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>已儲存草稿</DialogTitle>
      <DialogContent dividers>
        {/* 載入中顯示 */}
        {loading ? (
          <Typography variant="body1" align="center" py={2}>
            正在載入草稿...
          </Typography>
        ) : drafts.length > 0 ? (
          // 草稿列表
          <List>
            {drafts.map((draft) => (
              <ListItem key={draft.id} disablePadding divider>
                <ListItemButton onClick={() => onLoadDraft(draft.id)}>
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
                    onClick={() => onDeleteDraft(draft.id)}
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
            您目前沒有已儲存的草稿
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
}
