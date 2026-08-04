import React, { useEffect } from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import GameMain from "./pages/gameMain";
import AdminMain from "./pages/adminMain";
import { initializeWebSocket } from "./services/websocket/websocketConfig";
import { websocketService } from "./services/websocket/websocketService";
import { useAdminAuth } from "./features/admin/services/useAdminAuth";
import { useAppSelector, useAppDispatch } from "./app/rootReducer";
import { RootState } from "./app/store";
import { useGetSessionQuery, usePlayerLogoutMutation } from "./features/game/services/gameArena.Api";
import { useAdminLogoutMutation } from "./features/admin/services/admin.Api";
import { clearAdmin } from "./features/admin/services/adminSlice";
import { logoutPlayer } from "./features/player/services/player.slice";
import Default from "./components/ui/Default";

const getSessionIdFromPath = (): string | undefined => {
  const segments = window.location.pathname.split("/");
  if ((segments[1] === "game" || segments[1] === "admin") && segments[2]) {
    return segments[2];
  }
  return undefined;
};

const App: React.FC = () => {
  const sessionId = getSessionIdFromPath();
  const { data: sessionData } = useGetSessionQuery(sessionId, { skip: !sessionId });
  const { isAuthenticated: isAdminAuthenticated } = useAdminAuth();
  const { isAuthenticated: isUserAuthenticated } = useAppSelector(
    (state: RootState) => state.player
  );
  const dispatch = useAppDispatch();
  const [playerLogout] = usePlayerLogoutMutation();
  const [adminLogout] = useAdminLogoutMutation();

  // Watch for session ending status
  useEffect(() => {
    if (sessionData && sessionData.status === "ended") {
      console.warn("The session has ended. Performing cleanup and logout...");

      const performCleanup = async () => {
        if (isAdminAuthenticated) {
          try {
            await adminLogout().unwrap();
          } catch (err) {
            console.error("Admin remote logout failed:", err);
          }
          dispatch(clearAdmin());
        }

        if (isUserAuthenticated) {
          try {
            await playerLogout().unwrap();
          } catch (err) {
            console.error("Player remote logout failed:", err);
          }
          dispatch(logoutPlayer());
        }

        // Clear client side storage completely
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }
      };

      performCleanup();
    }
  }, [sessionData, isAdminAuthenticated, isUserAuthenticated, dispatch, playerLogout, adminLogout]);

  useEffect(() => {
    const initWS = async () => {
      try {
        const serverUrl = import.meta.env.VITE_BACKEND_WEBSOCKET_URL;
        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("playerToken") ||
          undefined;
        await initializeWebSocket(serverUrl, token);
      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error);
      }
    };

    if (isAdminAuthenticated || isUserAuthenticated) {
      initWS();
    }
    return () => {
      websocketService.disconnect();
    };
  }, [isAdminAuthenticated, isUserAuthenticated]);

  return (
    <Routes>
      <Route path="/game/:sessionId/*" element={<GameMain />} />
      <Route path="/admin/:sessionId/*" element={<AdminMain />} />

      {/* Redirect to game main if no specific path is matched */}
      <Route path="*" element={<Default />} />

      {/* 404 page */}
      {/* <Route path="*" element={<NotFoundPage />} />  */}
    </Routes>
  );
};

export default App;
