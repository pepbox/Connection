import React, { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import waitingWebp from "../../../assets/Waiting-lobby-animation.webp";
import konnectLogo from "../../../assets/Konnect-Logo.webp";

import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../../app/hooks";
import { RootState } from "../../../app/store";
import { useGetSessionQuery } from "../services/gameArena.Api";

const WaitingAreaScreen: React.FC = () => {
  const isGameStarted = useAppSelector(
    (state: RootState) => state.game.isGameStarted
  );
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  const navigate = useNavigate();
  
  const { data: sessionData } = useGetSessionQuery(sessionId as string, {
    skip: !sessionId,
  });
  useEffect(() => {
    if (isGameStarted) {
      navigate(`/game/${sessionId}/arena`, { replace: true });
    }
  }, [isGameStarted, navigate, sessionId]);

  return (
    <Box
      sx={{
        overflow: "hidden",
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        margin: "0 auto",
        backgroundColor: "transparent",
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
        <img src={sessionData?.companyLogoUrl || konnectLogo} alt="Company Logo" style={{ maxHeight: '80px', maxWidth: '100%', objectFit: 'contain' }} />
      </Box>
      <Typography variant="h3" color="primary.main" fontWeight="800">
        {sessionData?.companyName || "Konnect"}
      </Typography>
      <Box
        component="img"
        sx={{
          width: "100%",
          maxWidth: "240px",
          height: "auto",
          objectFit: "contain",
          mt: 4,
          mb: 4,
        }}
        src={waitingWebp}
        alt="Waiting Lobby Animation"
      />
      <Typography variant="h5" fontWeight="bold" color="text.primary" textAlign="center">
        Waiting for other players...
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center" mt={1} px={3}>
        Sit tight! The game will begin as soon as everyone is ready.
      </Typography>
    </Box>
  );
};

export default WaitingAreaScreen;
