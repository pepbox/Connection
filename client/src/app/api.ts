import {
    createApi,
    fetchBaseQuery,
    FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";

import { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";

// Create the base query with auth headers and credentials
const baseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_BACKEND_BASE_URL,
    credentials: "include", // Include credentials for cross-origin requests
    prepareHeaders: (headers) => {
        // Fallback token authentication in case cookies are blocked (e.g. on Safari/mobile)
        const isAdmin = typeof window !== "undefined" && window.location.pathname.includes("/admin");
        const token = isAdmin
            ? localStorage.getItem("adminToken")
            : localStorage.getItem("playerToken");

        if (token) {
            headers.set("Authorization", `Bearer ${token}`);
        }
        return headers;
    },
});

// Helper function to determine the refresh endpoint based on the original request URL
// const getRefreshEndpoint = (url: string): string => {
//     // console.log(url);
//     if (url.includes('/admin/')) {
//         return '/admin/refresh';
//     } else if (url.includes('/user')) {
//         return '/user/refresh';
//     }
//     // Default fallback
//     return '/auth/refresh';
// };

const customBaseQuery: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let adjustedArgs = typeof args === "string" ? { url: args } : { ...args };

    if (adjustedArgs.url.startsWith("/v2/")) {
        // Bug 16 fix: Use a dedicated env var for the v2 base URL.
        // Falls back to replacing /api/v1 with /api in the v1 base URL.
        const v2Base =
            import.meta.env.VITE_BACKEND_V2_BASE_URL ||
            (import.meta.env.VITE_BACKEND_BASE_URL ?? "").replace("/api/v1", "/api");
        adjustedArgs = { ...adjustedArgs, url: `${v2Base}${adjustedArgs.url}` };
    }

    return baseQuery(adjustedArgs, api, extraOptions);
};

// Create the reauth wrapper
const baseQueryWithReauth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    if (!args) {
        throw new Error("Arguments for baseQuery cannot be undefined");
    }

    // Initial request
    let result = await customBaseQuery(args, api, extraOptions);

    // If unauthorized (token expired or invalid), attempt refresh
    if (
        result.error &&
        (result.error.status === 401 || result.error.status === 403)
    ) {
        console.warn("Access token expired. Attempting refresh...");

        const isAdmin = typeof window !== "undefined" && window.location.pathname.includes("/admin");
        const refreshToken = isAdmin
            ? localStorage.getItem("adminRefreshToken")
            : localStorage.getItem("playerRefreshToken");

        // Try to refresh the token
        const refreshResult = await baseQuery(
            { 
                url: "/player/refresh", 
                method: "POST",
                body: { refreshToken },
            },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            console.log("Token refreshed successfully. Retrying original request...");
            const newToken = (refreshResult.data as any)?.data?.token;
            if (newToken) {
                if (isAdmin) {
                    api.dispatch({ type: "admin/setToken", payload: { token: newToken } });
                } else {
                    api.dispatch({ type: "Player/setPlayerToken", payload: { token: newToken } });
                }
            }
            // Retry the original query
            result = await customBaseQuery(args, api, extraOptions);
        } else {
            console.warn("Refresh token invalid or expired. Logging out.");
            
            // Dispatch logout actions to clean up store and storage selectively
            if (isAdmin) {
                api.dispatch({ type: "admin/clearAdmin" });
                localStorage.removeItem("adminToken");
                localStorage.removeItem("adminRefreshToken");
            } else {
                api.dispatch({ type: "Player/logoutPlayer" });
                localStorage.removeItem("playerToken");
                localStorage.removeItem("playerRefreshToken");
                if (typeof window !== "undefined") {
                    sessionStorage.clear();
                }
            }
        }
    }

    return result;
};

// Create the base API
export const api = createApi({
    baseQuery: baseQueryWithReauth,
    tagTypes: [
        "GameCards",
        "AdminPlayer",
        "GameSession",
        "Selfie",
        "GameCompletion",
        "Connection",
    ],
    endpoints: () => ({}),
});
