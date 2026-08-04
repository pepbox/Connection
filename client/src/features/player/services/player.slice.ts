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
    isAuthenticated: typeof window !== 'undefined' && localStorage.getItem('playerToken') ? true : false,
    token: typeof window !== 'undefined' ? localStorage.getItem('playerToken') || null : null,
    refreshToken: typeof window !== 'undefined' ? localStorage.getItem('playerRefreshToken') || null : null,
};

const playerSlice = createSlice({
    name: 'Player',
    initialState,
    reducers: {
        setPlayer: (state, action) => {
            state.player = action.payload;
        },
        setPlayerToken: (state, action) => {
            state.token = action.payload.token;
            if (typeof window !== 'undefined') {
                localStorage.setItem('playerToken', action.payload.token);
            }
        },
        clearPlayer: (state) => {
            state.player = null;
        },
        logoutPlayer: (state) => {
            state.player = null;
            state.isAuthenticated = false;
            state.token = null;
            state.refreshToken = null;
            state.error = null;
            // Clear entire localStorage on logout
            if (typeof window !== 'undefined') {
                localStorage.clear();
                sessionStorage.clear();
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
                (state, action: any) => {
                    state.isLoading = false;
                    state.isAuthenticated = true;
                    if (action.payload) {
                        state.player = action.payload;
                        state.token = action.payload.token || null;
                        state.refreshToken = action.payload.refreshToken || null;
                        if (typeof window !== 'undefined') {
                            if (action.payload.token) {
                                localStorage.setItem('playerToken', action.payload.token);
                            }
                            if (action.payload.refreshToken) {
                                localStorage.setItem('playerRefreshToken', action.payload.refreshToken);
                            }
                        }
                    }
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
                (state, action: any) => {
                    state.isLoading = false;
                    state.isAuthenticated = true;
                    if (action.payload) {
                        state.player = action.payload;
                    }
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

export const { setPlayer, setPlayerToken, clearPlayer, logoutPlayer } = playerSlice.actions;

export default playerSlice.reducer;