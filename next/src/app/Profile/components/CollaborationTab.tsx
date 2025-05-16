"use client";

import HandshakeIcon from "@mui/icons-material/Handshake";
import { Box, Typography } from "@mui/material";
import CollaborationList from "../../../components/collaboration/CollaborationList";
import { ClientOnly } from "../../../hooks/useHydration";

export default function CollaborationTab() {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
          <HandshakeIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          合作記錄與請求
        </Typography>
      </Box>

      {/* 合作記錄列表 - 使用ClientOnly確保避免水合錯誤 */}
      <ClientOnly>
        <CollaborationList
          visibleTabs={["pending", "active", "review", "complete", "cancel"]}
        />
      </ClientOnly>
    </>
  );
}
