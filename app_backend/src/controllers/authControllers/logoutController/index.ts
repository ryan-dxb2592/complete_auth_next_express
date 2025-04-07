import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import prisma from "@/utils/db";
import { sendSuccess } from "@/helpers/apiResponse";
import { HTTP_STATUS } from "@/constants";

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Ends the current user session and invalidates tokens
 *     responses:
 *       200:
 *         description: Logged out successfully
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
 *                   example: "Logged out successfully"
 *       401:
 *         description: Unauthorized - Invalid token
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.user;

  // Delete the session
  await prisma.session.delete({
    where: {
      id: sessionId,
    },
  });

  // Remove Cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return sendSuccess(res, "Logged out successfully", null, HTTP_STATUS.OK);
});

/**
 * @swagger
 * /auth/logout-all:
 *   post:
 *     summary: Logout from all active sessions
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Ends all active user sessions and invalidates all tokens
 *     responses:
 *       200:
 *         description: All sessions logged out successfully
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
 *                   example: "All sessions logged out successfully"
 *       401:
 *         description: Unauthorized - Invalid token
 */
export const logoutAllSessions = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user;

    // Delete all sessions for the user
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });

    // Remove Cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return sendSuccess(
      res,
      "All sessions logged out successfully",
      null,
      HTTP_STATUS.OK
    );
  }
);
