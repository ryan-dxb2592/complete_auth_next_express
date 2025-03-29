import { generateTwoFactorToken } from "@/services/token.service";
import { VerifyTwoFactorInput } from "./schema";
import prisma from "@/utils/db";
import {
  sendDisableTwoFactorEmail,
  sendEnableTwoFactorEmail,
  sendTwoFactorStatusEmail,
} from "@/services/email.service";
import { findUserById } from "@/helpers/dbCalls/users";
import { AppError } from "@/utils/error";
import { HTTP_STATUS } from "@/constants";

export const toggleTwoFactorService = async (userId: string) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  // Generate a new token for verification
  const twoFactorCode = generateTwoFactorToken(6);

  // Create a new token
  const twoFactorToken = await prisma.twoFactorToken.upsert({
    where: {
      userId_type: {
        userId,
        type: "TWO_FACTOR",
      },
    },
    create: {
      userId,
      type: "TWO_FACTOR",
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
      action: user.isTwoFactorEnabled
        ? "DISABLE"
        : "ENABLE",
    },
    update: {
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
      action: user.isTwoFactorEnabled ? "DISABLE" : "ENABLE",
    },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  // Send Two Factor Email based on action
  if (user.isTwoFactorEnabled) {
    await sendDisableTwoFactorEmail({
      to: twoFactorToken.user.email,
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
    });
  } else {
    await sendEnableTwoFactorEmail({
      to: twoFactorToken.user.email,
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
    });
  }

  return {
    message: user.isTwoFactorEnabled
      ? "Check your email for the two factor code to disable 2FA"
      : "Check your email for the two factor code to enable 2FA",
  };
};

export const verifyTwoFactorService = async (
  email: string,
  userId: string,
  data: VerifyTwoFactorInput
) => {
  const { code } = data;

  // Find the most recent two factor token for the user
  const twoFactorToken = await prisma.twoFactorToken.findFirst({
    where: {
      userId,
      type: "TWO_FACTOR",
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!twoFactorToken) {
    throw new AppError("Invalid or expired code", HTTP_STATUS.BAD_REQUEST);
  }

  // Delete the used token
  await prisma.twoFactorToken.delete({
    where: {
      id: twoFactorToken.id,
    },
  });

  // Handle based on action
  if (twoFactorToken.action === "ENABLE") {
    // Enable two factor for the user
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isTwoFactorEnabled: true,
      },
    });

    // Send email to user
    await sendTwoFactorStatusEmail({
      to: email,
      action: "enabled",
      timestamp: new Date().toISOString(),
      device: "web",
    });

    return {
      message: "Two factor authentication has been enabled",
    };
  }

  if (twoFactorToken.action === "DISABLE") {
    // Delete all two factor tokens for the user
    await prisma.twoFactorToken.deleteMany({
      where: {
        userId,
        type: "TWO_FACTOR",
      },
    });

    // Disable two factor for the user
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isTwoFactorEnabled: false,
      },
    });

    // Send email to user
    await sendTwoFactorStatusEmail({
      to: email,
      action: "disabled",
      timestamp: new Date().toISOString(),
      device: "web",
    });

    return {
      message: "Two factor authentication has been disabled",
    };
  }

  return {
    message: "Invalid token action",
  };
};
