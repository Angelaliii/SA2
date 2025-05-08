"use client";

import { ClientOnly } from "../hooks/useHydration";
import ArticleIcon from "@mui/icons-material/Article";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import EventIcon from "@mui/icons-material/Event";
import FolderIcon from "@mui/icons-material/Folder";
import PersonIcon from "@mui/icons-material/Person";
import HandshakeIcon from "@mui/icons-material/Handshake";
import {
  Box,
  Chip,
  Drawer,
  Typography,
  useTheme,
} from "@mui/material";
import { useState } from "react";

interface SideNavbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  drawerWidth?: number;
  hideTabs?: string[]; // 新增可選 props
}

export default function SideNavbar({
  setSearchTerm,
  selectedTag,
  setSelectedTag,
  drawerWidth = 240,
  hideTabs = [], // 預設為空
}: SideNavbarProps) {
  const theme = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 原始標籤清單
  const allTags = ["個人檔案", "已發佈文章", "我的收藏", "活動資訊", "合作記錄"];

  // 過濾要隱藏的標籤
  const availableTags = allTags.filter(tag => !hideTabs.includes(tag));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    const index = availableTags.indexOf(tag);
    setSearchTerm(index.toString());
  };

  const drawerContent = (
    <Box
      sx={{
        pt: 3,
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
          let icon;
          switch (tag) {
            case "個人檔案":
              icon = <PersonIcon fontSize="small" />;
              break;
            case "已發佈文章":
              icon = <ArticleIcon fontSize="small" />;
              break;
            case "活動資訊":
              icon = <EventIcon fontSize="small" />;
              break;
            case "我的收藏":
              icon = <BookmarksIcon fontSize="small" />;
              break;
            case "合作記錄":
              icon = <HandshakeIcon fontSize="small" />;
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
      <ClientOnly>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              borderRight: "1px solid rgba(0, 0, 0, 0.08)",
              position: "fixed",
              top: { xs: "56px", sm: "64px" },
              height: "calc(100% - 64px)",
              overflowY: "hidden",
              backgroundColor: theme.palette.background.default,
              zIndex: theme.zIndex.drawer,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </ClientOnly>
    </Box>
  );
}
