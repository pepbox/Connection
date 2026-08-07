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
        }}
      >
        <Box
          display="flex"
          justifyContent={{ xs: "center", sm: "space-between" }}
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
        
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" gap={{ xs: 1.5, sm: 2 }}>
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
              src={data.companyLogoUrl || konnectLogo}
              alt="Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </Box>
          <Typography
            variant="h3"
            fontWeight="bold"
            color="black"
            textAlign="center"
            sx={{ fontFamily: '"Josefin Sans", sans-serif', fontSize: { xs: "2rem", md: "2.5rem" } }}
          >
            {data.companyName || "Konnect"}
          </Typography>
        </Box>
        <Box
            sx={{
              backgroundColor: "#F7BC10",
              color: "black",
              px: 2,
              py: 0.75,
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: { xs: "0.875rem", md: "1.125rem" },
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              // boxShadow: "0px 4px 10px rgba(252, 166, 30, 0.3)",
              fontFamily: '"Josefin Sans", sans-serif',
              whiteSpace: "nowrap",
              ml: { xs: "auto", sm: "auto" },
              mr: { xs: "auto", sm: "unset" },
              width: "fit-content",
              mt: { xs: 2, sm: 0 },
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
