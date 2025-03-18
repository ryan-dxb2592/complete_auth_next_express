import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export type ToggleTwoFactorServiceResponse = {
  message: string;
};

export type ToogleTwoFactorResponse =
  ApiResponse<ToggleTwoFactorServiceResponse>;

export const verifyTwoFactorSchema = z.object({
  body: z.object({
    code: z.string(),
  }),
});

export type VerifyTwoFactorInput = z.infer<
  typeof verifyTwoFactorSchema
>["body"];

export type VerifyTwoFactorServiceResponse = {
  message: string;
};

export type VerifyTwoFactorResponse =
  ApiResponse<VerifyTwoFactorServiceResponse>;
