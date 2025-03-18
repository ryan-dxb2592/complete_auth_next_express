import { HTTP_STATUS } from "@/constants";
import { sendSuccess } from "@/helpers/apiResponse";
import { catchAsync } from "@/helpers/catchAsync";
import { getSessionByRefreshToken } from "@/helpers/dbCalls/session";
import {
  generateTokens,
  getTokens,
  verifyToken,
  TokenPayload,
} from "@/services/token.service";
import { AppError } from "@/utils/error";
import { isMobile } from "@/utils/isMobile";
import { Request, Response } from "express";
import prisma from "@/utils/db";
import requestIp from "request-ip";
import { UAParser } from "ua-parser-js";

// Token expiration constants
const ACCESS_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const ipAddress = requestIp.getClientIp(req) || "";
  const uaParser = UAParser(req.headers["user-agent"] || "");
  const { refreshToken } = await getTokens(req);
  const isDeviceMobile = await isMobile(req.headers["user-agent"] || "");

  if (!refreshToken) {
    throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
  }

  const decoded = (await verifyToken(refreshToken, "refresh")) as TokenPayload;

  console.log("decoded", decoded);

  // Get session from database with refresh token
  const session = await getSessionByRefreshToken(refreshToken);

  if (!session) {
    throw new AppError("Invalid refresh token", HTTP_STATUS.UNAUTHORIZED);
  }

  // Check if session is expired
  if (session?.expiresAt < new Date()) {
    throw new AppError(
      "Session expired, please login again",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  // Check if session is valid
  if (session?.userId !== decoded.userId) {
    throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  console.log("session.userAgent", session.userAgent);
  console.log("uaParser.ua.toString()", uaParser.ua.toString());

  // Check if ip and uaParser are the same as the session since the session are device specific
  if (
    session.ipAddress !== ipAddress ||
    session.userAgent !== uaParser.ua.toString()
  ) {
    throw new AppError("Session mismatch", HTTP_STATUS.UNAUTHORIZED);
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    session.userId,
    session.user.email
  );

  // Update session with new token and expiry
  const updatedSession = await prisma.session.update({
    where: { id: session.id },
    data: {
      lastUsed: new Date(),
      refreshToken: {
        update: {
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
        },
      },
    },
    include: {
      user: true,
      refreshToken: true,
    },
  });

  if (!updatedSession) {
    throw new AppError(
      "Failed to refresh token",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }

  const { user, refreshToken: tokens, ...sessionWithoutUser } = updatedSession;

  // Handle mobile response
  if (isDeviceMobile) {
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-refresh-token", newRefreshToken);

    return sendSuccess(
      res,
      "Token refreshed successfully",
      {
        user: updatedSession.user,
        session: sessionWithoutUser,
        accessToken,
        refreshToken: newRefreshToken,
      },
      HTTP_STATUS.OK
    );
  }

  // Handle web response
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  } as const;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refreshToken", newRefreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  return sendSuccess(
    res,
    "Token refreshed successfully",
    { user: updatedSession.user, session: sessionWithoutUser },
    HTTP_STATUS.OK
  );
});
