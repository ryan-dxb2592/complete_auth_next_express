import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import {
  LoginUserResponse,
  loginUserSchema,
  twoFactorLoginSchema,
} from "./schema";
import {
  ApiResponse,
  sendError,
  sendSuccess,
  sendZodError,
} from "@/helpers/apiResponse";
import { loginUserService, verifyTwoFactorService } from "./service";
import { UAParser } from "ua-parser-js";
import requestIp from "request-ip";
import { HTTP_STATUS } from "@/constants";
import { getTokens } from "@/services/token.service";
import { isMobile } from "@/utils/isMobile";

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticates a user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: User's password
 *                 example: "Password123@"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "user@example.com"
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Validation error"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                       message:
 *                         type: string
 *       401:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid email or password"
 */

// Token handling middleware
const handleTokens = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  isDeviceMobile: boolean
) => {
  if (isDeviceMobile) {
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-refresh-token", refreshToken);
    return true;
  }

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  return false;
};

export const loginUser = catchAsync(
  async (
    req: Request,
    res: Response<ApiResponse<LoginUserResponse | null>>
  ) => {
    // Get User Agent and Browser details
    const ipAddress = requestIp.getClientIp(req) || "";
    const uaParser = UAParser(req.headers["user-agent"] || "");
    const isDeviceMobile = await isMobile(req.headers["user-agent"] || "");
    const existingRefreshToken = req.cookies?.refreshToken || "";

    // Validate Request Body
    const { data, success, error } = loginUserSchema.safeParse(req);
    if (!success) {
      return sendZodError(res, error);
    }

    // Login User
    const response = await loginUserService(
      data.body,
      ipAddress,
      uaParser,
      existingRefreshToken
    );

    if (!response) {
      return sendError(res, "Login failed", HTTP_STATUS.UNAUTHORIZED);
    }

    if (response.responseType === "TWO_FACTOR") {
      return sendSuccess(
        res,
        "Two-factor authentication code sent",
        { userId: response.userId },
        HTTP_STATUS.OK
      );
    }

    if (response.responseType === "LOGIN") {
      const { accessToken, refreshToken, ...sessionWithoutTokens } =
        response.session;
      const isMobileDevice = handleTokens(
        res,
        accessToken,
        refreshToken,
        isDeviceMobile
      );

      return sendSuccess(
        res,
        "Login successful",
        {
          user: response.user,
          session: sessionWithoutTokens,
          ...(isMobileDevice && { accessToken, refreshToken }),
        },
        HTTP_STATUS.OK
      );
    }

    return sendError(res, "Login failed", HTTP_STATUS.UNAUTHORIZED);
  }
);

export const verifyLoginTwoFactor = catchAsync(
  async (
    req: Request,
    res: Response<ApiResponse<LoginUserResponse | null>>
  ) => {
    const ipAddress = requestIp.getClientIp(req) || "";
    const uaParser = UAParser(req.headers["user-agent"] || "");
    const isDeviceMobile = await isMobile(req.headers["user-agent"] || "");
    const { refreshToken: existingRefreshToken } = await getTokens(req);

    const { data, success, error } = twoFactorLoginSchema.safeParse(req);

    if (!success) {
      return sendZodError(res, error);
    }

    const response = await verifyTwoFactorService(
      data.body,
      ipAddress,
      uaParser,
      existingRefreshToken
    );

    if (!response) {
      return sendError(res, "Login failed", HTTP_STATUS.UNAUTHORIZED);
    }

    const { accessToken, refreshToken, ...sessionWithoutTokens } =
      response.session;
    const isMobileDevice = handleTokens(
      res,
      accessToken,
      refreshToken,
      isDeviceMobile
    );

    return sendSuccess(
      res,
      "Login successful",
      {
        user: response.user,
        session: sessionWithoutTokens,
        ...(isMobileDevice && { accessToken, refreshToken }),
      },
      HTTP_STATUS.OK
    );
  }
);
