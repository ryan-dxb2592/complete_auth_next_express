import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string",
      })
      .email("Invalid email format")
      .trim()
      .toLowerCase(),
  }),
});

export type ResendVerificationInput = z.infer<
  typeof resendVerificationSchema
>["body"];

export type ResendVerificationServiceResponse = {
  message: string;
};

export type ResendVerificationResponse =
  ApiResponse<ResendVerificationServiceResponse>;
