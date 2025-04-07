import { Request, Response } from "express";
import { sendSuccess } from "@/helpers/apiResponse";
import { catchAsync } from "@/helpers/catchAsync";
import { HTTP_STATUS } from "@/constants";



export const getMeController = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  return sendSuccess(res, "User fetched successfully", user, HTTP_STATUS.OK);
});


