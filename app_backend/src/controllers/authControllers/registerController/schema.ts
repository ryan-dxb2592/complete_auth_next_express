import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const registerUserSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters")
      .trim()
      .toLowerCase(),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password must be less than 100 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>["body"];

export type RegisterServiceResponse = {
  id: string;
  email: string;
  createdAt: Date;
};

export type RegisterUserResponse = ApiResponse<RegisterServiceResponse>;
