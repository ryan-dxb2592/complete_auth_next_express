import { ApiResponse, sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { VerifyEmailResponse, verifyEmailSchema } from "./schema";
import { catchAsync } from "@/helpers/catchAsync";
import { Request, Response } from "express";
import { HTTP_STATUS } from "@/constants";
import { verifyEmailService } from "./service";

/**
 * @swagger
 * /auth/verify-email/{userId}/{token}:
 *   post:
 *     summary: Verify user's email address
 *     tags: [Authentication]
 *     description: Verifies a user's email address using the verification token sent to their email
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's ID
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: The verification token sent to the user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: Invalid token, expired token, or email already verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Invalid verification token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
export const verifyEmail = catchAsync(
  async (req: Request, res: Response<ApiResponse<VerifyEmailResponse>>) => {
    const { data, success, error } = verifyEmailSchema.safeParse(req);

    if (!success) {
      return sendZodError(res, error);
    }

    const { message } = await verifyEmailService(data.params);

    // Send Response
    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);
