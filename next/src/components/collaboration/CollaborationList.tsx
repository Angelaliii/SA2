"use client";

import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useEffect, useState } from 'react';
import { collaborationService } from '../../firebase/services/collaboration-service';


interface CollaborationListProps {
  userType: 'club' | 'company' | 'unknown';
  onOpenReview: (collaborationId: string) => void;
}

interface CollaborationStats {
  totalCollaborations: number;
  averageRating: number;
  completedCollaborations: number;
}

export default function CollaborationList({
  userType,
  onOpenReview
}: CollaborationListProps) {
  const [loading, setLoading] = useState(true);
  const [collaborations, setCollaborations] = useState<any[]>([]);
  const [stats, setStats] = useState<CollaborationStats>({
    totalCollaborations: 0,
    averageRating: 0,
    completedCollaborations: 0
  });
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadCollaborations();
    loadStats();
  }, []);

  const loadCollaborations = async () => {
    try {
      const data = await collaborationService.getCollaborations();
      setCollaborations(data);
    } catch (error) {
      console.error('Error loading collaborations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await collaborationService.getCollaborationStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading collaboration stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      await collaborationService.exportCollaborationData();
    } catch (error) {
      console.error('Error exporting collaboration data:', error);
    }
  };

  const renderCollaborationStats = () => (
    <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Typography variant="h6" color="primary">
            {stats.totalCollaborations}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            總合作數量
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h6" color="primary">
            {stats.averageRating.toFixed(1)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            平均評分
          </Typography>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="h6" color="primary">
            {stats.completedCollaborations}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            已完成合作
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCollaborationList = () => {
    const filteredCollaborations = collaborations.filter(collab => {
      if (tabValue === 0) return true; // All
      if (tabValue === 1) return !collab.isCompleted; // Active
      return collab.isCompleted; // Completed
    });

    return (
      <>
        {filteredCollaborations.map((collab) => (
          <Card key={collab.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {collab.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                合作對象：{collab.partnerName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                開始日期：{new Date(collab.startDate).toLocaleDateString()}
              </Typography>
              {collab.isCompleted && (
                <Typography variant="body2" color="text.secondary">
                  結束日期：{new Date(collab.endDate).toLocaleDateString()}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                狀態：{collab.isCompleted ? '已完成' : '進行中'}
              </Typography>
            </CardContent>
            <CardActions>
              {!collab.isReviewed && collab.isCompleted && (
                <Button
                  size="small"
                  color="primary"
                  onClick={() => onOpenReview(collab.id)}
                >
                  評價合作
                </Button>
              )}
              {collab.isReviewed && (
                <Button size="small" disabled>
                  已評價
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
        {filteredCollaborations.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {tabValue === 0
              ? '尚無合作記錄'
              : tabValue === 1
              ? '目前沒有進行中的合作'
              : '尚無已完成的合作'}
          </Typography>
        )}
      </>
    );
  };

  return (
    <Box>
      {/* Stats Section */}
      {renderCollaborationStats()}

      {/* Export Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Tooltip title="匯出合作記錄">
          <IconButton onClick={handleExport} color="primary">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          aria-label="collaboration tabs"
        >
          <Tab label="全部" />
          <Tab label="進行中" />
          <Tab label="已完成" />
        </Tabs>
      </Box>

      {/* Collaboration List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderCollaborationList()
      )}
    </Box>
  );
}