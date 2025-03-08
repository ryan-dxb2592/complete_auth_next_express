import { Response } from "express";
import { HTTP_STATUS } from "../constants";
import { ZodError } from "zod";

// Type for HTTP status values
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

// Interface for API response structure
export interface ApiResponse<T = any> {
  status: "success" | "error";
  message: string;
  data?: T;
  errors?: string[];
}

/**
 * Sends a standardized API response
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param status - Response status ('success' | 'error')
 * @param message - Response message
 * @param data - Optional data payload
 * @param errors - Optional array of error messages
 * @returns Express Response
 */
export const sendApiResponse = <T>(
  res: Response,
  statusCode: HttpStatus,
  status: "success" | "error",
  message: string,
  data?: T,
  errors?: string[]
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    status,
    message,
    ...(data && { data }),
    ...(errors && { errors }),
  };

  return res.status(statusCode).json(response);
};

/**
 * Sends a success response
 * @param res - Express Response object
 * @param message - Success message
 * @param data - Optional data payload
 * @param statusCode - Optional HTTP status code (defaults to 200)
 * @returns Express Response
 */
export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: HttpStatus = HTTP_STATUS.OK
): Response<ApiResponse<T>> => {
  return sendApiResponse(res, statusCode, "success", message, data);
};

/**
 * Sends an error response
 * @param res - Express Response object
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param errors - Optional array of error messages
 * @returns Express Response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: HttpStatus = HTTP_STATUS.BAD_REQUEST,
  errors?: string[]
): Response<ApiResponse> => {
  return sendApiResponse(res, statusCode, "error", message, undefined, errors);
};

/**
 * Formats ZodError into string array of error messages
 * @param error - ZodError object
 * @returns Array of error messages
 */
export const formatZodError = (error: ZodError): string[] => {
  return error.errors.map((err) => `${err.path.join(".")}: ${err.message}`);
};

/**
 * Sends a validation error response for Zod errors
 * @param res - Express Response object
 * @param error - ZodError object
 * @returns Express Response
 */
export const sendZodError = (
  res: Response,
  error: ZodError
): Response<ApiResponse> => {
  return sendError(
    res,
    "Validation failed",
    HTTP_STATUS.BAD_REQUEST,
    formatZodError(error)
  );
};

/**
 * Usage Examples:
 *
 * // Success response with data
 * sendSuccess(res, 'User registered successfully', user, HTTP_STATUS.CREATED);
 *
 * // Success response without data
 * sendSuccess(res, 'Email sent successfully');
 *
 * // Error response with validation errors
 * sendError(
 *   res,
 *   'Validation failed',
 *   HTTP_STATUS.BAD_REQUEST,
 *   ['Email is required', 'Password must be at least 8 characters']
 * );
 *
 * // Error response without additional errors array
 * sendError(res, 'User not found', HTTP_STATUS.NOT_FOUND);
 */
