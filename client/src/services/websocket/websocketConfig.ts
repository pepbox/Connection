import store from "../../app/store";
// import { authApi } from "../../features/user/auth/authApi";
// import { updateSession } from "../../features/session/sessionSlice";
import { websocketService } from "./websocketService";
import { throttle } from "../../utils/throttle";
import { Events } from "./enums/Events";
import { gameApi } from "../../features/game/services/gameArena.Api";
import { adminApi } from "../../features/admin/services/admin.Api";

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
    "CONNECT_REQUEST",
    () => {
      console.log("Connect request received");
      store.dispatch(gameApi.util.invalidateTags(["Connection"]));
    },
    "redux"
  );

  websocketService.addGlobalListener(
    "CONNECT_RESPONSE",
    () => {
      console.log("Connect response received");
      store.dispatch(gameApi.util.invalidateTags(["Connection"]));
    },
    "redux"
  );

  websocketService.addGlobalListener(
    "PARTNER_SELFIE_UPLOADED",
    () => {
      console.log("Partner selfie uploaded");
      store.dispatch(gameApi.util.invalidateTags(["Connection"]));
    },
    "redux"
  );

  websocketService.addGlobalListener(
    "PARTNER_ANSWERS_SUBMITTED",
    () => {
      console.log("Partner answers submitted");
      store.dispatch(gameApi.util.invalidateTags(["Connection"]));
    },
    "redux"
  );

  websocketService.addGlobalListener(
    "CONNECTION_UPDATE",
    () => {
      console.log("Connection update received");
      store.dispatch(gameApi.util.invalidateTags(["Connection"]));
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
