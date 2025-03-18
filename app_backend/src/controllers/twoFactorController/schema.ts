import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const toggleTwoFactorSchema = z.object({
  enable: z.boolean().optional(),
  disable: z.boolean().optional(),
});

export type ToggleTwoFactorInput = z.infer<typeof toggleTwoFactorSchema>;

export type ToggleTwoFactorServiceResponse = {
  message: string;
};

export type ToogleTwoFactorResponse =
  ApiResponse<ToggleTwoFactorServiceResponse>;

export const verifyTwoFactorSchema = z.object({
  code: z.string(),
});

export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;

export type VerifyTwoFactorServiceResponse = {
  message: string;
};

export type VerifyTwoFactorResponse =
  ApiResponse<VerifyTwoFactorServiceResponse>;
