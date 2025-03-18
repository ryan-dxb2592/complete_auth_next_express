import { generateTwoFactorToken } from "@/services/token.service";
import { ToggleTwoFactorInput, VerifyTwoFactorInput } from "./schema";
import prisma from "@/utils/db";
import {
  sendDisableTwoFactorEmail,
  sendEnableTwoFactorEmail,
} from "@/services/email.service";
import { TwoFactorType } from "@prisma/client";

export const toggleTwoFactorService = async (
  userId: string,
  data: ToggleTwoFactorInput
) => {
  const { enable, disable } = data;

  // if both are true, return error
  if (enable && disable) {
    return {
      message: "Invalid request",
    };
  }

  // Generate a new token for verification
  const twoFactorCode = generateTwoFactorToken(6);

  // Create a new token
  const twoFactorToken = await prisma.twoFactorToken.create({
    data: {
      userId,
      type: TwoFactorType.TWO_FACTOR,
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
      action: enable ? "ENABLE" : "DISABLE",
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
  if (enable) {
    await sendEnableTwoFactorEmail({
      to: twoFactorToken.user.email,
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
    });
  } else {
    await sendDisableTwoFactorEmail({
      to: twoFactorToken.user.email,
      code: twoFactorCode.code,
      expiresAt: twoFactorCode.expiresAt,
    });
  }

  return {
    message: enable
      ? "Check your email for the two factor code to enable 2FA"
      : "Check your email for the two factor code to disable 2FA",
  };
};

export const verifyTwoFactorService = async (
  userId: string,
  data: VerifyTwoFactorInput
) => {
  const { code } = data;

  // Find the most recent two factor token for the user
  const twoFactorToken = await prisma.twoFactorToken.findFirst({
    where: {
      userId,
      type: TwoFactorType.TWO_FACTOR,
      code,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!twoFactorToken) {
    return {
      message: "Invalid or expired code",
    };
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

    return {
      message: "Two factor authentication has been enabled",
    };
  }

  if (twoFactorToken.action === "DISABLE") {
    // Delete all two factor tokens for the user
    await prisma.twoFactorToken.deleteMany({
      where: {
        userId,
        type: TwoFactorType.TWO_FACTOR,
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

    return {
      message: "Two factor authentication has been disabled",
    };
  }

  return {
    message: "Invalid token action",
  };
};
