import { Request, Response } from "express";
import { ResendVerificationResponse, resendVerificationSchema } from "./schema";
import { resendVerificationService } from "./service";
import { ApiResponse, sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { catchAsync } from "@/helpers/catchAsync";
import { HTTP_STATUS } from "@/constants";

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Authentication]
 *     description: Resends the verification email to the user's email address. Rate limited to 5 requests per hour.
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
 *                 description: The email address of the user
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification email sent successfully
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
 *                   example: Verification email sent successfully
 *       400:
 *         description: Bad request - Invalid email format or email already verified
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
 *                   example: Email is already verified
 *       404:
 *         description: User not found
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
 *                   example: User not found
 *       429:
 *         description: Too many requests - Rate limit exceeded
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
 *                   example: Too many verification emails sent. Please try again later.
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
export const resendVerification = catchAsync(
  async (
    req: Request,
    res: Response<ApiResponse<ResendVerificationResponse>>
  ) => {
    // Validate request body
    const { data, success, error } = resendVerificationSchema.safeParse(req);

    if (!success) {
      return sendZodError(res, error);
    }

    // Process resend verification
    const { message } = await resendVerificationService(data.body);

    // Return success response
    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);
