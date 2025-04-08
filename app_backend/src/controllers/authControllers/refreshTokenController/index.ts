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
import { OAuth2Client } from "google-auth-library";
import { decrypt, encrypt } from "@/utils/encrypt-decrypt";

// Token expiration constants
const ACCESS_TOKEN_EXPIRY = 5 * 60 * 1000; // 5 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Uses the refresh token to generate a new access token
 *     parameters:
 *       - in: cookie
 *         name: refreshToken
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh token stored in cookies (for web) or sent in headers (for mobile)
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     session:
 *                       type: object
 *       401:
 *         description: Invalid refresh token or session expired
 */

// Helper function to handle token response
const handleTokenResponse = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  session: any,
  isDeviceMobile: boolean
) => {
  const { user, refreshToken: tokens, ...sessionWithoutUser } = session;

  // Handle mobile response
  if (isDeviceMobile) {
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-refresh-token", refreshToken);

    return sendSuccess(
      res,
      "Token refreshed successfully",
      {
        user: session.user,
        session: sessionWithoutUser,
        accessToken,
        refreshToken,
      },
      HTTP_STATUS.OK
    );
  }

  // Handle web response
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.NODE_ENV === "production" ? process.env.COOKIE_DOMAIN : undefined,
    path: "/",
  } as const;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  // In development, also include tokens in the response body to aid debugging
  const responseData = process.env.NODE_ENV === "production" 
    ? { user: session.user, session: sessionWithoutUser }
    : { 
        user: session.user, 
        session: sessionWithoutUser,
        _debug: { accessToken, refreshToken } 
      };

  return sendSuccess(
    res,
    "Token refreshed successfully",
    responseData,
    HTTP_STATUS.OK
  );
};

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  console.log("Refresh TOken Endpoint Hit ......................................")
  console.log("Refresh Token Request Cookies:", req.cookies);
  console.log("Origin:", req.headers.origin);
  console.log("Referer:", req.headers.referer);

  const ipAddress = requestIp.getClientIp(req) || "";
  const uaParser = new UAParser(req.headers["user-agent"] || "");
  const isDeviceMobile = await isMobile(req.headers["user-agent"] || "");
  
  // Get the refresh token from multiple sources
  let refreshToken = req.cookies?.refreshToken;
  
  // If not in cookie, try headers
  if (!refreshToken) {
    refreshToken = req.headers["x-refresh-token"] as string || 
                  (req.headers.authorization?.startsWith("Bearer ") 
                    ? req.headers.authorization.split(" ")[1] 
                    : null);
  }

  // Log the token source and whether it was found
  console.log("Refresh Token Source:", refreshToken ? (req.cookies?.refreshToken ? "Cookie" : "Header") : "Not found");

  if (!refreshToken) {
    throw new AppError("Invalid refresh token - Token not provided", HTTP_STATUS.UNAUTHORIZED);
  }

  try {
    const decoded = (await verifyToken(refreshToken, "refresh")) as TokenPayload;
    console.log("Token successfully decoded:", decoded.userId);

    // Get session from database with refresh token
    const session = await getSessionByRefreshToken(refreshToken);

    if (!session) {
      throw new AppError("Invalid refresh token - Session not found", HTTP_STATUS.UNAUTHORIZED);
    }

    // Check if session is valid
    if (session?.userId !== decoded.userId) {
      throw new AppError("Unauthorized - User ID mismatch", HTTP_STATUS.UNAUTHORIZED);
    }

    // Skip IP validation in development to make debugging easier
    if (process.env.NODE_ENV === "production") {
      // Check if ip and user agent are the same as the session since the session is device specific
      if (
        session.ipAddress !== ipAddress ||
        session.userAgent !== uaParser.getUA()
      ) {
        throw new AppError("Session mismatch", HTTP_STATUS.UNAUTHORIZED);
      }
    } else {
      // In development, log the IP and agent but don't enforce match
      console.log("IP address match:", session.ipAddress === ipAddress);
      console.log("User agent match:", session.userAgent === uaParser.getUA());
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Try to renew using Google refresh token if available
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { profile: true }
      });

      if (user?.googleRefreshToken) {
        try {
          // Decrypt Google refresh token
          const decryptedRefreshToken = decrypt(user.googleRefreshToken);
          
          const oAuth2Client = new OAuth2Client(
            process.env.GOOGLE_CLIENT_ID!,
            process.env.GOOGLE_CLIENT_SECRET!
          );
          oAuth2Client.setCredentials({ refresh_token: decryptedRefreshToken });
          
          const { credentials } = await oAuth2Client.refreshAccessToken();
          if (!credentials.id_token) throw new Error('Invalid Google token');

          // Verify refreshed Google token
          const ticket = await oAuth2Client.verifyIdToken({
            idToken: credentials.id_token,
            audience: process.env.GOOGLE_CLIENT_ID!
          });
          const payload = ticket.getPayload();
          if (!payload || payload.email !== user.email) {
            throw new AppError('Google token validation failed', HTTP_STATUS.UNAUTHORIZED);
          }

          // Update user's Google tokens
          const encryptedRefresh = credentials.refresh_token 
            ? encrypt(credentials.refresh_token)
            : user.googleRefreshToken;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              googleAccessToken: credentials.access_token ? encrypt(credentials.access_token) : user.googleAccessToken,
              googleRefreshToken: encryptedRefresh,
              googleTokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
            }
          });

          // Create new session and tokens
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email);
          
          // Delete expired session
          await prisma.session.delete({ where: { id: session.id } });
          
          // Create new session
          const newSession = await prisma.session.create({
            data: {
              userId: user.id,
              ipAddress,
              userAgent: uaParser.getUA(),
              deviceType: uaParser.getDevice().type || null,
              deviceName: uaParser.getDevice().model || null,
              browser: uaParser.getBrowser().name || null,
              os: uaParser.getOS().name || null,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
              refreshToken: {
                create: {
                  token: newRefreshToken,
                  expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
                }
              }
            },
            include: {
              user: true,
              refreshToken: true,
            }
          });

          return handleTokenResponse(res, newAccessToken, newRefreshToken, newSession, isDeviceMobile);
        } catch (error) {
          console.error("Google refresh token error:", error);
          // Delete the expired session
          await prisma.session.delete({ where: { id: session.id } });
          throw new AppError("Session expired, please login again", HTTP_STATUS.UNAUTHORIZED);
        }
      } else {
        throw new AppError("Session expired, please login again", HTTP_STATUS.UNAUTHORIZED);
      }
    }

    // Normal refresh token flow for non-expired sessions
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      session.userId,
      session.user.email
    );

    console.log("Generated new tokens successfully");

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

    console.log("Session updated successfully");
    return handleTokenResponse(res, accessToken, newRefreshToken, updatedSession, isDeviceMobile);
  } catch (error) {
    console.error("Refresh token error:", error);
    throw error;
  }
});
