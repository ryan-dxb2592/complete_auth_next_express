import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { z } from "zod";
import { AppError } from "@/utils/error";
import { logger } from "@/utils/logger";
import { HTTP_STATUS } from "@/constants";

interface ValidationError {
  path: string;
  message: string;
}

const handleZodError = (res: Response, error: z.ZodError) => {
  // Create a map to store first error for each path
  const errorMap = new Map<string, string>();

  // Only keep first error for each path
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    if (!errorMap.has(path)) {
      errorMap.set(path, err.message);
    }
  });

  // Convert map to array of validation errors
  const errors: ValidationError[] = Array.from(errorMap.entries()).map(
    ([path, message]) => ({
      path,
      message,
    })
  );

  return res.status(HTTP_STATUS.BAD_REQUEST).json({
    status: "error",
    message: "Validation failed",
    errors,
  });
};

const handlePrismaError = (res: Response, error: any) => {
  // Handle unique constraint violations
  if (error.code === "P2002") {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      status: "error",
      message: `${error.meta?.target?.[0] || "Field"} already exists`,
    });
  }

  // Handle record not found
  if (error.code === "P2025") {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      status: "error",
      message: "Record not found",
    });
  }

  // Handle other Prisma errors
  return res.status(HTTP_STATUS.BAD_REQUEST).json({
    status: "error",
    message: "Database operation failed",
  });
};

const handleJWTError = (res: Response) => {
  return res.status(HTTP_STATUS.UNAUTHORIZED).json({
    status: "error",
    message: "Invalid token. Please log in again.",
  });
};

const handleJWTExpiredError = (res: Response) => {
  return res.status(HTTP_STATUS.UNAUTHORIZED).json({
    status: "error",
    message: "Your token has expired. Please log in again.",
  });
};

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof z.ZodError) {
    handleZodError(res, err);
    return next();
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    return next();
  }

  // Handle Prisma errors
  if (
    err.name === "PrismaClientKnownRequestError" ||
    err.name === "PrismaClientValidationError"
  ) {
    handlePrismaError(res, err);
    return next();
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    handleJWTError(res);
    return next();
  }

  if (err.name === "TokenExpiredError") {
    handleJWTExpiredError(res);
    return next();
  }

  // Handle all other errors
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    status: "error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong!",
  });
  return next();
};
