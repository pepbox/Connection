import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GameState } from "../../../types";
import { gameApi } from "./gameArena.Api";

const initialState: GameState = {
  sessionId: null,
  isGameStarted: false,
  currentPlayer: null,
  totalSteps: 0,
  currentStep: 0,
  isLoading: false,
  error: null,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    setTotalSteps: (state, action: PayloadAction<number>) => {
      state.totalSteps = action.payload;
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    startGame: (state) => {
      state.isGameStarted = true;
    },
    resetGame: (_state) => {
      return initialState;
    },
    setSessionId: (state, action: PayloadAction<string | null>) => {
      state.sessionId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(gameApi.endpoints.getSession.matchPending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addMatcher(
        gameApi.endpoints.getSession.matchFulfilled,
        (state, { payload }) => {
          state.isLoading = false;
          state.isGameStarted = payload.status === "playing";
          state.sessionId = payload._id;
          state.gameVersion = 'v2';
          if (payload.status === 'ended') {
            console.log("Game has ended, clearing localStorage");
            localStorage.removeItem(`questionnaire_answers_v2_${state.sessionId}`);
          }
        }
      )
      .addMatcher(
        gameApi.endpoints.getSession.matchRejected,
        (state, { error }) => {
          state.isLoading = false;
          state.error = error;
        }
      );
  },
});

export const { setTotalSteps, setCurrentStep, startGame, resetGame, setSessionId } =
  gameSlice.actions;

export default gameSlice.reducer;
