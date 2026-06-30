import { createSlice } from '@reduxjs/toolkit';
import { SerializedError } from '@reduxjs/toolkit';
import { playerApi } from './player.api';

export interface IPlayer {
    name: string;
    profilePhoto?: string;
    session?: string;
    isAuthenticated?: boolean;
    teamNumber?: number;
}

const initialState = {
    player: null as IPlayer | null,
    isLoading: false,
    error: null as SerializedError | null,
    isAuthenticated: false,
};

const playerSlice = createSlice({
    name: 'Player',
    initialState,
    reducers: {
        setPlayer: (state, action) => {
            state.player = action.payload;
        },
        clearPlayer: (state) => {
            state.player = null;
        },
        logoutPlayer: (state) => {
            state.player = null;
            state.isAuthenticated = false;
            state.error = null;
            // Clear entire localStorage on logout
            if (typeof window !== 'undefined') {
                localStorage.clear();
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addMatcher(
                playerApi.endpoints.onboardPlayer.matchPending,
                (state) => {
                    state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                playerApi.endpoints.onboardPlayer.matchFulfilled,
                (state) => {
                    state.isLoading = false;
                    state.isAuthenticated = true;
                }
            )
            .addMatcher(
                playerApi.endpoints.onboardPlayer.matchRejected,
                (state, { error }) => {
                    state.isLoading = false;
                    state.error = error;
                }
            );

        builder
            .addMatcher(
                playerApi.endpoints.fetchPlayer.matchPending,
                (state) => {
                    state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                playerApi.endpoints.fetchPlayer.matchFulfilled,
                (state) => {
                    state.isLoading = false;
                    state.isAuthenticated = true;
                }
            )
            .addMatcher(
                playerApi.endpoints.fetchPlayer.matchRejected,
                (state, { error }) => {
                    state.isLoading = false;
                    state.error = error;
                }
            );



    },
});

export const { setPlayer, clearPlayer, logoutPlayer } = playerSlice.actions;

export default playerSlice.reducer;