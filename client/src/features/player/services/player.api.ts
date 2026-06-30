import { api } from "../../../app/api";

export const playerApi = api.injectEndpoints({
    endpoints: (builder) => ({

        onboardPlayer: builder.mutation({
            query: (body) => ({
                url: '/player/onboardPlayer',
                method: 'POST',
                body,
            }),
        }),

        fetchPlayer: builder.query({
            query: () => ({
                url: '/player/fetchPlayer',
                method: 'GET',
            }),
        }),


    }),
});

export const {
    useOnboardPlayerMutation,
    useLazyFetchPlayerQuery,
} = playerApi;