import { Route, Routes, useParams } from "react-router-dom";
import WaitingAreaScreen from "../features/game/components/WaitingAreaScreen";
import CaptureScreen from "../features/player/components/CaptureScreen";
import HomeScreen from "../features/player/components/HomeScreen";
import CustomQuestionsBuilder from "../features/question/v2/components/CustomQuestionsBuilder";
import V2IntroScreen from "../features/question/v2/components/V2IntroScreen";
import V2GameArenaPage from "../features/game/v2/pages/V2GameArenaPage";
import { useLazyFetchPlayerQuery } from "../features/player/services/player.api";
import { useGetSessionQuery, usePlayerLogoutMutation } from "../features/game/services/gameArena.Api";
import { RootState } from "../app/store";
import { useEffect } from "react";
import Loader from "../components/ui/Loader";
import AuthWrapper from "../components/auth/AuthWrapper";
import { useAppDispatch, useAppSelector } from "../app/rootReducer";
import { setSessionId } from "../features/game/services/gameSlice";
import { logoutPlayer } from "../features/player/services/player.slice";
import { Box, Typography } from "@mui/material";
import PauseIcon from "@mui/icons-material/Pause";

const GameMain = () => {
  const [fetchUser, { isUninitialized, isLoading: isUserLoading }] = useLazyFetchPlayerQuery();
  const [playerLogout] = usePlayerLogoutMutation();
  const { isAuthenticated, player } = useAppSelector(
    (state: RootState) => state.player
  );
  const dispatch = useAppDispatch();
  const sessionId = useParams<{ sessionId: string }>().sessionId;

  const { data: sessionData } = useGetSessionQuery(sessionId as string, {
    skip: !sessionId,
  });

  useEffect(() => {
    dispatch(setSessionId(sessionId ?? ""));
  }, [dispatch, sessionId]);

  useEffect(() => {
    fetchUser({});
  }, [isAuthenticated, fetchUser]);

  // Session verification: Ensure logged-in player belongs to the requested route session
  useEffect(() => {
    if (isAuthenticated && player && player.session && sessionId) {
      const playerSessionId =
        typeof player.session === "object" && player.session !== null
          ? (player.session as any)._id?.toString() || (player.session as any).id?.toString()
          : player.session.toString();

      if (playerSessionId !== sessionId.toString()) {
        console.warn("Session ID mismatch! Logging out player from current session view.");
        playerLogout();
        dispatch(logoutPlayer());
      }
    }
  }, [isAuthenticated, player, sessionId, dispatch, playerLogout]);

  if (isUninitialized || isUserLoading) {
    return <Loader />;
  }

  if ((sessionData?.status as string) === "paused") {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fffdf0",
          px: 3,
          py: 4,
          textAlign: "center"
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            backgroundColor: "rgba(252, 166, 30, 0.15)",
            color: "#FCA61E",
            mb: 4,
            animation: "pulse 2s infinite ease-in-out",
            "@keyframes pulse": {
              "0%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(252, 166, 30, 0.4)" },
              "70%": { transform: "scale(1.05)", boxShadow: "0 0 0 12px rgba(252, 166, 30, 0)" },
              "100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(252, 166, 30, 0)" }
            }
          }}
        >
          <PauseIcon sx={{ fontSize: 44 }} />
        </Box>
        <Typography
          variant="h4"
          fontWeight="bold"
          color="text.primary"
          sx={{ fontFamily: '"Josefin Sans", sans-serif', mb: 2 }}
        >
          Game Paused
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ fontFamily: '"Josefin Sans", sans-serif', maxWidth: "340px", mx: "auto" }}
        >
          The game organizer has paused the session. Please stand by, the game will resume shortly.
        </Typography>
      </Box>
    );
  }

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        minHeight: "100dvh",
        background: "#FFFFFF",
      }}
    >
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/capture" element={<CaptureScreen />} />
        {/* AuthWrapper parent uses path="" to avoid shadowing the HomeScreen "/" route */}
        <Route
          path=""
          element={
            <AuthWrapper
              userType={"player"}
              redirection={`/game/${sessionId}`}
            />
          }
        >
          <Route path="/intro" element={<V2IntroScreen />} />
          <Route path="/custom-questions" element={<CustomQuestionsBuilder />} />
          <Route path="/waiting" element={<WaitingAreaScreen />} />
          <Route path="/arena" element={<V2GameArenaPage />} />
        </Route>
      </Routes>
    </div>
  );
};

export default GameMain;
