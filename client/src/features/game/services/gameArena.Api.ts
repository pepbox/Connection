import { api } from "../../../app/api";
import { websocketService } from "../../../services/websocket/websocketService";

export interface Player {
  _id: string;
  name: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  score?: number;
}

export interface Session {
  _id: string;
  name: string;
  status: "pending" | "playing" | "paused" | "ended";
  createdAt: string;
  updatedAt: string;
  __v: number;
  gameVersion: string;
  companyName?: string;
  companyLogoUrl?: string;
  customQuestionsCount?: number;
}

export const gameApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlayersBySession: builder.query<Player[], void>({
      query: () => ({
        url: '/player/getPlayersBySession',
        method: 'GET',
      }),
      transformResponse: (response: { data: Player[] }) => response.data,
      providesTags: ['Teammates'],
    }),

    getSession: builder.query<Session, string | void>({
      query: (sessionId) => ({
        url: `/session/getSession${sessionId ? `?sessionId=${sessionId}` : ""}`,
        method: 'GET',
      }),
      transformResponse: (response: { data: Session }) => response.data,
      providesTags: ["GameSession"],
    }),

    playerLogout: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({
        url: '/player/logout',
        method: 'POST',
      }),
    }),

    addCustomQuestions: builder.mutation<any, { questions: Array<{ questionText: string, correctAnswer?: string }> }>({
      query: (body) => ({
        url: '/v2/player/addCustomQuestions',
        method: 'POST',
        body,
      }),
    }),

    getCustomQuestions: builder.query<any, { playerId?: string } | void>({
      query: (params) => ({
        url: '/v2/player/getCustomQuestions',
        method: 'GET',
        params: params || {},
      }),
    }),

    sendConnectionRequest: builder.mutation<any, { recipientId: string }>({
      query: (body) => ({
        url: '/v2/player/sendConnectionRequest',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Teammates', 'ConnectionStatus'],
    }),

    respondToConnectionRequest: builder.mutation<any, { connectionId: string, action: 'accept' | 'reject' }>({
      query: (body) => ({
        url: '/v2/player/respondToConnectionRequest',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Teammates', 'ConnectionStatus'],
    }),

    withdrawConnectionRequest: builder.mutation<any, { connectionId: string }>({
      query: (body) => ({
        url: '/v2/player/withdrawConnectionRequest',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Teammates', 'ConnectionStatus'],
    }),

    getConnectionStatus: builder.query<any, void>({
      query: () => ({
        url: '/v2/player/getConnectionStatus',
        method: 'GET',
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['ConnectionStatus'],
      async onCacheEntryAdded(_arg, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        try {
          await cacheDataLoaded;

          const handleStatusUpdate = () => {
            dispatch(gameApi.util.invalidateTags(['ConnectionStatus']));
          };

          const handleTeammatesUpdate = () => {
            dispatch(gameApi.util.invalidateTags(['Teammates']));
          };

          const cleanup1 = websocketService.addGlobalListener('CONNECT_REQUEST', handleStatusUpdate, 'api');
          const cleanup2 = websocketService.addGlobalListener('CONNECT_RESPONSE', handleStatusUpdate, 'api');
          const cleanup3 = websocketService.addGlobalListener('CONNECT_WITHDRAWN', handleStatusUpdate, 'api');
          const cleanup4 = websocketService.addGlobalListener('PARTNER_SELFIE_UPLOADED', handleStatusUpdate, 'api');
          const cleanup5 = websocketService.addGlobalListener('PARTNER_ANSWERS_SUBMITTED', handleStatusUpdate, 'api');
          const cleanup6 = websocketService.addGlobalListener('CONNECTION_UPDATE', handleTeammatesUpdate, 'api');

          await cacheEntryRemoved;

          cleanup1();
          cleanup2();
          cleanup3();
          cleanup4();
          cleanup5();
          cleanup6();
        } catch {
          // no-op in case cacheEntryRemoved resolves before cacheDataLoaded
        }
      },
    }),

    submitConnectionSelfie: builder.mutation<any, FormData>({
      query: (formData) => ({
        url: '/v2/player/submitConnectionSelfie',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ConnectionStatus', 'ConnectionHistory'],
    }),

    submitCustomAnswers: builder.mutation<any, { connectionId: string, answers: Array<{ questionId: string, answer: string }> }>({
      query: (body) => ({
        url: '/v2/player/submitCustomAnswers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ConnectionStatus'],
    }),

    getConnectionHistory: builder.query<any[], void>({
      query: () => ({
        url: '/v2/player/getConnectionHistory',
        method: 'GET',
      }),
      transformResponse: (response: { data: any[] }) => response.data,
      providesTags: ['ConnectionHistory'],
    }),
  }),
});

export const {
  useGetPlayersBySessionQuery,
  useGetSessionQuery,
  usePlayerLogoutMutation,
  useAddCustomQuestionsMutation,
  useGetCustomQuestionsQuery,
  useLazyGetCustomQuestionsQuery,
  useSendConnectionRequestMutation,
  useRespondToConnectionRequestMutation,
  useGetConnectionStatusQuery,
  useSubmitConnectionSelfieMutation,
  useSubmitCustomAnswersMutation,
  useGetConnectionHistoryQuery,
  useWithdrawConnectionRequestMutation,
} = gameApi;