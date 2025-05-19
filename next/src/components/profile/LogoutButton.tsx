"use client";

import LogoutIcon from "@mui/icons-material/Logout";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { auth } from "../../firebase/config";

export default function LogoutButton() {
  const [openLogoutDialog, setOpenLogoutDialog] = useState(false);

  const handleLogoutClick = () => {
    setOpenLogoutDialog(true);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // 清除保存在 sessionStorage 中的用戶身份狀態
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("isClubUser");
        sessionStorage.removeItem("isCompanyUser");
      }
      setOpenLogoutDialog(false);
      // 登出後導航到首頁
      window.location.href = "/";
    } catch (error) {
      console.error("登出時發生錯誤:", error);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{ fontWeight: "medium", mb: 2 }}
      >
        帳號管理
      </Typography>
      <Box width="100%" textAlign="center">
        <Button
          variant="contained"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogoutClick}
          sx={{
            mt: 1,
            py: 1,
            px: 3,
            boxShadow: "0 2px 8px rgba(211, 47, 47, 0.2)",
            "&:hover": {
              boxShadow: "0 4px 12px rgba(211, 47, 47, 0.3)",
            },
          }}
        >
          登出帳號
        </Button>
      </Box>

      {/* 登出確認對話框 */}
      <Dialog
        open={openLogoutDialog}
        onClose={() => setOpenLogoutDialog(false)}
      >
        <DialogTitle>確認登出</DialogTitle>
        <DialogContent>
          <DialogContentText>您確定要登出嗎？</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogoutDialog(false)}>取消</Button>
          <Button onClick={handleLogout} color="primary" autoFocus>
            確認登出
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
