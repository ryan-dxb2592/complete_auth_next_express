import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import { requestPasswordResetSchema } from "./schema";
import { sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { HTTP_STATUS } from "@/constants";
import { requestPasswordResetService } from "./service";

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
