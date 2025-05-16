"use client";

import { Box, Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { Club } from "../../firebase/services/club-service";

interface ReadOnlyClubProfileProps {
  clubData: Club;
}

const ReadOnlyClubProfile: React.FC<ReadOnlyClubProfileProps> = ({
  clubData,
}) => {
  return (
    <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        社團資料
      </Typography>

      <Grid container spacing={2}>
        {clubData.logoURL && (
          <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
            <Box
              component="img"
              src={clubData.logoURL}
              alt={`${clubData.clubName}的標誌`}
              sx={{
                width: 120,
                height: 120,
                objectFit: "contain",
                borderRadius: "50%",
              }}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>社團名稱：</strong> {clubData.clubName}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>學校名稱：</strong> {clubData.schoolName}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>社團類型：</strong> {clubData.clubType}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>聯絡人姓名：</strong> {clubData.contactName}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>聯絡電話：</strong> {clubData.contactPhone}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>電子郵件：</strong> {clubData.email}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography sx={{ mt: 2 }}>
            <strong>社團簡介：</strong>
          </Typography>
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {clubData.clubDescription}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReadOnlyClubProfile;
