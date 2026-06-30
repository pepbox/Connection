import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DashboardHeaderProps } from "../types/interfaces";
import { useAdminAuth } from "../services/useAdminAuth";
import LogoutIcon from "@mui/icons-material/Logout";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import DownloadIcon from "@mui/icons-material/Download";
import {
  useAdminLogoutMutation,
  useDownloadSessionSelfiesMutation,
} from "../services/admin.Api";
import GlobalButton from "../../../components/ui/button";
import { useAppDispatch, useAppSelector } from "../../../app/rootReducer";
import { RootState } from "../../../app/store";
import { clearAdmin } from "../services/adminSlice";

// Dashboard Header Component
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  data,
  onGameStatusChange,
  onTransactionsChange,
  transaction = false, // Default value for transaction
  isCheckingReadiness = false, // Default value for checking readiness
}) => {
  const [AdminLogout] = useAdminLogoutMutation();
  const [downloadSessionSelfies] = useDownloadSessionSelfiesMutation();
  const [isDownloading, setIsDownloading] = useState(false);
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  const dispatch = useAppDispatch();



  const handleLogout = () => {
    AdminLogout({})
      .unwrap()
      .then(() => {
        navigate(`/admin/${sessionId}/login`);
        dispatch(clearAdmin());
      })
      .catch((error) => {
        console.error("Logout failed:", error);
      });
  };

  const handleViewLeaderboard = () => {
    navigate(`/admin/${sessionId}/leaderboard`);
  };

  const handleDownloadSelfies = async () => {
    if (!sessionId) return;
    
    setIsDownloading(true);
    try {
      const blob = await downloadSessionSelfies(sessionId).unwrap();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `session-${sessionId}-selfies-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download selfies:', error);
      alert(error?.data?.message || 'Failed to download session data. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={4}
        py={2}
      >
        <Typography variant="h6" fontWeight="bold">
          Admin Dashboard
        </Typography>

        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="outlined"
            color="success"
            startIcon={isDownloading ? <CircularProgress size={16} /> : <DownloadIcon />}
            onClick={handleDownloadSelfies}
            disabled={isDownloading}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 500,
            }}
          >
            <Box
              sx={{
                display: { xs: "none", sm: "inline" },
              }}
            >
              {isDownloading ? 'Downloading...' : 'Download Data'}
            </Box>
          </Button>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<LeaderboardIcon />}
            onClick={handleViewLeaderboard}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 500,
            }}
          >
            <Box
              sx={{
                display: { xs: "none", sm: "inline" },
              }}
            >
              Leaderboard
            </Box>
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              border: "1px solid #FF6363",
              fontWeight: 500,
              color: "#FF6363",
            }}
          >
            <Box
              sx={{
                display: { xs: "none", sm: "inline" },
              }}
            >
              Log Out
            </Box>
          </Button>
        </Box>
      </Box>
      <Paper
        sx={{
          p: 3,
          px: 4,
          mb: 2,
          backgroundColor: "rgba(252, 166, 30, 0.10)",
          dropShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography
            variant="h3"
            fontWeight="bold"
            color="black"
            textAlign={"center"}
          >
            Admin Name - {admin?.name || data?.adminName || "Admin"}
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={2} sx={{ width: "100%" }}>
          {/* Controls & Actions */}
          <Box display="flex" gap={3} alignItems="center" flexWrap="wrap" mt={1}>
            {data?.gameStatus !== "playing" && data?.gameStatus !== "ended" ? (
              <GlobalButton
                fullWidth={false}
                disabled={isCheckingReadiness}
                onClick={() => onGameStatusChange?.("v2")}
                sx={{
                  bgcolor: "secondary.main",
                  color: "#FFFFFF",
                  "&:hover": { bgcolor: "secondary.dark" },
                }}
              >
                {isCheckingReadiness ? "Starting..." : "Start Game"}
              </GlobalButton>
            ) : (
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <Box sx={{ py: 1, px: 2, bgcolor: "secondary.light", borderRadius: 2, border: "1px solid #4FD1C5" }}>
                  <Typography variant="body1" fontWeight="bold" color="text.primary">
                    Active Mode: Connection Game
                  </Typography>
                </Box>
              </Box>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={transaction}
                  onChange={(e) => onTransactionsChange?.(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  Enable Transactions
                </Typography>
              }
              sx={{ ml: { xs: 0, sm: 2 } }}
            />
          </Box>
        </Box>
      </Paper>
    </>
  );
};

export default DashboardHeader;
