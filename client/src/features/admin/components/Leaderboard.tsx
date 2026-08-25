import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SelfiesGallery from "./SelfiesGallery";
import { LeaderboardProps } from "../types/interfaces";
import { useAppSelector } from "../../../app/rootReducer";
import { RootState } from "../../../app/store";
import Loader from "../../../components/ui/Loader";
import konnectLogo from "../../../assets/Konnect-Logo.webp";

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
          p: { xs: 2, sm: 3 },
          mb: { xs: 2, sm: 3 },
          backgroundColor: "rgba(252, 166, 30, 0.10)",
          borderRadius: 0,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: { xs: "72px", sm: "96px" },
        }}
      >
        <IconButton
          onClick={handleBackToDashboard}
          sx={{
            position: "absolute",
            left: { xs: 16, sm: 24 },
            color: "text.primary",
            border: "1px solid rgba(0, 0, 0, 0.12)",
            borderRadius: "12px",
            p: 1.25,
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>

        <Box 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          gap={{ xs: 1, sm: 2 }}
          sx={{ width: "100%", px: { xs: 8, sm: 16 } }}
        >
          <Box
            sx={{
              width: { xs: 44, sm: 56 },
              height: { xs: 44, sm: 56 },
              borderRadius: "12px",
              backgroundColor: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={data.companyLogoUrl || konnectLogo}
              alt="Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            color="black"
            sx={{ 
              fontFamily: '"Josefin Sans", sans-serif', 
              fontSize: { xs: "1.375rem", sm: "2rem", md: "2.25rem" } 
            }}
          >
            {data.companyName || "Konnect"}
          </Typography>
        </Box>

        <Box
          sx={{
            position: "absolute",
            right: { xs: 16, sm: 24 },
            backgroundColor: "#F7BC10",
            color: "black",
            px: { xs: 1.5, sm: 2 },
            py: 0.75,
            borderRadius: "12px",
            fontWeight: "bold",
            fontSize: { xs: "0.875rem", md: "1.125rem" },
            fontFamily: '"Josefin Sans", sans-serif',
            whiteSpace: "nowrap",
            boxShadow: "0px 4px 12px rgba(247, 188, 16, 0.15)",
          }}
        >
          Konnects: {data.selfies.length}
        </Box>
      </Paper>

      <Box sx={{ px: { xs: 2, sm: 4 }, pb: 4 }}>
        <SelfiesGallery selfies={data.selfies} />
      </Box>
    </Box>
  );
};

export default Leaderboard;
