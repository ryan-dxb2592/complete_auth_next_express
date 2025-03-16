import dotenv from "dotenv";

dotenv.config();

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const PORT: string = process.env.PORT || "3000";
export const DATABASE_URL: string = process.env.DATABASE_URL || "";

// Token Constants
export const JWT_ACCESS_TOKEN_SECRET: string =
  process.env.JWT_ACCESS_TOKEN_SECRET || "";
export const JWT_REFRESH_TOKEN_SECRET: string =
  process.env.JWT_REFRESH_TOKEN_SECRET || "";
export const JWT_ACCESS_TOKEN_EXPIRATION =
  process.env.JWT_ACCESS_TOKEN_EXPIRATION || "15m";
export const JWT_REFRESH_TOKEN_EXPIRATION =
  process.env.JWT_REFRESH_TOKEN_EXPIRATION || "7d";

// Mail
export const MAIL_HOST: string = process.env.MAILTRAP_HOST || "";
export const MAIL_PORT: string = process.env.MAILTRAP_PORT || "";
export const MAIL_USER: string = process.env.MAILTRAP_USER || "";
export const MAIL_PASS: string = process.env.MAILTRAP_PASS || "";
