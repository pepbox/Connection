import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DashboardHeaderProps } from "../types/interfaces";
import { useAdminAuth } from "../services/useAdminAuth";
import LogoutIcon from "@mui/icons-material/Logout";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  useAdminLogoutMutation,
  useDownloadSessionSelfiesMutation,
  useUploadSessionLogoMutation,
  useUpdateSessionMutation
} from "../services/admin.Api";
import GlobalButton from "../../../components/ui/button";
import { useAppDispatch, useAppSelector } from "../../../app/rootReducer";
import { RootState } from "../../../app/store";
import { clearAdmin } from "../services/adminSlice";

// Dashboard Header Component
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  data,
  onGameStatusChange,
  isCheckingReadiness = false, // Default value for checking readiness
  onPauseGame,
  onResumeGame,
}) => {
  const [AdminLogout] = useAdminLogoutMutation();
  const [downloadSessionSelfies] = useDownloadSessionSelfiesMutation();
  const [uploadSessionLogo] = useUploadSessionLogoMutation();
  const [updateSession] = useUpdateSessionMutation();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { admin } = useAdminAuth();
  const navigate = useNavigate();
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  const dispatch = useAppDispatch();

  const [companyName, setCompanyName] = useState(data?.companyName || "");
  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: "" });
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleOpenEdit = () => {
    setCompanyName(data?.companyName || "");
    setSelectedLogo(null);
    setStatus({ type: null, message: "" });
    setIsEditOpen(true);
  };

  const handleLogout = () => {
    AdminLogout()
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
    window.open(`/admin/${sessionId}/leaderboard`, "_blank");
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedLogo(event.target.files[0]);
      setStatus({ type: null, message: "" });
    }
  };

  const handleSaveBranding = async () => {
    if (!sessionId) return;
    setIsUploading(true);
    setStatus({ type: null, message: "" });
    try {
      if (companyName !== data?.companyName) {
        await updateSession({ sessionId, companyName }).unwrap();
      }
      if (selectedLogo) {
        await uploadSessionLogo({ sessionId, file: selectedLogo }).unwrap();
        setSelectedLogo(null);
      }
      setStatus({ type: 'success', message: 'Session branding updated successfully!' });
      setTimeout(() => {
        setIsEditOpen(false);
      }, 1200);
    } catch (error: any) {
      console.error('Failed to update branding:', error);
      setStatus({ type: 'error', message: error?.data?.message || 'Failed to update branding. Please try again.' });
    } finally {
      setIsUploading(false);
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
              Players Selfie 
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
      <Box sx={{ display: 'flex', gap: 2, px: 4, mb: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-start' } }}>
        
        {/* Left Section: Admin Controls */}
        <Paper
          sx={{
            p: 3,
            flex: 2,
            backgroundColor: "rgba(252, 166, 30, 0.10)",
            borderRadius: "24px",
            border: "1px solid rgba(252, 166, 30, 0.15)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column",
            minHeight: "135px",
            justifyContent: "center"
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h3"
              fontWeight="bold"
              color="black"
              textAlign={"center"}
              sx={{ fontSize: { xs: "1.8rem", sm: "2.2rem" } }}
            >
              Admin Name - {admin?.name || data?.adminName || "Admin"}
            </Typography>
          </Box>

          <Box display="flex" flexDirection="column" gap={2} sx={{ width: "100%" }}>
            {/* Controls & Actions */}
             <Box display="flex" gap={3} alignItems="center" flexWrap="wrap" justifyContent="center">
              {data?.gameStatus !== "playing" && data?.gameStatus !== "ended" && data?.gameStatus !== "paused" ? (
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
                  {data?.gameStatus === "playing" && (
                    <GlobalButton
                      fullWidth={false}
                      onClick={() => onPauseGame?.()}
                      sx={{
                        bgcolor: "secondary.main",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "secondary.dark" },
                      }}
                    >
                      Pause Game
                    </GlobalButton>
                  )}
                  {data?.gameStatus === "paused" && (
                    <GlobalButton
                      fullWidth={false}
                      onClick={() => onResumeGame?.()}
                      sx={{
                        bgcolor: "secondary.main",
                        color: "#FFFFFF",
                        "&:hover": { bgcolor: "secondary.dark" },
                      }}
                    >
                      Resume Game
                    </GlobalButton>
                  )}
                  {/* <Box sx={{ py: 1, px: 2, bgcolor: "secondary.light", borderRadius: 2, border: "1px solid #4FD1C5" }}>
                    <Typography variant="body1" fontWeight="bold" color="text.primary">
                      Active Mode: Konnect Game ({data?.gameStatus === "paused" ? "PAUSED" : "PLAYING"})
                    </Typography>
                  </Box> */}
                </Box>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Right Section: Compact Session Branding Card (matching mockup) */}
        <Paper
          sx={{
            p: 3,
            flex: 1.2,
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.03)",
            display: "flex",
            flexDirection: "column",
            minWidth: { md: "380px" },
          }}
        >
          {/* Header Row */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Josefin Sans", sans-serif',
                fontWeight: 800,
                color: "#1e293b",
                fontSize: "1.2rem",
              }}
            >
              Session Branding
            </Typography>
            <IconButton onClick={handleOpenEdit} size="small" sx={{ color: "#64748b" }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Logo & Info Row */}
          <Box display="flex" alignItems="center" gap={2} mt={3}>
            {/* Logo Wrapper */}
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "18px",
                boxShadow: "0px 8px 16px rgba(30, 58, 138, 0.15)",
                backgroundColor: data?.companyLogoUrl ? "transparent" : "#1e3a8a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid rgba(0, 0, 0, 0.05)"
              }}
            >
              {data?.companyLogoUrl ? (
                <img
                  src={data.companyLogoUrl}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <Typography variant="h5" sx={{ color: "#fff", fontWeight: "bold", fontFamily: '"Josefin Sans", sans-serif' }}>
                  {(data?.companyName || "K").charAt(0).toUpperCase()}
                </Typography>
              )}
            </Box>

            {/* Text Stack */}
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Josefin Sans", sans-serif',
                  fontWeight: 700,
                  color: "#94a3b8",
                  letterSpacing: "1px",
                  fontSize: "0.75rem",
                  textTransform: "uppercase"
                }}
              >
                Company Name
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Josefin Sans", sans-serif',
                  fontWeight: 800,
                  color: "#1e293b",
                  fontSize: "1.15rem",
                  lineHeight: 1.2
                }}
              >
                {data?.companyName || "Konnect"}
              </Typography>
            </Box>
          </Box>
        </Paper>

      </Box>

      {/* Edit Session Branding Dialog */}
      <Dialog
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "20px", p: 1 }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 800, pb: 1 }}>
          Edit Session Branding
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1.5 }}>
          <TextField
            label="Company Name"
            variant="outlined"
            size="small"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            fullWidth
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
              },
              "& .MuiInputLabel-root": {
                fontFamily: '"Josefin Sans", sans-serif',
              },
              "& .MuiOutlinedInput-input": { fontFamily: '"Josefin Sans", sans-serif' }
            }}
          />

          {/* Logo Upload & Preview Zone */}
          <Box
            sx={{
              border: "2px dashed",
              borderColor: selectedLogo || data?.companyLogoUrl ? "primary.main" : "rgba(45, 43, 41, 0.2)",
              borderRadius: "12px",
              height: "120px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              backgroundColor: "rgba(0, 0, 0, 0.02)",
              cursor: "pointer",
              overflow: "hidden",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "primary.main",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              }
            }}
            component="label"
          >
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleLogoChange}
            />
            {selectedLogo || data?.companyLogoUrl ? (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1.5,
                }}
              >
                <img
                  src={selectedLogo ? URL.createObjectURL(selectedLogo) : data?.companyLogoUrl}
                  alt="Logo Preview"
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    objectFit: "contain",
                  }}
                />
                {selectedLogo && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedLogo(null);
                      setStatus({ type: null, message: "" });
                    }}
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
                      "&:hover": { backgroundColor: "#fff" },
                    }}
                  >
                    <DeleteIcon fontSize="small" color="error" />
                  </IconButton>
                )}
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                <UploadIcon sx={{ color: "rgba(45, 43, 41, 0.4)", fontSize: "2rem" }} />
                <Typography variant="body2" sx={{ fontFamily: '"Josefin Sans", sans-serif', fontWeight: 600, color: "rgba(45, 43, 41, 0.7)", fontSize: "0.85rem" }}>
                  Click to upload logo
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: '"Josefin Sans", sans-serif', color: "rgba(45, 43, 41, 0.5)", fontSize: "0.75rem" }}>
                  PNG, JPG or SVG (Max 5MB)
                </Typography>
              </Box>
            )}
          </Box>

          {selectedLogo && (
            <Typography variant="caption" noWrap sx={{ fontFamily: '"Josefin Sans", sans-serif', color: "#2d2b29", fontSize: "0.75rem", textAlign: "center", display: "block" }}>
              Staged: {selectedLogo.name}
            </Typography>
          )}

          {status.type && (
            <Typography variant="caption" sx={{ fontFamily: '"Josefin Sans", sans-serif', color: status.type === 'success' ? '#2e7d32' : '#d32f2f', fontSize: "0.8rem", textAlign: "center", display: "block", fontWeight: 500 }}>
              {status.message}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsEditOpen(false)} sx={{ fontFamily: '"Josefin Sans", sans-serif', textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveBranding}
            disabled={isUploading || (!selectedLogo && companyName === (data?.companyName || ''))}
            startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            sx={{
              fontFamily: '"Josefin Sans", sans-serif',
              textTransform: "none",
              backgroundColor: "secondary.main",
              color: "secondary.contrastText",
              boxShadow: "none",
              borderRadius: "8px",
              "&:hover": { backgroundColor: "secondary.dark" }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DashboardHeader;
