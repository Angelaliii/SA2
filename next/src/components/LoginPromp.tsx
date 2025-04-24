"use client";

import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";

export default function LoginPrompt() {
  return (
    <Box
      sx={{
        mt: 17, // 推下來一點（對應 Navbar 高度）
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start", // 靠上
        textAlign: "center",
        minHeight: "calc(100vh - 64px)", // 預留畫面高度（減掉 Navbar）
      }}
    >
      <Image
        src="/image/LoginPrompt.png"
        alt="請先登入"
        width={300}
        height={300}
        style={{ marginBottom: "1rem" }}
      />
      <Typography variant="h6" sx={{ mb: 2 }}>
        請先登入才有此功能
      </Typography>
      <Button variant="contained" color="primary" href="/LoginPage">
        登入
      </Button>
    </Box>
  );
}
