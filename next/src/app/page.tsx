"use client";

import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import styles from "../assets/globals.module.css";
import Navbar from "../components/Navbar";

export default function Index() {
  return (
    <Box className={styles.page}>
      <Navbar />

      <main>
        {/* 封面區塊 */}
        <Box
          sx={{
            position: "relative",
            textAlign: "center",
            mb: 4,
            py: 4,
            maxWidth: "100%",
            height: 300,
          }}
        >
          <img
            src="/image/index_picture.png"
            alt="首頁封面圖"
            style={{
              height: "350px",
              objectFit: "contain",
            }}
          />
          <Typography variant="h4" sx={{ mt: 2, fontWeight: "bold" }}>
            找資源、找合作，從這裡開始！
          </Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            一站式媒合平台，串聯企業與社團，共創雙贏
          </Typography>
          <Box
            sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}
          >
            <Button
              variant="contained"
              color="primary"
              component={Link}
              href="/Artical/DemandList"
            >
              需求牆
            </Button>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/Profile"
            >
              個人資料
            </Button>
          </Box>
        </Box>
      </main>
    </Box>
  );
}
