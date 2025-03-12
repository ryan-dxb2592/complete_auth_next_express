import prisma from "@/utils/db";
import { VerifyEmailInput, VerifyEmailServiceResponse } from "./schema";
import { HTTP_STATUS } from "@/constants";
import { AppError } from "@/utils/error";
import { sendVerifiedEmail } from "@/services/email.service";

export const verifyEmailService = async (
  data: VerifyEmailInput
): Promise<VerifyEmailServiceResponse> => {
  const { userId, token } = data;

  // Find User
  const verification = await prisma.emailVerification.findUnique({
    where: {
      userId,
      token,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          isVerified: true,
        },
      },
    },
  });

  if (!verification || !verification.user) {
    throw new AppError("Invalid verification token", HTTP_STATUS.BAD_REQUEST);
  }

  // Check if email is already verified
  if (verification.user.isVerified) {
    throw new AppError("Email already verified", HTTP_STATUS.BAD_REQUEST);
  }

  // Check if token has expired
  if (verification.expiresAt < new Date()) {
    throw new AppError("Verification token expired", HTTP_STATUS.BAD_REQUEST);
  }

  // Update user email verification status using transaction
  const [verifiedUser, updatedVerification] = await prisma.$transaction([
    prisma.user.update({
      where: { id: verification.user.id },
      data: { isVerified: true },
      select: {
        email: true,
        isVerified: true,
      },
    }),
    prisma.emailVerification.delete({
      where: { id: verification.id },
    }),
  ]);

  // Send verification complete email
  await sendVerifiedEmail({
    to: verification.user.email,
  });

  return {
    message: "Email verified successfully",
  };
};
