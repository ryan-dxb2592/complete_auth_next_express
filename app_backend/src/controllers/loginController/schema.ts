import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const loginUserSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(8, "Password must be at least 8 characters"),
    refreshToken: z.string().optional(),
  }),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>["body"];

export type LoginServiceResponse = {
  user: {
    id: string;
    email: string;
    isVerified: boolean;
    isTwoFactorEnabled: boolean;
  };
  session: {
    id: string;
    ipAddress: string;
    deviceType: string | null;
    deviceName: string | null;
    browser: string | null;
    os: string | null;
    accessToken: string;
    refreshToken: string;
  };
};

export type LoginUserResponse = ApiResponse<{
  user: {
    id: string;
    email: string;
    isVerified: boolean;
    isTwoFactorEnabled: boolean;
  };
  session: {
    id: string;
    ipAddress: string;
    deviceType: string | null;
    deviceName: string | null;
    browser: string | null;
    os: string | null;
  };
  accessToken?: string;
  refreshToken?: string;
}>;

// Two Factor Auth Schema

export const twoFactorLoginSchema = z.object({
  body: z.object({
    userId: z
      .string({ required_error: "User ID is required" })
      .uuid("Invalid user ID format"),
    code: z
      .string({ required_error: "2FA code is required" })
      .length(6, "2FA code must be 6 characters"),
    type: z.enum(["LOGIN", "PASSWORD_CHANGE"]).optional(),
  }),
});

export type TwoFactorLoginInput = z.infer<typeof twoFactorLoginSchema>["body"];

export type TwoFactorLoginServiceResponse = {
  code: string;
  userId: string;
  type: "LOGIN" | "PASSWORD_CHANGE";
};
