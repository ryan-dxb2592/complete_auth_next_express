import { catchAsync } from "@/helpers/catchAsync";
import { Request, Response } from "express";
import { toggleTwoFactorSchema, verifyTwoFactorSchema } from "./schema";
import { HTTP_STATUS } from "@/constants";
import { sendError, sendSuccess } from "@/helpers/apiResponse";
import prisma from "@/utils/db";
import { generateTwoFactorToken } from "@/services/token.service";
import { toggleTwoFactorService, verifyTwoFactorService } from "./service";

export const toggleTwoFactor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user;
    const { data, success, error } = toggleTwoFactorSchema.safeParse(req);

    if (!success) {
      return sendError(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }

    const { message } = await toggleTwoFactorService(userId, data);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);

export const verifyTwoFactor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user;
    const { data, success, error } = verifyTwoFactorSchema.safeParse(req);

    if (!success) {
      return sendError(res, error.message, HTTP_STATUS.BAD_REQUEST);
    }

    const { message } = await verifyTwoFactorService(userId, data);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);
