"use client";

import { Box, Grid, Paper, Typography } from "@mui/material";
import React from "react";
import { Company } from "../../firebase/services/company-service";

interface ReadOnlyCompanyProfileProps {
  companyData: Company;
}

const ReadOnlyCompanyProfile: React.FC<ReadOnlyCompanyProfileProps> = ({
  companyData,
}) => {
  return (
    <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        企業資料
      </Typography>

      <Grid container spacing={2}>
        {companyData.logoURL && (
          <Grid item xs={12} display="flex" justifyContent="center" mb={2}>
            <Box
              component="img"
              src={companyData.logoURL}
              alt={`${companyData.companyName}的標誌`}
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
            <strong>企業名稱：</strong> {companyData.companyName}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>統一編號：</strong> {companyData.businessId}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>產業類型：</strong> {companyData.industryType}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>聯絡人姓名：</strong> {companyData.contactName}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>聯絡電話：</strong> {companyData.contactPhone}
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography>
            <strong>電子郵件：</strong> {companyData.email}
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography sx={{ mt: 2 }}>
            <strong>企業簡介：</strong>
          </Typography>
          <Typography sx={{ whiteSpace: "pre-line" }}>
            {companyData.companyDescription}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReadOnlyCompanyProfile;
