import prisma from "@/utils/db";
import { ChangePasswordInput, VerifyChangePasswordInput } from "./schema";
import bcrypt from "bcryptjs";
import { generateTwoFactorToken } from "@/services/token.service";
import { HTTP_STATUS } from "@/constants";
import { AppError } from "@/utils/error";
import { TwoFactorType } from "@prisma/client";
import { sendPasswordChangeTwoFactorEmail } from "@/services/email.service";

export const changePasswordService = async (
  userId: string,
  data: ChangePasswordInput
): Promise<{ responseType: "TWO_FACTOR" | "PASSWORD_CHANGE" }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true, isTwoFactorEnabled: true, email: true },
  });

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  const isPasswordValid = await bcrypt.compare(
    data.currentPassword,
    user.password!
  );

  if (!isPasswordValid) {
    throw new AppError(
      "Current password is incorrect",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (user.isTwoFactorEnabled) {
    // Generate a new 2FA code
    const { code, expiresAt } = generateTwoFactorToken(6);

    // Save the code to the database
    await prisma.twoFactorToken.upsert({
      where: { userId_type: { userId, type: TwoFactorType.PASSWORD_CHANGE } },
      create: {
        code,
        type: TwoFactorType.PASSWORD_CHANGE,
        expiresAt,
        userId,
      },
      update: {
        code,
        expiresAt,
      },
    });

    // Send the code to the user's email
    await sendPasswordChangeTwoFactorEmail({
      to: user.email,
      code,
      expiresAt,
    });

    return { responseType: "TWO_FACTOR" };
  }

  // If 2FA is not enabled, change password directly
  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { responseType: "PASSWORD_CHANGE" };
};

export const verifyChangePasswordService = async (
  userId: string,
  data: VerifyChangePasswordInput
): Promise<void> => {
  const twoFactorToken = await prisma.twoFactorToken.findUnique({
    where: {
      userId_type: {
        userId,
        type: TwoFactorType.PASSWORD_CHANGE,
      },
    },
  });

  if (!twoFactorToken) {
    throw new AppError("Invalid or expired code", HTTP_STATUS.BAD_REQUEST);
  }

  if (twoFactorToken.code !== data.code) {
    throw new AppError("Invalid code", HTTP_STATUS.BAD_REQUEST);
  }

  if (twoFactorToken.expiresAt < new Date()) {
    throw new AppError("Code has expired", HTTP_STATUS.BAD_REQUEST);
  }

  // Update password
  const hashedPassword = await bcrypt.hash(data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Delete the used token
  await prisma.twoFactorToken.delete({
    where: { id: twoFactorToken.id },
  });
};
