import { catchAsync } from "@/helpers/catchAsync";
import { Response } from "express";

export const enableTwoFactor = catchAsync(
  async (req: Request, res: Response) => {
    const { data, success, error } = toggleTwoFactorSchema.safeParse(req);
  }
);
