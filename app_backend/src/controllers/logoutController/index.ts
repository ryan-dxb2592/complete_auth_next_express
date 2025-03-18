import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import prisma from "@/utils/db";
import { sendSuccess } from "@/helpers/apiResponse";
import { HTTP_STATUS } from "@/constants";

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
