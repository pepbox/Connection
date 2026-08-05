
// Admin Login Types
export interface AdminLoginCredentials {
    pin: string;
}

export interface AdminUser {
    id: string;
    name: string;
}

export interface PlayerTableProps {
    players: Player[];
    customQuestionsCount?: number;
    onChangeName?: (playerId: string, name: string) => void;
    onChangeScore?: (playerId: string, newScore: number) => void;
    onViewResponses?: (playerId: string) => void;
    version?: 'v1' | 'v2';
    playerWithResponses?: {
        player: {
            id: string;
            name: string;
            profilePhoto?: string;
            score: number;
        };
        responses: {
            questionId: string;
            keyAspect: string;
            questionText: string;
            response: string;
        }[];
    } | null;
    loadingResponses?: boolean;
}

// Type definitions
export interface HeaderData {
    gameStatus: string;
    adminName?: string;
    gameVersion?: 'v1' | 'v2' | 'both';
    activeVersion?: 'v1' | 'v2' | null;
    companyName?: string;
    companyLogoUrl?: string;
    customQuestionsCount?: number;
}

export interface Player {
    id: string;
    name: string;
    questionsAnswered: string;
    currentStatus?: string;
    rank?: number;
    peopleYouKnow?: string;
    peopleWhoKnowYou?: string;
    totalScore?: number;
    team?: string | number;
    v2?: {
        customQuestionsCreated?: number;
        partnerName?: string;
        customAnswersSubmitted?: number;
        selfieUploaded?: boolean;
    };
}

export interface DashboardHeaderProps {
    data: HeaderData;
    gameStatus?: boolean;
    onGameStatusChange?: (version: 'v1' | 'v2' | 'both') => void;
    isCheckingReadiness?: boolean;
    onPauseGame?: () => void;
    onResumeGame?: () => void;
}


export interface DashboardProps {
    headerData: HeaderData;
    playerWithResponses?: {
        player: {
            id: string;
            name: string;
            profilePhoto?: string;
            score: number;
        };
        responses: {
            questionId: string;
            keyAspect: string;
            questionText: string;
            response: string;
        }[];
    } | null;
    players: Player[];
    onGameStatusChange?: (status: boolean) => void;
    onChangeName?: (playerId: string, name: string) => void;
    onChangeScore?: (playerId: string, newScore: number) => void;
    onViewResponses?: (playerId: string) => void;
    loadingResponses?: boolean;
}

// Leaderboard Types
export interface PlayerRanking {
    id: string;
    name: string;
    profilePhoto: string | null;
    score: number;
    rank: number;
}

export interface SelfieData {
    id: string;
    guesserName: string;
    guessedPersonName: string;
    selfieId: string | null;
    createdAt: Date;
}

export interface LeaderboardData {
    playerRankings: PlayerRanking[];
    selfies: SelfieData[];
    companyName?: string;
    companyLogoUrl?: string;
}

export interface LeaderboardProps {
    data: LeaderboardData | null;
    isLoading: boolean;
}

// export interface DashboardPageProps {
//   data: {
//     headerData: HeaderData;
//     players: Player[];
//   };
//   handlers?: {
//     onGameStatusChange?: (status: boolean) => void;
//     onTransactionsChange?: (status: boolean) => void;
//     onChangeName?: (playerId: string) => void;
//     onViewResponses?: (playerId: string) => void;
//   };
// }