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
  status?: string;
  gameVersion?: 'v2';
}

export const gameApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlayersBySession: builder.query<Player[], void>({
      query: () => ({
        url: '/player/getPlayersBySession',
        method: 'GET',
      }),
      transformResponse: (response: { data: Player[] }) => response.data,
      providesTags: ['Connection'],
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
      invalidatesTags: ['Connection'],
    }),

    respondToConnectionRequest: builder.mutation<any, { connectionId: string, action: 'accept' | 'reject' }>({
      query: (body) => ({
        url: '/v2/player/respondToConnectionRequest',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Connection'],
    }),

    getConnectionStatus: builder.query<any, void>({
      query: () => ({
        url: '/v2/player/getConnectionStatus',
        method: 'GET',
      }),
      transformResponse: (response: { data: any }) => response.data,
      providesTags: ['Connection'],
      async onCacheEntryAdded(_arg, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        try {
          await cacheDataLoaded;

          const handleUpdate = () => {
            dispatch(gameApi.util.invalidateTags(['Connection']));
          };

          const cleanup1 = websocketService.addGlobalListener('CONNECT_REQUEST', handleUpdate, 'api');
          const cleanup2 = websocketService.addGlobalListener('CONNECTION_REQUEST_ACCEPTED', handleUpdate, 'api');
          const cleanup3 = websocketService.addGlobalListener('CONNECTION_REQUEST_REJECTED', handleUpdate, 'api');
          const cleanup4 = websocketService.addGlobalListener('PARTNER_SELFIE_UPLOADED', handleUpdate, 'api');
          const cleanup5 = websocketService.addGlobalListener('PARTNER_ANSWERS_SUBMITTED', handleUpdate, 'api');
          const cleanup6 = websocketService.addGlobalListener('CONNECTION_UPDATE', handleUpdate, 'api');

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
      invalidatesTags: ['Connection'],
    }),

    submitCustomAnswers: builder.mutation<any, { connectionId: string, answers: Array<{ questionId: string, answer: string }> }>({
      query: (body) => ({
        url: '/v2/player/submitCustomAnswers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Connection'],
    }),

    getConnectionHistory: builder.query<any[], void>({
      query: () => ({
        url: '/v2/player/getConnectionHistory',
        method: 'GET',
      }),
      transformResponse: (response: { data: any[] }) => response.data,
      providesTags: ['Connection'],
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
} = gameApi;