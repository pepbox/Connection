import { Route, Routes, useParams } from "react-router-dom";
import WaitingAreaScreen from "../features/game/components/WaitingAreaScreen";
import CaptureScreen from "../features/player/components/CaptureScreen";
import HomeScreen from "../features/player/components/HomeScreen";
import CustomQuestionsBuilder from "../features/question/v2/components/CustomQuestionsBuilder";
import V2IntroScreen from "../features/question/v2/components/V2IntroScreen";
import V2GameArenaPage from "../features/game/v2/pages/V2GameArenaPage";
import { useLazyFetchPlayerQuery } from "../features/player/services/player.api";
import { RootState } from "../app/store";
import { useEffect } from "react";
import Loader from "../components/ui/Loader";
import AuthWrapper from "../components/auth/AuthWrapper";
import { useAppDispatch, useAppSelector } from "../app/rootReducer";
import { setSessionId } from "../features/game/services/gameSlice";

const GameMain = () => {
  const [fetchUser, { isUninitialized, isLoading: isUserLoading }] = useLazyFetchPlayerQuery();
  const { isAuthenticated } = useAppSelector(
    (state: RootState) => state.player
  );
  const dispatch = useAppDispatch();
  const sessionId = useParams<{ sessionId: string }>().sessionId;

  useEffect(() => {
    dispatch(setSessionId(sessionId ?? ""));
  }, [dispatch, sessionId]);

  useEffect(() => {
    fetchUser({});
  }, [isAuthenticated, fetchUser]);

  if (isUninitialized || isUserLoading) {
    return <Loader />;
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
