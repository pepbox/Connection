import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { StatusCodes } from "http-status-codes";
import AppError from "../../../../utils/appError";
import { Player } from "../../models/player.model";
import { CustomQuestion } from "../../../questions/models/customQuestion.model";
import { Connection } from "../../models/connection.model";
import FileService from "../../../files/services/fileService";
import { SessionEmitters } from "../../../../services/socket/sessionEmitters";
import { Events } from "../../../../services/socket/enums/Events";
import { deleteFromS3 } from "../../../../services/fileUpload";

const fileService = new FileService();

export const addCustomQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const playerId = req.user?.id;
    const sessionId = req.user?.sessionId;
    const { questions } = req.body;

    if (!playerId || !sessionId) {
      return next(new AppError("User ID and Session ID are required", 400));
    }

    if (!Array.isArray(questions) || questions.length < 1) {
      return next(new AppError("At least one question is required", 400));
    }

    // Delete existing custom questions for this player
    await CustomQuestion.deleteMany({ player: playerId, session: sessionId });

    const questionsData = questions.map((q: any) => ({
      player: playerId,
      session: sessionId,
      questionText: q.questionText,
      correctAnswer: q.correctAnswer,
    }));

    const createdQuestions = await CustomQuestion.insertMany(questionsData);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Custom questions saved successfully",
      data: createdQuestions,
    });
  } catch (error) {
    console.error("Error adding custom questions:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const getCustomQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.user?.id;
    const sessionId = req.user?.sessionId;
    const { playerId } = req.query;

    if (!currentUserId || !sessionId) {
      return next(new AppError("Authentication required", 401));
    }

    const targetPlayerId = playerId
      ? playerId.toString()
      : currentUserId.toString();
    const isSelf = targetPlayerId === currentUserId.toString();

    const questions = isSelf
      ? await CustomQuestion.find({ player: targetPlayerId, session: sessionId })
      : await CustomQuestion.find({ player: targetPlayerId, session: sessionId }).select("-correctAnswer");

    res.status(StatusCodes.OK).json({
      success: true,
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching custom questions:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const sendConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requesterId = req.user?.id;
    const sessionId = req.user?.sessionId;
    const { recipientId } = req.body;

    if (!requesterId || !sessionId || !recipientId) {
      return next(
        new AppError(
          "Requester ID, Session ID and Recipient ID are required",
          400
        )
      );
    }

    if (requesterId.toString() === recipientId.toString()) {
      return next(new AppError("You cannot connect with yourself", 400));
    }

    // Verify recipient exists and is in the same session
    const recipient = await Player.findOne({
      _id: recipientId,
      session: sessionId,
    });
    if (!recipient) {
      return next(
        new AppError("Recipient player not found in this session", 404)
      );
    }

    // Check if requester has any active connections
    const existingRequesterConnection = await Connection.findOne({
      session: new Types.ObjectId(sessionId.toString()),
      isCompleted: false,
      $or: [
        { playerA: new Types.ObjectId(requesterId.toString()) },
        { playerB: new Types.ObjectId(requesterId.toString()) },
      ],
    });

    if (existingRequesterConnection) {
      return next(
        new AppError("You already have an active request or connection", 400)
      );
    }

    // Check if recipient has any active connections
    const existingRecipientConnection = await Connection.findOne({
      session: new Types.ObjectId(sessionId.toString()),
      isCompleted: false,
      $or: [
        { playerA: new Types.ObjectId(recipientId.toString()) },
        { playerB: new Types.ObjectId(recipientId.toString()) },
      ],
    });

    if (existingRecipientConnection) {
      return next(
        new AppError(
          "The recipient already has an active request or connection",
          400
        )
      );
    }

    // Check if they have already connected in this session
    const priorConnection = await Connection.findOne({
      session: new Types.ObjectId(sessionId.toString()),
      isCompleted: true,
      $or: [
        { playerA: new Types.ObjectId(requesterId.toString()), playerB: new Types.ObjectId(recipientId.toString()) },
        { playerA: new Types.ObjectId(recipientId.toString()), playerB: new Types.ObjectId(requesterId.toString()) }
      ]
    });

    if (priorConnection) {
      return next(new AppError("You have already connected with this player in this session.", 400));
    }

    const connection = new Connection({
      session: sessionId,
      playerA: requesterId,
      playerB: recipientId,
      status: "pending",
    });

    await connection.save();

    const requester = await Player.findById(requesterId);

    // Emit socket notification to recipient
    SessionEmitters.toUser(recipientId.toString(), "CONNECT_REQUEST", {
      connectionId: connection._id,
      requester: {
        id: requesterId,
        name: requester?.name || "A teammate",
      },
    });

    // Broadcast list update to all players in the session
    SessionEmitters.toSessionPlayers(sessionId.toString(), "CONNECTION_UPDATE", {});

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Connection request sent successfully",
      data: connection,
    });
  } catch (error: any) {
    console.error("Error sending connection request:", error);
    // MongoDB duplicate key — race condition: both players sent requests simultaneously
    if (error?.code === 11000) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "A connection between these players already exists",
      });
      return;
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const respondToConnectionRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipientId = req.user?.id;
    const { connectionId, action } = req.body;

    if (!recipientId || !connectionId || !action) {
      return next(new AppError("Connection ID and action are required", 400));
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return next(new AppError("Connection request not found", 404));
    }

    if (connection.playerB.toString() !== recipientId.toString()) {
      return next(
        new AppError("You are not authorized to respond to this request", 403)
      );
    }

    if (connection.status !== "pending") {
      return next(new AppError("Request is already processed", 400));
    }

    const recipient = await Player.findById(recipientId);

    if (action === "accept") {
      connection.status = "connected";
      await connection.save();

      // Notify requester
      SessionEmitters.toUser(
        connection.playerA.toString(),
        "CONNECT_RESPONSE",
        {
          connectionId: connection._id,
          status: "connected",
          recipient: {
            id: recipientId,
            name: recipient?.name || "Your partner",
          },
        }
      );

      // Broadcast list update to all players in the session
      SessionEmitters.toSessionPlayers(connection.session.toString(), "CONNECTION_UPDATE", {});

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Connection request accepted",
        data: connection,
      });
    } else if (action === "reject") {
      await Connection.findByIdAndDelete(connectionId);

      // Notify requester
      SessionEmitters.toUser(
        connection.playerA.toString(),
        "CONNECT_RESPONSE",
        {
          connectionId: connectionId,
          status: "rejected",
          recipient: {
            id: recipientId,
            name: recipient?.name || "Your partner",
          },
        }
      );

      // Broadcast list update to all players in the session
      SessionEmitters.toSessionPlayers(connection.session.toString(), "CONNECTION_UPDATE", {});

      res.status(StatusCodes.OK).json({
        success: true,
        message: "Connection request rejected",
      });
    } else {
      return next(
        new AppError("Invalid action. Must be 'accept' or 'reject'", 400)
      );
    }
  } catch (error) {
    console.error("Error responding to connection request:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const getConnectionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const playerId = req.user?.id;
    const sessionId = req.user?.sessionId;

    if (!playerId || !sessionId) {
      return next(new AppError("User ID and Session ID are required", 400));
    }

    // Find the most recent connection involving the player in the current session
    const connection = await Connection.findOne({
      session: new Types.ObjectId(sessionId.toString()),
      $or: [
        { playerA: new Types.ObjectId(playerId.toString()) },
        { playerB: new Types.ObjectId(playerId.toString()) },
      ],
    }).sort({ createdAt: -1 });

    if (!connection) {
      res.status(StatusCodes.OK).json({
        success: true,
        data: null,
      });
      return;
    }

    // Get partner info
    const isPlayerA = connection.playerA.toString() === playerId.toString();
    const partnerId = isPlayerA ? connection.playerB : connection.playerA;

    const partner = await Player.findById(partnerId);
    let partnerProfilePhoto = "";
    if (partner?.profilePhoto) {
      const file = await fileService.getFileById(
        partner.profilePhoto.toString()
      );
      partnerProfilePhoto = file?.location || "";
    }

    // Get selfies — track each player's selfie independently
    const mySelfieId = isPlayerA ? connection.selfieA : connection.selfieB;
    const partnerSelfieId = isPlayerA ? connection.selfieB : connection.selfieA;

    const selfieUploaded = !!mySelfieId;
    const partnerSelfieUploaded = !!partnerSelfieId;

    let selfieUrl = "";
    let partnerSelfieUrl = "";

    if (mySelfieId) {
      const file = await fileService.getFileById(mySelfieId.toString());
      selfieUrl = file?.location || "";
    }
    if (partnerSelfieId) {
      const file = await fileService.getFileById(partnerSelfieId.toString());
      partnerSelfieUrl = file?.location || "";
    }

    // Get custom questions — strip correctAnswer from both to avoid leaking answers
    const myQuestions = await CustomQuestion.find({ player: playerId, session: sessionId }).select("-correctAnswer");
    const partnerQuestions = await CustomQuestion.find({ player: partnerId, session: sessionId }).select("-correctAnswer");

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        connectionId: connection._id,
        status: connection.status,
        role: isPlayerA ? "A" : "B",
        selfieUploaded,
        partnerSelfieUploaded,
        selfieUrl,
        partnerSelfieUrl,
        partner: partner
          ? {
              id: partner._id,
              name: partner.name,
              profilePhoto: partnerProfilePhoto,
            }
          : null,
        myQuestions,
        partnerQuestions,
        myAnswers: isPlayerA ? (connection.answersA || []) : (connection.answersB || []),
        partnerAnswers: isPlayerA ? (connection.answersB || []) : (connection.answersA || []),
      },
    });
  } catch (error) {
    console.error("Error getting connection status:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const submitConnectionSelfie = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { connectionId } = req.body;
    const currentUserId = req.user?.id;
    const sessionId = req.user?.sessionId;

    if (!req.file) {
      return next(new AppError("Selfie image is required.", 400));
    }

    if (!connectionId || !currentUserId || !sessionId) {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on validation error:", e)
      );
      return next(
        new AppError(
          "Connection ID, User ID, and Session ID are required",
          400
        )
      );
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on missing connection:", e)
      );
      return next(new AppError("Connection not found", 404));
    }

    const isPlayerA =
      connection.playerA.toString() === currentUserId.toString();
    const isPlayerB =
      connection.playerB.toString() === currentUserId.toString();

    if (!isPlayerA && !isPlayerB) {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on auth error:", e)
      );
      return next(new AppError("You are not part of this connection", 403));
    }

    if (connection.status !== "connected") {
      void deleteFromS3(req.file.key!).catch((e) =>
        console.error("S3 cleanup failed on status error:", e)
      );
      return next(
        new AppError(
          "You can only upload selfies for established connections",
          400
        )
      );
    }

    // Upload selfie file
    const selfieImageInfo = {
      originalName: req.file.originalname!,
      fileName: req.file.key!,
      size: req.file.size!,
      mimetype: req.file.mimetype!,
      location: req.file.location!,
      bucket: req.file.bucket!,
      etag: req.file.etag!,
    };

    const selfieFile = await fileService.uploadFile(selfieImageInfo);

    // Treat the uploaded selfie as the shared selfie for both players
    connection.selfieA = selfieFile._id as any;
    connection.selfieB = selfieFile._id as any;
    connection.isCompleted = true;

    await connection.save();

    // Notify partner about the selfie upload
    const partnerId = isPlayerA ? connection.playerB : connection.playerA;
    SessionEmitters.toUser(partnerId.toString(), "PARTNER_SELFIE_UPLOADED", {
      connectionId: connection._id,
      selfieUrl: selfieFile.location,
    });

    // Notify admins for the gallery
    SessionEmitters.toSessionAdmins(
      sessionId.toString(),
      Events.PLAYER_SELFIE_UPDATE,
      {}
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Connection selfie uploaded successfully",
      data: {
        connectionId: connection._id,
        selfieUrl: selfieFile.location,
      },
    });
  } catch (error) {
    if (req.file?.key) {
      try {
        await deleteFromS3(req.file.key);
      } catch (deleteErr) {
        console.error("Failed to delete orphaned S3 selfie file:", deleteErr);
      }
    }
    console.error("Error uploading connection selfie:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const submitCustomAnswers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { connectionId, answers } = req.body;
    const currentUserId = req.user?.id;
    const sessionId = req.user?.sessionId;

    if (!connectionId || !answers || !Array.isArray(answers)) {
      return next(new AppError("Connection ID and answers array are required", 400));
    }

    if (!currentUserId || !sessionId) {
      return next(new AppError("Authentication required", 401));
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return next(new AppError("Connection not found", 404));
    }

    const isPlayerA = connection.playerA.toString() === currentUserId.toString();
    const isPlayerB = connection.playerB.toString() === currentUserId.toString();

    if (!isPlayerA && !isPlayerB) {
      return next(new AppError("You are not part of this connection", 403));
    }

    if (connection.status !== "connected") {
      return next(new AppError("Connection is not active", 400));
    }

    // Bug 5 fix: Guard against re-submission — do not allow overwriting existing answers
    if (isPlayerA && connection.answersA && connection.answersA.length > 0) {
      return next(new AppError("You have already submitted your answers", 400));
    }
    if (isPlayerB && connection.answersB && connection.answersB.length > 0) {
      return next(new AppError("You have already submitted your answers", 400));
    }

    // Save answers
    if (isPlayerA) {
      connection.answersA = answers;
    } else {
      connection.answersB = answers;
    }

    await connection.save();

    // Notify partner
    const partnerId = isPlayerA ? connection.playerB : connection.playerA;
    SessionEmitters.toUser(partnerId.toString(), "PARTNER_ANSWERS_SUBMITTED", {
      connectionId: connection._id,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Answers submitted successfully",
      data: connection,
    });
  } catch (error) {
    console.error("Error submitting custom answers:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};

export const getConnectionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const playerId = req.user?.id;
    const sessionId = req.user?.sessionId;

    if (!playerId || !sessionId) {
      return next(new AppError("User ID and Session ID are required", 400));
    }

    const connections = await Connection.find({
      session: new Types.ObjectId(sessionId.toString()),
      isCompleted: true,
      $or: [
        { playerA: new Types.ObjectId(playerId.toString()) },
        { playerB: new Types.ObjectId(playerId.toString()) },
      ],
    }).sort({ createdAt: -1 });

    const historyData = await Promise.all(
      connections.map(async (connection) => {
        const isPlayerA = connection.playerA.toString() === playerId.toString();
        const partnerId = isPlayerA ? connection.playerB : connection.playerA;

        const partner = await Player.findById(partnerId);
        let partnerProfilePhoto = "";
        if (partner?.profilePhoto) {
          const file = await fileService.getFileById(partner.profilePhoto.toString());
          partnerProfilePhoto = file?.location || "";
        }

        const mySelfieId = isPlayerA ? connection.selfieA : connection.selfieB;
        const partnerSelfieId = isPlayerA ? connection.selfieB : connection.selfieA;

        let selfieUrl = "";
        let partnerSelfieUrl = "";

        if (mySelfieId) {
          const file = await fileService.getFileById(mySelfieId.toString());
          selfieUrl = file?.location || "";
        }
        if (partnerSelfieId) {
          const file = await fileService.getFileById(partnerSelfieId.toString());
          partnerSelfieUrl = file?.location || "";
        }

        const myQuestions = await CustomQuestion.find({ player: playerId, session: sessionId }).select("-correctAnswer");
        const partnerQuestions = await CustomQuestion.find({ player: partnerId, session: sessionId }).select("-correctAnswer");

        return {
          connectionId: connection._id,
          status: connection.status,
          role: isPlayerA ? "A" : "B",
          selfieUploaded: true,
          partnerSelfieUploaded: true,
          selfieUrl,
          partnerSelfieUrl,
          partner: partner
            ? {
                id: partner._id,
                name: partner.name,
                profilePhoto: partnerProfilePhoto,
              }
            : null,
          myQuestions,
          partnerQuestions,
          myAnswers: isPlayerA ? (connection.answersA || []) : (connection.answersB || []),
          partnerAnswers: isPlayerA ? (connection.answersB || []) : (connection.answersA || []),
          createdAt: connection.createdAt,
        };
      })
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: historyData,
    });
  } catch (error) {
    console.error("Error getting connection history:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Internal Server Error",
    });
  }
};
