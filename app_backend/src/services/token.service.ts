import crypto from "crypto";
import jwt from "jsonwebtoken";
import {
  HTTP_STATUS,
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
} from "@/constants";
import { Request } from "express";
import { AppError } from "@/utils/error";

// Generate a verification token with a 1 hour expiry
export const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return { token, expiresAt };
};

// JWT Token Service
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: "access" | "refresh";
}

export const generateTokens = (
  userId: string,
  email: string
): TokenResponse => {
  const accessToken = jwt.sign(
    {
      userId,
      email,
      type: "access",
    },
    JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1m",
      algorithm: "HS256",
    }
  );

  const refreshToken = jwt.sign(
    {
      userId,
      email,
      type: "refresh",
    },
    JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1d",
      algorithm: "HS256",
    }
  );

  return { accessToken, refreshToken };
};

export const generateTwoFactorToken = (length: number) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  return { code: code.toString().padStart(length, "0"), expiresAt };
};

export const getTokens = async (
  req: Request
): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> => {
  let accessToken;
  let refreshToken;


  accessToken =
    // 1. Check HTTP Only Cookie (Web App)
    req.cookies?.accessToken ||
    // 2. Check Authorization Header with Bearer Token
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null) ||
    // 3. Check custom header (Mobile App)
    (req.headers["x-access-token"] as string) ||
    // 4. Check query parameter (Special cases like payment gateways/websocket/etc)
    (req.query.access_token as string);

  refreshToken =
    // 1. Check HTTP Only Cookie (Web App)
    req.cookies?.refreshToken ||
    // 2. Check custom header (Mobile App)
    (req.headers["x-refresh-token"] as string) ||
    // 3. Check query parameter (Special cases like payment gateways/websocket/etc)
    (req.query.refresh_token as string);

  return { accessToken, refreshToken };
};

export const verifyToken = async (
  token: string,
  type: "access" | "refresh"
): Promise<TokenPayload> => {
  const secret =
    type === "access" ? JWT_ACCESS_TOKEN_SECRET : JWT_REFRESH_TOKEN_SECRET;

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError("Token expired", HTTP_STATUS.UNAUTHORIZED);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid token", HTTP_STATUS.UNAUTHORIZED);
    }

    throw new Error("Invalid token");
  }
};
