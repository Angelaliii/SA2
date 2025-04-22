"use client";

import ArticleIcon from "@mui/icons-material/Article";
import EventIcon from "@mui/icons-material/Event";
import FolderIcon from "@mui/icons-material/Folder";
import HandshakeIcon from "@mui/icons-material/Handshake";
import PersonIcon from "@mui/icons-material/Person";
import {
  Box,
  Chip,
  Drawer,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";

interface SideNavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  drawerWidth?: number;
}

export default function SideNavbar({
  searchTerm,
  setSearchTerm,
  selectedTag,
  setSelectedTag,
  drawerWidth = 240,
}: SideNavbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  // 直接在組件內部定義標籤列表
  const availableTags = ["個人檔案", "已發佈文章", "合作紀錄", "活動資訊"];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // 處理標籤點擊，設置選中的標籤
  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    // 根據標籤設置對應的索引值
    const index = availableTags.indexOf(tag);
    // 如果 setSearchTerm 是用來設置 tab index 的，也可以更新它
    setSearchTerm(index.toString());
  };

  const drawerContent = (
    <Box
      sx={{
        p: 3,
        width: drawerWidth,
        height: "100%",
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 3, fontWeight: "bold", color: theme.palette.primary.main }}
      >
        個人中心
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {availableTags.map((tag) => {
          // Determine the appropriate icon for each tag
          let icon;
          switch (tag) {
            case "個人檔案":
              icon = <PersonIcon fontSize="small" />;
              break;
            case "已發佈文章":
              icon = <ArticleIcon fontSize="small" />;
              break;
            case "合作紀錄":
              icon = <HandshakeIcon fontSize="small" />;
              break;
            case "活動資訊":
              icon = <EventIcon fontSize="small" />;
              break;
            default:
              icon = <FolderIcon fontSize="small" />;
          }

          return (
            <Chip
              key={tag}
              label={tag}
              icon={icon}
              color={selectedTag === tag ? "primary" : "default"}
              onClick={() => handleTagClick(tag)}
              clickable
              sx={{
                mb: 0.5,
                py: 0.5,
                borderRadius: "4px",
                fontWeight: selectedTag === tag ? "bold" : "normal",
                boxShadow: selectedTag === tag ? 1 : 0,
                position: "relative",
                pl: selectedTag === tag ? 0.5 : 1,
                "&:before":
                  selectedTag === tag
                    ? {
                        content: '""',
                        position: "absolute",
                        left: 0,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "4px",
                        height: "70%",
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: "2px",
                      }
                    : {},
                "&:hover": {
                  backgroundColor:
                    selectedTag === tag
                      ? theme.palette.primary.light
                      : theme.palette.action.hover,
                },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Permanent drawer for desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "1px solid rgba(0, 0, 0, 0.08)",
            top: "64px", // 確保抽屜從頂部導航欄下方開始
            height: "calc(100% - 64px)",
            overflowY: "visible", // 移除滾動條
            overflowX: "visible",
            backgroundColor: theme.palette.background.default,
            zIndex: (theme) => theme.zIndex.drawer, // 設定合適的 z-index
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}
