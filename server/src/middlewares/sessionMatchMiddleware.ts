import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";

export const verifySessionMatch = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userSessionId = req.user?.sessionId?.toString();
  if (!userSessionId) {
    return next(new AppError("Unauthorized: No session associated with user token.", 401));
  }

  // Check path parameter, query parameter, or custom header
  const requestSessionId =
    req.params.sessionId ||
    req.query.sessionId ||
    req.headers["x-session-id"];

  if (requestSessionId && requestSessionId.toString() !== userSessionId) {
    return next(
      new AppError(
        "Forbidden: Request session ID does not match token session ID.",
        403
      )
    );
  }

  next();
};
