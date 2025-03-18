import { ApiResponse } from "@/helpers/apiResponse";
import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export type RequestPasswordResetInput = z.infer<
  typeof requestPasswordResetSchema
>;

export type RequestPasswordResetServiceResponse = {
  message: string;
};

export type RequestPasswordResetResponse =
  ApiResponse<RequestPasswordResetServiceResponse>;
