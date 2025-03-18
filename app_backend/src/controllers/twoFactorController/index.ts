import { catchAsync } from "@/helpers/catchAsync";
import { Request, Response } from "express";
import { verifyTwoFactorSchema } from "./schema";
import { HTTP_STATUS } from "@/constants";
import { sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { toggleTwoFactorService, verifyTwoFactorService } from "./service";

export const toggleTwoFactor = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.user;

    const { message } = await toggleTwoFactorService(userId);

    return sendSuccess(res, message, null, HTTP_STATUS.OK);
  }
);

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
