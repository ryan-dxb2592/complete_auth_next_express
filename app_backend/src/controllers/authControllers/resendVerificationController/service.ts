import prisma from "@/utils/db";
import { sendVerificationEmail } from "@/services/email.service";
import { AppError } from "@/utils/error";
import { HTTP_STATUS } from "@/constants";
import {
  ResendVerificationInput,
  ResendVerificationServiceResponse,
} from "./schema";
import { generateVerificationToken } from "@/services/token.service";

export const resendVerificationService = async (
  data: ResendVerificationInput
): Promise<ResendVerificationServiceResponse> => {
  const { email } = data;

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  if (user.isVerified) {
    throw new AppError("Email is already verified", HTTP_STATUS.BAD_REQUEST);
  }

  // Create new verification token
  const { token, expiresAt } = await generateVerificationToken();

  // Update or create verification token
  await prisma.emailVerification.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      token,
      expiresAt,
    },
    update: {
      token,
      expiresAt,
    },
  });

  // Send verification email
  await sendVerificationEmail({
    to: user.email,
    userId: user.id,
    token,
    expiresIn: expiresAt.toISOString(),
  });

  return {
    message: "Verification email sent successfully",
  };
};
