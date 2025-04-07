import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const verifyEmailSchema = z.object({
  params: z.object({
    userId: z
      .string({ required_error: "User ID is required" })
      .uuid("Invalid user ID format"),
    token: z
      .string({ required_error: "Verification token is required" })
      .min(1, "Verification token cannot be empty"),
  }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>["params"];

export type VerifyEmailServiceResponse = {
  message: string;
};

export type VerifyEmailResponse = ApiResponse<VerifyEmailServiceResponse>;
