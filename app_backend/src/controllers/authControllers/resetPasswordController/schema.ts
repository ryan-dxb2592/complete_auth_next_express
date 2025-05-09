import { z } from "zod";
import { ApiResponse } from "@/helpers/apiResponse";

export const resetPasswordSchema = z.object({
  body: z.object({
    userId: z.string(),
    token: z.string(),
    password: z.string().min(8),
  }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>["body"];

export type ResetPasswordServiceResponse = {
  message: string;
};

export type ResetPasswordResponse = ApiResponse<ResetPasswordServiceResponse>;
