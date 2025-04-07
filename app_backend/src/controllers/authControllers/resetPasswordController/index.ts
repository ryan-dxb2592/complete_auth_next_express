import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import { resetPasswordSchema } from "./schema";
import { sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { resetPasswordService } from "./service";
import { HTTP_STATUS } from "@/constants";

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     description: Resets user password using a token sent to their email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token sent to user's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: "Password reset successfully. You can now login with your new password."
 *       400:
 *         description: Invalid or expired token
 */
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { data, success, error } = resetPasswordSchema.safeParse(req);

  if (!success) {
    return sendZodError(res, error);
  }

  const { message } = await resetPasswordService(data.body);

  return sendSuccess(res, message, null, HTTP_STATUS.OK);
});
