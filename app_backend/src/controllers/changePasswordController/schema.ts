import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const changePasswordSchema = z
  .object({
    body: z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"
        ),
      confirmPassword: z.string().min(1, "Confirm password is required"),
    }),
  })
  .refine((data) => data.body.newPassword === data.body.confirmPassword, {
    message: "Passwords do not match",
    path: ["body", "confirmPassword"],
  });

export const verifyChangePasswordSchema = z.object({
  body: z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    code: z.string().length(6, "Code must be 6 digits"),
  }),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>["body"];
export type VerifyChangePasswordInput = z.infer<
  typeof verifyChangePasswordSchema
>["body"];

export interface ChangePasswordResponse {
  message: string;
}

export interface VerifyChangePasswordResponse {
  message: string;
}
