import { Request, Response } from "express";
import { catchAsync } from "@/helpers/catchAsync";
import { resetPasswordSchema } from "./schema";
import { sendSuccess, sendZodError } from "@/helpers/apiResponse";
import { resetPasswordService } from "./service";
import { HTTP_STATUS } from "@/constants";

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { data, success, error } = resetPasswordSchema.safeParse(req);

  if (!success) {
    return sendZodError(res, error);
  }

  const { message } = await resetPasswordService(data.body);

  return sendSuccess(res, message, null, HTTP_STATUS.OK);
});
