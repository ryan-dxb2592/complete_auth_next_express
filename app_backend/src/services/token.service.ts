import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import {
  JWT_ACCESS_TOKEN_SECRET,
  JWT_REFRESH_TOKEN_SECRET,
  JWT_ACCESS_TOKEN_EXPIRATION,
  JWT_REFRESH_TOKEN_EXPIRATION,
} from "@/constants";

// Generate a verification token with a 1 hour expiry
export const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return { token, expiresAt };
};

// JWT Token Service
interface TokenResponse {
  accessToken: string;
  refreshToken: string;
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
      expiresIn: "5m",
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
