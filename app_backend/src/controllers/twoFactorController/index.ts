import { catchAsync } from "@/helpers/catchAsync";
import { Request, Response } from "express";
import { verifyTwoFactorSchema } from "./schema";
import { HTTP_STATUS } from "@/constants";
import { sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { toggleTwoFactorService, verifyTwoFactorService } from "./service";

/**
 * @swagger
 * /auth/two-factor/toggle:
 *   post:
 *     summary: Toggle two-factor authentication
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Enables or disables two-factor authentication for the user
 *     responses:
 *       200:
 *         description: Two-factor authentication status changed
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
 *                   example: "Two-factor authentication enabled. You will receive a verification code during login."
 *       401:
 *         description: Unauthorized
 */
export const toggleTwoFactor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user;

    const { message } = await toggleTwoFactorService(userId);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);

/**
 * @swagger
 * /auth/two-factor/verify:
 *   post:
 *     summary: Verify two-factor authentication code
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Verifies the two-factor authentication code sent to the user's email
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
 *                 description: Two-factor authentication code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Two-factor authentication verified successfully
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
 *                   example: "Two-factor authentication verified successfully"
 *       400:
 *         description: Invalid or expired code
 *       401:
 *         description: Unauthorized
 */
export const verifyTwoFactor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId, email } = req.user;
    const { data, success, error } = verifyTwoFactorSchema.safeParse(req);

    if (!success) {
      return sendZodError(res, error);
    }

    const { message } = await verifyTwoFactorService(email, userId, data.body);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);
