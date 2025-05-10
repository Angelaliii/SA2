import BusinessIcon from "@mui/icons-material/Business";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import {
  Avatar,
  Box,
  Card,
  CardActionArea,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authServices } from "../../firebase/services/auth-service";
import { clubServices } from "../../firebase/services/club-service";
import { companyServices } from "../../firebase/services/company-service";
import { subscriptionServices } from "../../firebase/services/subscription-service";

// 訂閱的組織數據結構
interface SubscribedOrganization {
  id: string; // 組織 ID
  subscriptionId: string; // 訂閱記錄 ID
  name: string;
  description?: string;
  logoURL?: string;
  type: "club" | "company";
}

const SubscribedOrganizations = () => {
  const [loading, setLoading] = useState(true);
  const [subscribedOrganizations, setSubscribedOrganizations] = useState<
    SubscribedOrganization[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  // 格式化日期顯示
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "無日期";
    try {
      return new Date(dateString).toLocaleDateString("zh-TW");
    } catch (err) {
      console.error("日期格式化錯誤:", err);
      return "日期格式錯誤";
    }
  };

  // 獲取訂閱組織資料
  useEffect(() => {
    const fetchSubscribedOrganizations = async () => {
      const currentUser = authServices.getCurrentUser();
      if (!currentUser) {
        setError("您需要登入才能查看訂閱的組織");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 獲取當前用戶的所有訂閱
        const subscriptions = await subscriptionServices.getUserSubscriptions(
          currentUser.uid
        );

        if (subscriptions.length === 0) {
          setSubscribedOrganizations([]);
          setLoading(false);
          return;
        }

        // 分類訂閱的組織類型
        const clubSubscriptions = subscriptions.filter(
          (sub) => sub.organizationType === "club"
        );
        const companySubscriptions = subscriptions.filter(
          (sub) => sub.organizationType === "company"
        );

        // 獲取所有社團和企業數據
        const allClubs = await clubServices.getAllClubs();
        const allCompanies = await companyServices.getAllCompanies();

        // 合併訂閱的社團資料
        const subscribedClubs = clubSubscriptions
          .map((subscription) => {
            const club = allClubs.find(
              (club) => club.id === subscription.organizationId
            );
            if (!club) return null;

            return {
              id: club.id,
              subscriptionId: subscription.id,
              name: club.clubName,
              description: club.clubDescription,
              logoURL: club.logoURL,
              type: "club" as const,
            };
          })
          .filter(Boolean) as SubscribedOrganization[];

        // 合併訂閱的企業資料
        const subscribedCompanies = companySubscriptions
          .map((subscription) => {
            const company = allCompanies.find(
              (company) => company.id === subscription.organizationId
            );
            if (!company) return null;

            return {
              id: company.id,
              subscriptionId: subscription.id,
              name: company.companyName,
              description: company.companyDescription,
              logoURL: company.logoURL,
              type: "company" as const,
            };
          })
          .filter(Boolean) as SubscribedOrganization[];

        // 合併所有訂閱的組織
        setSubscribedOrganizations([
          ...subscribedClubs,
          ...subscribedCompanies,
        ]);
      } catch (err) {
        console.error("獲取訂閱組織時出錯:", err);
        setError("獲取訂閱組織時出錯");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscribedOrganizations();
  }, []);

  // 取消訂閱組織
  const handleUnsubscribe = async (
    organizationId: string,
    subscriptionId: string
  ) => {
    const currentUser = authServices.getCurrentUser();
    if (!currentUser) return;

    try {
      await subscriptionServices.unsubscribeFromOrganization(
        currentUser.uid,
        organizationId
      );

      // 更新本地列表
      setSubscribedOrganizations((prev) =>
        prev.filter((org) => org.subscriptionId !== subscriptionId)
      );
    } catch (err) {
      console.error("取消訂閱時出錯:", err);
      setError("取消訂閱時出錯");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 4 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (subscribedOrganizations.length === 0) {
    return (
      <Box sx={{ my: 4 }}>
        <Typography>您尚未訂閱任何組織</Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {subscribedOrganizations.map((org) => (
        <Grid item xs={12} sm={6} md={4} key={org.subscriptionId}>
          <Card
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 20px rgba(0,0,0,0.1)",
              },
            }}
          >
            <CardActionArea
              component={Link}
              href={`/public-profile/${org.id}`}
              sx={{ flexGrow: 1 }}
            >
              <Box sx={{ p: 2, position: "relative" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Avatar
                    src={org.logoURL || ""}
                    alt={org.name}
                    sx={{
                      width: 50,
                      height: 50,
                      mr: 2,
                      bgcolor:
                        org.type === "club" ? "primary.main" : "secondary.main",
                    }}
                  >
                    {org.type === "club" ? <SchoolIcon /> : <BusinessIcon />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {org.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {org.type === "club" ? "社團" : "企業"}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    height: "4.5em",
                  }}
                >
                  {org.description ||
                    `此${org.type === "club" ? "社團" : "企業"}尚未提供介紹`}
                </Typography>
              </Box>
            </CardActionArea>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                p: 1,
                backgroundColor: "background.paper",
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Tooltip title="取消訂閱">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnsubscribe(org.id, org.subscriptionId);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SubscribedOrganizations;
