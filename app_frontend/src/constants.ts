/**
 * API endpoint for the backend server
 * This should be set to the base URL of your API
 */
export const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Authentication endpoints
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  LOGOUT: '/api/v1/auth/logout',
  VERIFY_EMAIL: '/api/v1/auth/verify-email',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  GOOGLE_AUTH: '/api/v1/auth/google-auth',
};

/**
 * Cookie names
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
};

/**
 * HTTP status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}; 