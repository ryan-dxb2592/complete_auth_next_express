import prisma from "@/utils/db";
import { HTTP_STATUS } from "@/constants";
import { findUserByEmail } from "@/helpers/dbCalls/users";
import { generateVerificationToken } from "@/services/token.service";
import { AppError } from "@/utils/error";
import { sendPasswordResetEmail } from "@/services/email.service";

export const requestPasswordResetService = async (email: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  //   Create a password reset token
  const { token, expiresAt } = await generateVerificationToken();

  //   Create a password reset token in the database
  await prisma.passwordReset.upsert({
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
  await sendPasswordResetEmail({
    to: user.email,
    userId: user.id,
    token,
    expiresAt,
  });

  return {
    message: "Password reset email sent successfully",
  };
};
