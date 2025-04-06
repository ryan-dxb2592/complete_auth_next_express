import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import { requestPasswordResetSchema } from "./schema";
import { sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { HTTP_STATUS } from "@/constants";
import { requestPasswordResetService } from "./service";

/**
 * @swagger
 * /auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     description: Sends a password reset link to the user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: "If your email is registered, you will receive a password reset link shortly."
 *       400:
 *         description: Validation error
 */
export const requestPasswordReset = catchAsync(
  async (req: Request, res: Response) => {
    const { data, success, error } = requestPasswordResetSchema.safeParse(req);
    if (!success) {
      return sendZodError(res, error);
    }

    const { message } = await requestPasswordResetService(data.body.email);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);
