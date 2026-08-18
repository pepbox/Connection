import { NextFunction, Request, Response } from 'express';
import AppError from '../../../utils/appError';
import SessionService from '../../session/services/session.service';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwtUtils';
import AdminServices from '../services/admin.service';
import { setCookieOptions } from '../../../utils/cookieOptions';
import PlayerService from '../../players/services/player.service';
import { Player } from '../../players/models/player.model';
import { CustomQuestion } from '../../questions/models/customQuestion.model';
import { Connection } from '../../players/models/connection.model';
import TeamService from '../../teams/services/team.service';
import { SessionStatus } from '../../session/types/enums';
import FileService from '../../files/services/fileService';
import { FileModel } from '../../files/models/File';
import { deleteFromS3 } from '../../../services/fileUpload';
import { SessionEmitters } from '../../../services/socket/sessionEmitters';
import { Events } from '../../../services/socket/enums/Events';

const adminService = new AdminServices();
const sessionService = new SessionService();
const playerService = new PlayerService(Player); // Assuming you have a player service
const fileService = new FileService();
const teamService = new TeamService();


export const createAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { password, name } = req.body;
        const sessionId = req.user?.sessionId;
        if (!sessionId || !password) {
            return next(new AppError("Session ID and password are required.", 400));
        }
        const session = await sessionService.fetchSessionById(sessionId);
        if (!session) {
            return next(new AppError("Session not found.", 404));
        }

        const admin = await adminService.createAdmin({
            sessionId,
            password,
            name,
        });

        if (!admin) {
            return next(new AppError("Failed to create admin.", 500));
        }

        const accessToken = generateAccessToken({
            id: admin._id.toString(),
            role: "ADMIN",
            sessionId: admin.sessionId.toString(),
        });

        res.cookie("accessToken", accessToken, setCookieOptions);

        res.status(201).json({
            message: "Admin created successfully.",
            data: {
                admin,
            },
        });
    } catch (error) {
        console.error("Error creating admin:", error);
        next(new AppError("Failed to create admin.", 500));
    }
};

export const loginAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { sessionId, password } = req.body;
        if (!sessionId || !password) {
            return next(new AppError("Session ID and password are required.", 400));
        }

        const admin = await adminService.loginAdmin({
            sessionId,
            password,
        });
        const session = await sessionService.fetchSessionById(sessionId);
        if (!session) {
            return next(new AppError("Session not found.", 404));
        }
        if (session.status === SessionStatus.ENDED) {
            return next(new AppError("Session has ended. Admin cannot log in.", 403));
        }
        if (!admin) {
            return next(new AppError("Invalid session ID or password.", 401));
        }

        const accessToken = generateAccessToken({
            id: admin._id.toString(),
            role: "ADMIN",
            sessionId: admin.sessionId.toString(),
        });
        const refreshToken = generateRefreshToken(admin._id.toString());

        res.cookie("accessToken", accessToken, setCookieOptions);
        res.cookie("refreshToken", refreshToken, { ...setCookieOptions, httpOnly: true });


        res.status(200).json({
            message: "Admin logged in successfully.",
            data: {
                admin,
                token: accessToken,
                refreshToken: refreshToken,
            },
            success: true,
        });
    } catch (error) {
        console.error("Error logging in admin:", error);
        next(new AppError("Failed to log in admin.", 500));
    }
};

export const fetchAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    const sessionId = req.user?.sessionId;
    if (!sessionId) {
        return next(new AppError("Session ID is required or does not match.", 400));
    }

    try {
        const adminId = req.user.id;
        if (!adminId) {
            return next(new AppError("Admin ID is required.", 400));
        }

        const admin = await adminService.fetchAdminById(adminId);
        if (!admin) {
            return next(new AppError("Admin not found.", 404));
        }

        res.status(200).json({
            success: true,
            data: admin,
        });
    } catch (error: any) { }
};

export const logoutAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        res.status(200).json({
            success: true,
            message: "Admin logged out successfully.",
        });
    } catch (error) {
        console.error("Error logging out admin:", error);
        next(new AppError("Failed to log out admin.", 500));
    }
};

export const fetchAdminDashboardData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const sessionId = req.user?.sessionId;
        const adminId = req.user?.id;

        if (!sessionId || !adminId) {
            return next(new AppError("Session ID and Admin ID are required.", 400));
        }

        // Fetch admin and session
        const admin = await adminService.fetchAdminById(adminId);
        const session = await sessionService.fetchSessionById(sessionId);

        // Fetch all players in the session
        const players = await playerService.getPlayersBySession(sessionId);
        const playerDataPromises = players.map(async (player) => {
            const currentStatus = session.status || "Pending";

            // V2 metrics
            const customQuestionsCreated = await CustomQuestion.countDocuments({
                player: player._id,
                session: sessionId
            });

            const connectedTeammatesCount = await Connection.countDocuments({
                session: sessionId,
                status: "connected",
                $or: [{ playerA: player._id }, { playerB: player._id }]
            });

            const playerConnections = await Connection.find({
                session: sessionId,
                $or: [{ playerA: player._id }, { playerB: player._id }]
            });

            let customAnswersSubmitted = 0;
            for (const c of playerConnections) {
                const isPlayerA = c.playerA.toString() === player._id.toString();
                customAnswersSubmitted += isPlayerA ? (c.answersA?.length || 0) : (c.answersB?.length || 0);
            }

            let selfieUploaded = false;
            const latestConn = await Connection.findOne({
                session: sessionId,
                $or: [{ playerA: player._id }, { playerB: player._id }]
            }).sort({ updatedAt: -1 });

            if (latestConn) {
                selfieUploaded = !!(latestConn.selfieA || latestConn.selfieB);
            }

            let teamNumber = 1;
            try {
                if (player?.team) {
                    const team = await teamService.fetchTeamById(player.team.toString());
                    teamNumber = team?.teamNumber || 1;
                }
            } catch (err) {
                console.error("Team fetch error in dashboard:", err);
            }

            return {
                id: player._id.toString(),
                name: player.name,
                currentStatus,
                team: teamNumber,
                v2: {
                    customQuestionsCreated,
                    connectedTeammatesCount,
                    customAnswersSubmitted,
                    selfieUploaded
                }
            };
        });

        let playersData = await Promise.all(playerDataPromises);

        const data = {
            headerData: {
                adminName: admin.name,
                gameStatus: session.status,
                gameVersion: session.gameVersion || "v2",
                companyName: session.companyName,
                companyLogoUrl: session.companyLogoUrl,
                customQuestionsCount: session.customQuestionsCount || 1,
            },
            players: playersData,
        };

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
        next(new AppError("Failed to fetch admin dashboard data.", 500));
    }
};

export const fetchLeaderboardData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const sessionId = req.user?.sessionId;
        const adminId = req.user?.id;

        if (!sessionId || !adminId) {
            return next(new AppError("Session ID and Admin ID are required.", 400));
        }

        let selfies: any[] = [];

        // Fetch connections with selfies for V2
        const connections = await Connection.find({
            session: sessionId,
            $or: [
                { selfieA: { $exists: true, $ne: null } },
                { selfieB: { $exists: true, $ne: null } }
            ]
        });
        const connectionSelfies = await Promise.all(
            connections.map(async (conn: any) => {
                const playerA = await playerService.getPlayerById(conn.playerA.toString());
                const playerB = await playerService.getPlayerById(conn.playerB.toString());
                const selfieFileId = conn.selfieA || conn.selfieB;
                let selfiePicture = "";
                if (selfieFileId) {
                    const file = await fileService.getFileById(selfieFileId.toString());
                    selfiePicture = file?.location || "";
                }
                return {
                    id: conn._id.toString(),
                    guesserName: playerA?.name || "Unknown",
                    guessedPersonName: playerB?.name || "Unknown",
                    selfieId: selfiePicture,
                    createdAt: conn.createdAt,
                    updatedAt: conn.updatedAt,
                };
            })
        );
        selfies = [...selfies, ...connectionSelfies];

        // Filter out selfies without images, sort by latest first, and get all selfies
        const filteredAndSortedSelfies = selfies
            .filter((selfie: any) => selfie.selfieId) // Only include selfies that exist
            .sort((a: any, b: any) => {
                // Use updatedAt for sorting since that's when the selfie was actually uploaded
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB.getTime() - dateA.getTime(); // Sort by latest first
            });

        const session = await sessionService.fetchSessionById(sessionId);

        const data = {
            playerRankings: [],
            selfies: filteredAndSortedSelfies,
            companyName: session?.companyName,
            companyLogoUrl: session?.companyLogoUrl,
        };

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        next(new AppError("Failed to fetch leaderboard data.", 500));
    }
};

export const checkPlayersReadiness = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const sessionId = req.user?.sessionId;
        const adminId = req.user?.id;

        if (!sessionId || !adminId) {
            return next(new AppError("Session ID and Admin ID are required.", 400));
        }

        // Fetch the session to determine the game version and required question count
        const session = await sessionService.fetchSessionById(sessionId);
        const requiredCount = session?.customQuestionsCount || 1;

        // Fetch all players in the session
        const players = await playerService.getPlayersBySession(sessionId);

        const pendingPlayers = [];
        
        for (const player of players) {
            const playerQuestionsCount = await CustomQuestion.countDocuments({
                player: player._id,
                session: sessionId
            });

            if (playerQuestionsCount < requiredCount) {
                let teamNumber = 1;
                try {
                    if (player?.team) {
                        const team = await teamService.fetchTeamById(player.team.toString());
                        teamNumber = team?.teamNumber || 1;
                    }
                } catch (err) {
                    console.error("Team fetch error in readiness check:", err);
                }
                pendingPlayers.push({
                    id: player._id.toString(),
                    name: player.name,
                    team: teamNumber,
                    questionsAnswered: `${playerQuestionsCount}/${requiredCount} questions`
                });
            }
        }

        const allReady = pendingPlayers.length === 0;

        res.status(200).json({
            success: true,
            data: {
                allReady,
                pendingPlayers,
                totalPlayers: players.length
            }
        });
    } catch (error) {
        console.error("Error checking players readiness:", error);
        next(new AppError("Failed to check players readiness.", 500));
    }
};

export const getPlayerWithResponses = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { playerId } = req.params;
        const sessionId = req.user?.sessionId;

        if (!playerId || !sessionId) {
            return next(new AppError("Player ID and Session ID are required.", 400));
        }

        const player = await Player.findById(playerId);
        if (!player) {
            return next(new AppError("Player not found.", 404));
        }

        // Get player photo url
        let profilePhotoUrl = "";
        if (player.profilePhoto) {
            const file = await fileService.getFileById(player.profilePhoto.toString());
            profilePhotoUrl = file?.location || "";
        }

        let teamNumber = 1;
        if (player.team) {
            try {
                const team = await teamService.fetchTeamById(player.team.toString());
                teamNumber = team?.teamNumber || 1;
            } catch (err) {
                console.error("Team fetch error in player responses:", err);
            }
        }

        // Fetch all connections involving this player in this session
        const connections = await Connection.find({
            session: sessionId,
            $or: [{ playerA: playerId }, { playerB: playerId }]
        });

        const responses: any[] = [];

        for (const conn of connections) {
            const isPlayerA = conn.playerA.toString() === playerId.toString();
            const partnerId = isPlayerA ? conn.playerB : conn.playerA;
            const partner = await Player.findById(partnerId);
            const partnerName = partner?.name || "Partner";

            // Questions written by this player. Partner answered these in their answers list.
            const myQuestions = await CustomQuestion.find({ player: playerId, session: sessionId });
            const partnerAnswersList = isPlayerA ? conn.answersB : conn.answersA;

            if (myQuestions && partnerAnswersList) {
                myQuestions.forEach((q: any) => {
                    const matchedAnswer = partnerAnswersList.find((ans: any) => ans.questionId.toString() === q._id.toString());
                    if (matchedAnswer) {
                        responses.push({
                            questionId: q._id.toString() + "_asked",
                            keyAspect: `You asked ${partnerName}`,
                            questionText: q.questionText,
                            response: matchedAnswer.answer,
                        });
                    }
                });
            }

            // Questions written by partner. This player answered these in their answers list.
            const partnerQuestions = await CustomQuestion.find({ player: partnerId, session: sessionId });
            const myAnswersList = isPlayerA ? conn.answersA : conn.answersB;

            if (partnerQuestions && myAnswersList) {
                partnerQuestions.forEach((q: any) => {
                    const matchedAnswer = myAnswersList.find((ans: any) => ans.questionId.toString() === q._id.toString());
                    if (matchedAnswer) {
                        responses.push({
                            questionId: q._id.toString() + "_answered",
                            keyAspect: `Answered ${partnerName}'s Q`,
                            questionText: q.questionText,
                            response: matchedAnswer.answer,
                        });
                    }
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                player: {
                    id: player._id.toString(),
                    name: player.name,
                    profilePhoto: profilePhotoUrl,
                    score: player.score || 0,
                    team: teamNumber,
                },
                responses,
            }
        });
    } catch (error) {
        console.error("Error fetching player with responses:", error);
        next(new AppError("Failed to fetch player responses.", 500));
    }
};

export const removePlayer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { playerId } = req.params;
        const sessionId = req.user?.sessionId;

        if (!playerId || !sessionId) {
            return next(new AppError("Player ID and Session ID are required.", 400));
        }

        const player = await Player.findOne({ _id: playerId, session: sessionId });
        if (!player) {
            return next(new AppError("Player not found in this session.", 404));
        }

        // 1. Delete profile photo from S3 and File collection
        if (player.profilePhoto) {
            const fileDoc = await FileModel.findById(player.profilePhoto);
            if (fileDoc && fileDoc.fileName) {
                try {
                    await deleteFromS3(fileDoc.fileName);
                } catch (s3Error) {
                    console.error(`S3 deletion failed for file ${fileDoc.fileName}:`, s3Error);
                }
            }
            await FileModel.findByIdAndDelete(player.profilePhoto);
        }

        // 2. Delete all CustomQuestions written by this player
        await CustomQuestion.deleteMany({ player: playerId, session: sessionId });

        // 3. Delete all Connections involving this player
        const connections = await Connection.find({
            session: sessionId,
            $or: [{ playerA: playerId }, { playerB: playerId }]
        });

        const partnerIds = connections.map(conn => 
            conn.playerA.toString() === playerId.toString() ? conn.playerB.toString() : conn.playerA.toString()
        );

        await Connection.deleteMany({
            session: sessionId,
            $or: [{ playerA: playerId }, { playerB: playerId }]
        });

        // 4. Delete the player record
        await Player.findByIdAndDelete(playerId);

        // 5. Emit socket events:
        // A. Tell the removed player's client that they are removed (so they log off)
        SessionEmitters.toUser(playerId, Events.PLAYER_REMOVED, {
            message: "You have been removed by the admin."
        });

        // B. Notify partners of the connection update so their UI invalidates connection status/teammates
        partnerIds.forEach(partnerId => {
            SessionEmitters.toUser(partnerId, Events.CONNECT_WITHDRAWN, {});
            SessionEmitters.toUser(partnerId, Events.CONNECTION_UPDATE, {});
        });

        // C. Notify all session clients that players and connections updated
        SessionEmitters.toSession(sessionId.toString(), Events.PLAYERS_UPDATE, {});
        SessionEmitters.toSession(sessionId.toString(), Events.CONNECTION_UPDATE, {});

        res.status(200).json({
            success: true,
            message: "Player removed successfully."
        });
    } catch (error) {
        console.error("Error removing player:", error);
        next(new AppError("Failed to remove player.", 500));
    }
};