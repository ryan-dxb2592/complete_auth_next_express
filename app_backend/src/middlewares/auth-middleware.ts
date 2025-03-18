import { Request, Response, NextFunction } from "express";
import { getTokens, verifyToken } from "@/services/token.service";
import { AppError } from "@/utils/error";
import { HTTP_STATUS } from "@/constants";
import { getSessionByUserId } from "@/helpers/dbCalls/session";
import { sendError } from "@/helpers/apiResponse";

// Only check for access token and if not send 401

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { accessToken } = await getTokens(req);

    if (!accessToken) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if access token is expired
    const decoded = await verifyToken(accessToken, "access");

    // Get session from database
    const existingSession = await getSessionByUserId(decoded.userId);

    if (!existingSession) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if session is expired
    if (existingSession.expiresAt < new Date()) {
      throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
    }

    req.user = {
      userId: existingSession.userId,
      email: existingSession.user.email,
      sessionId: existingSession.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};
