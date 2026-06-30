import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../../../utils/appError";
import PlayerService from "../../services/player.service";
import { Player } from "../../models/player.model";
import { Connection } from "../../models/connection.model";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../../../utils/jwtUtils";
import { setCookieOptions } from "../../../../utils/cookieOptions";
import { SessionEmitters } from "../../../../services/socket/sessionEmitters";
import { Events } from "../../../../services/socket/enums/Events";
import { deleteFromS3 } from "../../../../services/fileUpload";
import SessionService from "../../../session/services/session.service";
import FileService from "../../../files/services/fileService";
import { FileModel } from "../../../files/models/File";
import { SessionStatus } from "../../../session/types/enums";
import TeamService from "../../../teams/services/team.service";

const playerService = new PlayerService(Player);
const fileService = new FileService();
const teamService = new TeamService();

export const onboardPlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, session } = req.body;

    if (!req.file) {
      return next(new AppError("Profile image is required.", 400));
    }

    if (!name || !session) {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on missing name/session:", e)
      );
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Name and session are required",
      });
      return;
    }

    const sessionDoc = await SessionService.fetchSessionById(session);
    if (!sessionDoc) {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on missing session:", e)
      );
      return next(new AppError("Session not found.", 404));
    }

    if (sessionDoc.status === SessionStatus.ENDED) {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on ended session:", e)
      );
      return next(
        new AppError("Session has ended. Player cannot be onboarded.", 403)
      );
    }

    const profileImageInfo = {
      originalName: req.file.originalname!,
      fileName: req.file.key!,
      size: req.file.size!,
      mimetype: req.file.mimetype!,
      location: req.file.location!,
      bucket: req.file.bucket!,
      etag: req.file.etag!,
    };

    const profileImage = await fileService.uploadFile(profileImageInfo);
    
    let team;
    try {
      team = await teamService.fetchTeamByNumber(1, session);
    } catch (err) {
      console.log(`Team 1 not found for session ${session}, creating it dynamically...`);
      team = await teamService.createTeam({
        teamNumber: 1,
        session: new Types.ObjectId(session),
      });
    }

    const playerData = {
      name,
      profilePhoto: profileImage._id,
      session,
      team: team._id,
    };

    const player = await playerService.createPlayer(playerData);
    const accessToken = generateAccessToken({
      id: player._id.toString(),
      role: "USER",
      sessionId: player.session.toString(),
    });
    const refreshToken = generateRefreshToken(player._id.toString());

    res.cookie("accessToken", accessToken, setCookieOptions);
    res.cookie("refreshToken", refreshToken, {
      ...setCookieOptions,
      httpOnly: true,
    });
    SessionEmitters.toSessionAdmins(
      session.toString(),
      Events.PLAYERS_UPDATE,
      {}
    );
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Player onboarded successfully",
      data: player,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      console.error("Error onboarding player:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
      });
    }
  }
};

export const fetchPlayer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const playerId = req.user?.id;
    if (!playerId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Player ID is required",
      });
      return;
    }

    const player = await playerService.getPlayerById(playerId.toString());
    if (!player) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Player not found",
      });
      return;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: player,
    });
  } catch (error) {
    console.error("Error fetching player:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const getPlayersBySession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sessionId = req.user?.sessionId;
    const currentUserId = req.user?.id;

    if (!sessionId || !currentUserId) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Session ID is required",
      });
      return;
    }
    const players = await playerService.getPlayersBySession(
      new Types.ObjectId(sessionId)
    );
    let filteredPlayers = players.filter(
      (player: any) => player._id.toString() !== currentUserId
    );

    // Filter out players who currently have an active (isCompleted: false) connection
    const activeConnections = await Connection.find({
      session: new Types.ObjectId(sessionId),
      isCompleted: false
    }).select("playerA playerB");
    
    const busyPlayerIds = new Set<string>();
    for (const conn of activeConnections) {
      if (conn.playerA) busyPlayerIds.add(conn.playerA.toString());
      if (conn.playerB) busyPlayerIds.add(conn.playerB.toString());
    }

    // Also filter out players the current user has already connected with (completed)
    const pastConnections = await Connection.find({
      session: new Types.ObjectId(sessionId),
      isCompleted: true,
      $or: [
        { playerA: new Types.ObjectId(currentUserId) },
        { playerB: new Types.ObjectId(currentUserId) }
      ]
    }).select("playerA playerB");

    for (const conn of pastConnections) {
      if (conn.playerA && String(conn.playerA) !== String(currentUserId)) busyPlayerIds.add(String(conn.playerA));
      if (conn.playerB && String(conn.playerB) !== String(currentUserId)) busyPlayerIds.add(String(conn.playerB));
    }

    
    filteredPlayers = filteredPlayers.filter(
      (player: any) => !busyPlayerIds.has(player._id.toString())
    );

    for (let i = filteredPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [filteredPlayers[i], filteredPlayers[j]] = [
        filteredPlayers[j],
        filteredPlayers[i],
      ];
    }
    const plainPlayers = filteredPlayers.map((player: any) => player.toObject());

    // Bug 11 fix: Batch-fetch all profile photo files in a single $in query (avoid N+1)
    const photoIds = plainPlayers
      .map((p: any) => p.profilePhoto)
      .filter(Boolean);
    const photoFiles = await FileModel.find({ _id: { $in: photoIds } });
    const photoMap = new Map(photoFiles.map((f) => [f._id.toString(), f.location]));

    for (const player of plainPlayers) {
      player.profilePhotoUrl = photoMap.get(player.profilePhoto?.toString()) || "";
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: plainPlayers,
    });
  } catch (error) {
    console.error("Error fetching players by session:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const updatePlayer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { playerId, name } = req.body;

    const updateData: Partial<{ name: string }> = {};
    if (name !== undefined) updateData.name = name;

    if (!playerId) {
      return next(
        new AppError("Player ID is required.", StatusCodes.BAD_REQUEST)
      );
    }

    const updatedPlayer = await playerService.updatePlayerById(
      playerId,
      updateData
    );

    if (!updatedPlayer) {
      return next(
        new AppError(
          "Player not found or update failed.",
          StatusCodes.NOT_FOUND
        )
      );
    }

    res.status(StatusCodes.OK).json({
      message: "Player updated successfully.",
      data: updatedPlayer,
    });
  } catch (error) {
    console.error("Error updating player:", error);
    next(
      new AppError(
        "Failed to update player.",
        StatusCodes.INTERNAL_SERVER_ERROR
      )
    );
  }
};

export const logoutPlayer = async (
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
      message: "Player logged out successfully.",
    });
  } catch (error) {
    console.error("Error logging out player:", error);
    next(new AppError("Failed to log out player.", 500));
  }
};
