import { Box, IconButton, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { RootState } from "../../app/store";
import { useGetConnectionHistoryQuery, useGetSessionQuery } from "../../features/game/services/gameArena.Api";
import konnectLogo from "../../assets/Konnect-Logo.webp";

interface GameHeaderProps {
  title?: string;
  hideBackButton?: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({ title, hideBackButton }) => {
  const navigate = useNavigate();
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  
  const { data: sessionData } = useGetSessionQuery(sessionId as string, {
    skip: !sessionId,
  });

  const isGameStarted = sessionData?.status === "playing" || sessionData?.status === "paused";

  const { data: history = [] } = useGetConnectionHistoryQuery(undefined, {
    skip: !sessionId || !isGameStarted,
  });

  const displayTitle = title || sessionData?.companyName || "Konnect";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        p: 2,
        pt: 3,
        minHeight: "64px",
        color: "black",
      }}
    >
      {!hideBackButton && (
        <IconButton 
          onClick={() => navigate(-1)} 
          sx={{ 
            position: "absolute",
            left: 16,
            p: 0.5 
          }}
        >
          <ArrowBack />
        </IconButton>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <img 
          src={sessionData?.companyLogoUrl || konnectLogo} 
          alt="Logo" 
          style={{ height: '40px', objectFit: 'contain' }} 
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            fontSize: "24px",
            fontFamily: '"Josefin Sans", sans-serif',
          }}
        >
          {displayTitle}
        </Typography>
      </Box>

      {isGameStarted && (
        <Box
          sx={{
            position: "absolute",
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            bgcolor: "rgba(255, 124, 39, 0.12)",
            color: "#ff7c27",
            px: 1.5,
            py: 0.5,
            borderRadius: "16px",
            fontSize: "14px",
            fontWeight: "bold",
            boxShadow: "0px 2px 6px rgba(255, 124, 39, 0.1)",
          }}
        >
          <span>🔗</span>
          <span>{history.length}</span>
        </Box>
      )}
    </Box>
  );
};

export default GameHeader;
