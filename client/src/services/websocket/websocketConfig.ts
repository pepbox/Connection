import store from "../../app/store";
// import { authApi } from "../../features/user/auth/authApi";
// import { updateSession } from "../../features/session/sessionSlice";
import { websocketService } from "./websocketService";
import { throttle } from "../../utils/throttle";
import { Events } from "./enums/Events";
import { gameApi } from "../../features/game/services/gameArena.Api";
import { adminApi } from "../../features/admin/services/admin.Api";
import { logoutPlayer } from "../../features/player/services/player.slice";

export const setupGlobalListeners = () => {
  if ((setupGlobalListeners as any)._initialized) return;
  (setupGlobalListeners as any)._initialized = true;

  websocketService.addGlobalListener(
    // Make api to fetch session state
    Events.SESSION_UPDATE,
    () => {
      console.log("Session updated");
      store.dispatch(gameApi.util.invalidateTags(["GameSession"]));
    },
    "redux"
  );


  websocketService.addGlobalListener(
    Events.PLAYERS_UPDATE,
    throttle(() => {
      store.dispatch(adminApi.util.invalidateTags(["AdminPlayer"]));
    }, 3000),
    "redux"
  );

  websocketService.addGlobalListener(
    Events.PLAYER_SELFIE_UPDATE,
    throttle(() => {
      store.dispatch(adminApi.util.invalidateTags(["Selfie"]));
    }, 3000),
    "redux"
  );

  websocketService.addGlobalListener(
    Events.PLAYER_STAT_UPDATE,
    throttle(() => {
      store.dispatch(adminApi.util.invalidateTags(["GameCards", "GameCompletion"]));
    }, 3000),
    "redux"
  );

  websocketService.addGlobalListener(
    Events.PLAYER_REMOVED,
    () => {
      console.log("Player removed by admin, logging off...");
      const sessionId = store.getState().game.sessionId;
      store.dispatch(logoutPlayer());
      if (sessionId) {
        window.location.href = `/game/${sessionId}`;
      } else {
        window.location.href = "/";
      }
    },
    "redux"
  );
};

export const initializeWebSocket = async (
  serverUrl: string,
  authToken?: string
) => {
  try {
    const options: any = {};
    if (authToken) {
      options.auth = { token: authToken };
    }

    await websocketService.connect(serverUrl, options);
    setupGlobalListeners();
    console.log("Socket.IO initialized with global listeners");
  } catch (error) {
    console.error("Failed to initialize Socket.IO:", error);
    throw error;
  }
};
