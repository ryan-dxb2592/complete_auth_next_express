import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import { sendSuccess } from "@/helpers/apiResponse";
import { HTTP_STATUS } from "@/constants";

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify authentication status
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Verifies if the user is authenticated
 *     responses:
 *       200:
 *         description: User is authenticated
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
 *                   example: "User is authenticated"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid token
 */
export const verifyAuth = catchAsync(async (req: Request, res: Response) => {
  // The request already passed through authMiddleware, so we know the user is authenticated
  // and the user information is available in req.user
  
  return sendSuccess(
    res,
    "User is authenticated",
    req.user,
    HTTP_STATUS.OK
  );
});
