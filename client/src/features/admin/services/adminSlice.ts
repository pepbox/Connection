import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SerializedError } from '@reduxjs/toolkit';
import { adminApi } from './admin.Api';

export interface AdminUser {
    id: string;
    name: string;
    sessionId?: string;
}

export interface AdminState {
    admin: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: SerializedError | null;
    token: string | null;
    refreshToken: string | null;
}

const initialState: AdminState = {
    admin: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    token: localStorage.getItem('adminToken') || null,
    refreshToken: localStorage.getItem('adminRefreshToken') || null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        setAdmin: (state, action: PayloadAction<AdminUser>) => {
            state.admin = action.payload;
            state.isAuthenticated = true;
            state.error = null;
        },
        setToken: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
            state.token = action.payload.token;
            localStorage.setItem('adminToken', action.payload.token);
            if (action.payload.refreshToken) {
                state.refreshToken = action.payload.refreshToken;
                localStorage.setItem('adminRefreshToken', action.payload.refreshToken);
            }
        },
        clearAdmin: (state) => {
            state.admin = null;
            state.isAuthenticated = false;
            state.token = null;
            state.refreshToken = null;
            state.error = null;
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
        },
        clearError: (state) => {
            state.error = null;
        },
        // Action to initialize auth state from localStorage
        initializeAuth: (state) => {
            const token = localStorage.getItem('adminToken');
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (token) {
                state.token = token;
                state.isAuthenticated = true;
            }
            if (refreshToken) {
                state.refreshToken = refreshToken;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Handle admin login
            .addMatcher(
                adminApi.endpoints.adminLogin.matchPending,
                (state) => {
                    state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                adminApi.endpoints.adminLogin.matchFulfilled,
                (state, action: any) => {
                    state.isLoading = false;
                    if (action.payload.success) {
                        if (action.payload.data?.admin) {
                            state.admin = action.payload.data.admin;
                        }
                        if (action.payload.data?.token) {
                            state.token = action.payload.data.token;
                            localStorage.setItem('adminToken', action.payload.data.token);
                        }
                        if (action.payload.data?.refreshToken) {
                            state.refreshToken = action.payload.data.refreshToken;
                            localStorage.setItem('adminRefreshToken', action.payload.data.refreshToken);
                        }
                        state.isAuthenticated = true;
                        state.error = null;
                    }
                }
            )
            .addMatcher(
                adminApi.endpoints.adminLogin.matchRejected,
                (state, action: any) => {
                    state.isLoading = false;
                    state.error = action.error;
                    state.isAuthenticated = false;
                    state.admin = null;
                    state.token = null;
                    state.refreshToken = null;
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRefreshToken');
                }
            );


        builder
            .addMatcher(
                adminApi.endpoints.fetchAdmin.matchPending,
                (state) => {
                    state.error = null;
                    state.isLoading = true;
                }
            )
            .addMatcher(
                adminApi.endpoints.fetchAdmin.matchFulfilled,
                (state, action: any) => {
                    state.isLoading = false;
                    state.isAuthenticated = true;
                    if (action.payload) {
                        state.admin = action.payload;
                    }
                }
            )
            .addMatcher(
                adminApi.endpoints.fetchAdmin.matchRejected,
                (state, { error }) => {
                    state.error = error;
                    state.isLoading = false;
                }
            );
        builder
            .addMatcher(
                adminApi.endpoints.updateSession.matchPending,
                (state) => {
                    state.error = null;
                }
            )
            .addMatcher(
                adminApi.endpoints.updateSession.matchFulfilled,
                () => {
                }
            )
            .addMatcher(
                adminApi.endpoints.updateSession.matchRejected,
                (state, { error }) => {
                    state.error = error;
                }
            );

        builder
            .addMatcher(
                adminApi.endpoints.fetchDashboardData.matchPending,
                (state) => {
                    state.error = null;
                }
            )
            .addMatcher(
                adminApi.endpoints.fetchDashboardData.matchFulfilled,
                () => {
                }
            )
            .addMatcher(
                adminApi.endpoints.fetchDashboardData.matchRejected,
                (state, { error }) => {
                    state.error = error;
                }
            );

        builder
            .addMatcher(
                adminApi.endpoints.updatePlayer.matchPending,
                (state) => {
                    state.error = null;
                }
            )
            .addMatcher(
                adminApi.endpoints.updatePlayer.matchFulfilled,
                () => {
                }
            )
            .addMatcher(
                adminApi.endpoints.updatePlayer.matchRejected,
                (state, { error }) => {
                    state.error = error;
                }
            );


        builder
            .addMatcher(
                adminApi.endpoints.getPlayerWithResponses.matchPending,
                (state) => {
                    // state.isLoading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                adminApi.endpoints.getPlayerWithResponses.matchFulfilled,
                () => {
                    // state.isLoading = false;
                }
            )
            .addMatcher(
                adminApi.endpoints.getPlayerWithResponses.matchRejected,
                (state, { error }) => {
                    // state.isLoading = false;
                    state.error = error;
                }
            );

    },
});

export const {
    setAdmin,
    setToken,
    clearAdmin,
    clearError,
    initializeAuth,
} = adminSlice.actions;

// Selectors
export const selectAdmin = (state: { admin: AdminState }) => state.admin.admin;
export const selectIsAuthenticated = (state: { admin: AdminState }) => state.admin.isAuthenticated;
export const selectAdminLoading = (state: { admin: AdminState }) => state.admin.isLoading;
export const selectAdminError = (state: { admin: AdminState }) => state.admin.error;
export const selectAdminToken = (state: { admin: AdminState }) => state.admin.token;

export default adminSlice.reducer;
