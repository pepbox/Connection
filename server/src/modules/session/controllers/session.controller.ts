import { Request, Response, NextFunction } from "express";
import AppError from "../../../utils/appError"; // Adjust path as needed
import { ISession } from "../types/interfaces";
import { SessionStatus } from "../types/enums";
import SessionService from "../services/session.service";
import { SessionEmitters } from "../../../services/socket/sessionEmitters";
import { Events } from "../../../services/socket/enums/Events";
import AdminServices from "../../admin/services/admin.service";
import { Types } from "mongoose";
import axios from "axios";
import PlayerService from "../../players/services/player.service";
import { Player } from "../../players/models/player.model";
import { Connection } from "../../players/models/connection.model";
import TeamService from "../../teams/services/team.service";
import archiver from "archiver";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "../../../services/fileUpload/s3Client";
import { s3Config } from "../../../services/fileUpload/config";
import { FileModel } from "../../files/models/File";
import { Readable } from "stream";

const sessionService = new SessionService();
const adminService = new AdminServices();
const playerService = new PlayerService(Player);
const teamService = new TeamService();

export const updateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.user?.sessionId;
    const updateData: Partial<ISession> = req.body;

    if (!sessionId) {
      return next(new AppError("Session ID is required.", 400));
    }

    if (
      updateData.status &&
      !Object.values(SessionStatus).includes(updateData.status)
    ) {
      return next(new AppError("Invalid session status.", 400));
    }

    if (
      updateData.gameVersion &&
      updateData.gameVersion !== "v2"
    ) {
      return next(new AppError("Invalid game version.", 400));
    }

    // Assuming you have imported the service as sessionService
    updateData.updatedAt = new Date();
    const updatedSession = await sessionService.updateSessionById(
      sessionId,
      updateData
    );

    if (!updatedSession) {
      return next(new AppError("Session not found.", 404));
    }
    SessionEmitters.toSession(sessionId.toString(), Events.SESSION_UPDATE, {});
    if (updateData.status === "ended") {
      // Notify the super admin server about the session end
      const players = await playerService.getPlayersBySession(
        sessionId as Types.ObjectId
      );
      // Bug 17 fix: Guard against missing env var
      if (process.env.SUPER_ADMIN_SERVER_URL) {
        await axios.post(`${process.env.SUPER_ADMIN_SERVER_URL}/update`, {
          gameSessionId: sessionId.toString(),
          status: "ENDED",
          completedOn: new Date().toISOString(),
          totalPlayers: players.length,
          totalTeams: "0",
        });
      } else {
        console.warn("SUPER_ADMIN_SERVER_URL is not set. Skipping super-admin notification.");
      }
    }
    res.status(200).json({
      message: "Session updated successfully.",
      data: {
        session: updatedSession,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    next(new AppError("Failed to update session.", 500));
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let sessionId: string | undefined = req.user?.sessionId?.toString();
    if (!sessionId) {
      sessionId = (req.query.sessionId as string) || (req.headers["x-session-id"] as string);
    }

    if (!sessionId) {
      return next(new AppError("Session ID is required.", 400));
    }

    const session = await sessionService.fetchSessionById(sessionId);

    res.status(200).json({
      message: "Session fetched successfully.",
      data: session,
      success: true,
    });
  } catch (error: any) {
    if (error.message === "Session not found") {
      return next(new AppError("Session not found.", 404));
    }
    console.error("Error fetching session:", error);
    next(new AppError("Failed to fetch session.", 500));
  }
};

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, adminName, adminPin: password, gameConfig } = req.body;
    const { numberOfTeams } = gameConfig || {};
    const teamsCount = numberOfTeams || 1;
    const newSession = await sessionService.createSession({
      name,
      numberOfTeams: teamsCount,
    });

    await adminService.createAdmin({
      name: adminName,
      sessionId: newSession._id as Types.ObjectId,
      password: password,
    });
    await teamService.createMultipleTeams(teamsCount, {
      session: newSession._id as Types.ObjectId,
    });

    res.status(201).json({
      message: "Session created successfully.",
      data: {
        sessionId: newSession._id,
        adminLink: `${process.env.FRONTEND_URL}/admin/${newSession._id}/login`,
        playerLink: `${process.env.FRONTEND_URL}/game/${newSession._id}`,
        session: newSession,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    next(new AppError("Failed to create session.", 500));
  }
};

export const updateSessionServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId, name, adminName, adminPin: password } = req.body;

    if (!sessionId) {
      return next(new AppError("Session ID and Admin ID are required.", 400));
    }

    // Prepare session update data
    const sessionUpdateData: Partial<ISession> = {};
    if (name) sessionUpdateData.name = name;
    sessionUpdateData.updatedAt = new Date();

    // Update session
    const updatedSession = await sessionService.updateSessionById(
      sessionId,
      sessionUpdateData
    );
    if (!updatedSession) {
      return next(new AppError("Session not found.", 404));
    }

    // Prepare admin update data
    const adminUpdateData: Partial<{ name: string; password: string }> = {};
    if (adminName) adminUpdateData.name = adminName;
    if (password) adminUpdateData.password = password;

    let updatedAdmin = null;
    if (Object.keys(adminUpdateData).length > 0) {
      updatedAdmin = await adminService.updateAdmin(sessionId, adminUpdateData);
    }

    res.status(200).json({
      message: "Session server updated successfully.",
      data: {
        session: updatedSession,
        ...(updatedAdmin && { admin: updatedAdmin }),
      },
      success: true,
    });
  } catch (error) {
    console.error("Error updating session server:", error);
    next(new AppError("Failed to update session server.", 500));
  }
};

export const endSessionServer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionId } = req.body;
  try {
    if (!sessionId) {
      return next(new AppError("Session ID is required.", 400));
    }
    const updatedSession = await sessionService.updateSessionById(sessionId, {
      status: SessionStatus.ENDED,
      updatedAt: new Date(),
    });
    if (!updatedSession) {
      return next(new AppError("Session not found.", 404));
    }
    SessionEmitters.toSession(sessionId.toString(), Events.SESSION_UPDATE, {});
    res.status(200).json({
      message: "Session ended successfully.",
      data: {
        session: updatedSession,
      },
      success: true,
    });
  } catch (error) {
    console.error("Error ending session server:", error);
    next(new AppError("Failed to end session server.", 500));
  }
};

export const downloadSessionSelfies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return next(new AppError("Session ID is required.", 400));
    }

    // Validate session exists
    const session = await sessionService.fetchSessionById(
      new Types.ObjectId(sessionId)
    );
    if (!session) {
      return next(new AppError("Session not found.", 404));
    }

    const itemsToDownload: Array<{ file: any; zipFileName: string }> = [];
    let fileIndex = 0;

    // Fetch connections with selfies for V2
    const connections = await Connection.find({
      session: new Types.ObjectId(sessionId),
      $or: [
        { selfieA: { $exists: true, $ne: null } },
        { selfieB: { $exists: true, $ne: null } }
      ]
    });

    if (connections && connections.length > 0) {
      for (const conn of connections) {
        const selfieFileId = conn.selfieA || conn.selfieB;
        if (!selfieFileId) continue;
        const file = await FileModel.findById(selfieFileId);
        if (file) {
          fileIndex++;
          const playerAInfo = await Player.findById(conn.playerA).select("name");
          const playerBInfo = await Player.findById(conn.playerB).select("name");
          const playerAName = playerAInfo?.name || conn.playerA.toString();
          const playerBName = playerBInfo?.name || conn.playerB.toString();
          const sanitizedPlayerAName = playerAName.replace(/[^a-z0-9]/gi, "_");
          const sanitizedPlayerBName = playerBName.replace(/[^a-z0-9]/gi, "_");
          const extension = file.originalName.split(".").pop() || "jpg";
          const zipFileName = `${fileIndex}_${sanitizedPlayerAName}_connected_${sanitizedPlayerBName}.${extension}`;
          itemsToDownload.push({ file, zipFileName });
        }
      }
    }

    if (itemsToDownload.length === 0) {
      return next(
        new AppError("No valid selfie files found for this session.", 404)
      );
    }

    // Set response headers for zip download
    const fileName = `session-${session.name || sessionId}-selfies-${new Date().toISOString().split("T")[0]}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Create archiver instance
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Handle archiver errors
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      next(new AppError("Failed to create zip archive.", 500));
    });

    // Pipe archive to response
    archive.pipe(res);

    // Stream each file from S3 into the archive
    for (const { file, zipFileName } of itemsToDownload) {
      try {
        if (!file) continue;

        // Extract S3 key from the file location
        const s3Key = file.fileName;

        // Get the file from S3 as a stream
        const getObjectCommand = new GetObjectCommand({
          Bucket: s3Config.bucket,
          Key: s3Key,
        });

        const s3Response = await s3Client.send(getObjectCommand);

        if (s3Response.Body && s3Response.Body instanceof Readable) {
          // Add file to archive
          archive.append(s3Response.Body as Readable, { name: zipFileName });
        }
      } catch (fileError) {
        console.error(`Error processing file for download:`, fileError);
        // Continue with other files even if one fails
      }
    }

    // Finalize the archive (this will trigger the stream to complete)
    await archive.finalize();

    console.log(`Successfully created zip with ${itemsToDownload.length} selfies for session ${sessionId}`);
  } catch (error) {
    console.error("Error downloading session selfies:", error);
    next(new AppError("Failed to download session selfies.", 500));
  }
};
