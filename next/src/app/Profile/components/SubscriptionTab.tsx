"use client";

import SubscriptionsIcon from "@mui/icons-material/Subscriptions";
import { Box, Typography } from "@mui/material";
import SubscribedOrganizations from "../../../components/profile/SubscribedOrganizations";

export default function SubscriptionTab() {
  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <SubscriptionsIcon sx={{ mr: 1, verticalAlign: "middle" }} />
          已訂閱組織
        </Typography>
      </Box>
      <SubscribedOrganizations />
    </>
  );
}
