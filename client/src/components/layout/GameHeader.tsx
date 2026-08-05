import { Box, IconButton, Typography } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { RootState } from "../../app/store";
import { useGetSessionQuery } from "../../features/game/services/gameArena.Api";
import konnectLogo from "../../assets/Konnect-Logo.webp";

interface GameHeaderProps {
  title?: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ title }) => {
  const navigate = useNavigate();
  const { sessionId } = useAppSelector((state: RootState) => state.game);
  
  const { data: sessionData } = useGetSessionQuery(sessionId as string, {
    skip: !sessionId,
  });

  const displayTitle = title || sessionData?.companyName || "Konnect";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2,
        pt: 3,
        color: "black",
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ p: 0.5 }}>
          <ArrowBack />
        </IconButton>
        <img 
          src={sessionData?.companyLogoUrl || konnectLogo} 
          alt="Logo" 
          style={{ height: '30px', marginLeft: '8px', objectFit: 'contain' }} 
        />
      </Box>
      <Typography
        variant="h6"
        textAlign="center"
        sx={{
          mx: "auto",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        {displayTitle}
      </Typography>
    </Box>
  );
};

export default GameHeader;
