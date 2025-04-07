import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import {
  ChangePasswordResponse,
  VerifyChangePasswordResponse,
  changePasswordSchema,
  verifyChangePasswordSchema,
} from "./schema";
import {
  ApiResponse,
  sendSuccess,
  sendZodError,
} from "@/helpers/apiResponse";
import { changePasswordService, verifyChangePasswordService } from "./service";
import { HTTP_STATUS } from "@/constants";

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    sessionId: string;
  };
}

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Changes user password with optional 2FA verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password changed successfully or 2FA code sent
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

export const changePassword = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<ChangePasswordResponse>>
  ) => {
    const { data, success, error } = changePasswordSchema.safeParse(req);

    if (!success) {
      return sendZodError(res, error);
    }

    const response = await changePasswordService(req.user.userId, data.body);

    if (response.responseType === "TWO_FACTOR") {
      return sendSuccess(
        res,
        "Please check your email for the verification code",
        null,
        HTTP_STATUS.OK
      );
    }

    return sendSuccess(
      res,
      "Password changed successfully",
      null,
      HTTP_STATUS.OK
    );
  }
);

/**
 * @swagger
 * /auth/verify-change-password:
 *   post:
 *     summary: Verify 2FA code for password change
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Verifies 2FA code and completes password change
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: 2FA verification code
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid or expired code
 *       401:
 *         description: Unauthorized
 */

export const verifyChangePasswordTwoFactor = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse<VerifyChangePasswordResponse>>
  ) => {
    const { userId } = req.user;
    const { data, success, error } = verifyChangePasswordSchema.safeParse(req);

    if (!success) {
      return sendZodError(res, error);
    }

    const { message } = await verifyChangePasswordService(userId, data.body);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);
