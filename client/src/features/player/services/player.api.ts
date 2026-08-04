import { api } from "../../../app/api";

export const playerApi = api.injectEndpoints({
    endpoints: (builder) => ({

        onboardPlayer: builder.mutation({
            query: (body) => ({
                url: '/player/onboardPlayer',
                method: 'POST',
                body,
            }),
            transformResponse: (response: any) => response.data,
        }),

        fetchPlayer: builder.query({
            query: () => ({
                url: '/player/fetchPlayer',
                method: 'GET',
            }),
            transformResponse: (response: any) => response.data,
        }),


    }),
});

export const {
    useOnboardPlayerMutation,
    useLazyFetchPlayerQuery,
} = playerApi;