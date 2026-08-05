import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SelfiesGallery from "./SelfiesGallery";
import { LeaderboardProps } from "../types/interfaces";
import { useAppSelector } from "../../../app/rootReducer";
import { RootState } from "../../../app/store";
import Loader from "../../../components/ui/Loader";

const Leaderboard: React.FC<LeaderboardProps> = ({ data, isLoading }) => {
  const navigate = useNavigate();
  const { sessionId } = useAppSelector((state: RootState) => state.game);

  const handleBackToDashboard = () => {
    navigate(`/admin/${sessionId}/dashboard`);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (!data) {
    return (
      <Box sx={{ p: 4, textAlign: "center", my:"auto"}}>
        <Typography variant="h6" color="error">
          Failed to load leaderboard data
        </Typography>
        <Button
          variant="contained"
          onClick={handleBackToDashboard}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          backgroundColor: "rgba(252, 166, 30, 0.10)",
          borderRadius: 0,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToDashboard}
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              fontWeight: 500,
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
        
        <Box display="flex" flexDirection="row" alignItems="center" justifyContent="center" gap={2}>
          {data.companyLogoUrl ? (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "16px",
                boxShadow: "0px 6px 12px rgba(30, 58, 138, 0.15)",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <img
                src={data.companyLogoUrl}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </Box>
          ) : data.companyName ? (
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "16px",
                boxShadow: "0px 6px 12px rgba(30, 58, 138, 0.15)",
                backgroundColor: "#1e3a8a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="h5" sx={{ color: "#fff", fontWeight: "bold", fontFamily: '"Josefin Sans", sans-serif' }}>
                {data.companyName.charAt(0).toUpperCase()}
              </Typography>
            </Box>
          ) : null}
          <Typography
            variant="h3"
            fontWeight="bold"
            color="black"
            textAlign="center"
            sx={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: { xs: "2rem", md: "2.5rem" } }}
          >
            {data.companyName || "Players Selfie"}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ px: 4, pb: 4 }}>
        <SelfiesGallery selfies={data.selfies} />
      </Box>
    </Box>
  );
};

export default Leaderboard;
