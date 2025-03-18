import prisma from "@/utils/db";
import { ResetPasswordInput } from "./schema";
import { AppError } from "@/utils/error";
import { HTTP_STATUS } from "@/constants";
import bcrypt from "bcryptjs";
import { sendPasswordChangeCompleteEmail } from "@/services/email.service";

export const resetPasswordService = async (data: ResetPasswordInput) => {
  const { userId, token, password } = data;

  // Find the password reset token
  const passwordReset = await prisma.passwordReset.findUnique({
    where: {
      userId,
      token,
    },
    include: {
      user: true,
    },
  });

  if (!passwordReset) {
    throw new AppError("Invalid password reset token", HTTP_STATUS.BAD_REQUEST);
  }

  //  If user is social login we can't reset the password
  if (
    passwordReset.user.password === null ||
    passwordReset.user.password === undefined
  ) {
    throw new AppError(
      "Social Login User cannot reset password",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Check if the user is the same as the user in the password reset token
  if (passwordReset.user.id !== userId) {
    throw new AppError("User not found", HTTP_STATUS.BAD_REQUEST);
  }

  // Check if the token has expired
  if (passwordReset.expiresAt < new Date()) {
    throw new AppError("Password reset token expired", HTTP_STATUS.BAD_REQUEST);
  }

  // Check same password if user has password since its optional (Social Login)
  if (passwordReset.user.password) {
    const isSamePassword = await bcrypt.compare(
      password,
      passwordReset.user.password
    );
    if (isSamePassword) {
      throw new AppError(
        "New password cannot be the same as the old password",
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user's password and clear the password reset token
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordReset.delete({
      where: { id: passwordReset.id },
    }),
  ]);

  // Send Password Change Complete Email
  await sendPasswordChangeCompleteEmail({
    to: passwordReset.user.email,
  });

  return {
    message: "Password reset successfully",
  };
};
