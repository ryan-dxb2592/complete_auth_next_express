import prisma from "@/utils/db";
import {
  LoginServiceResponse,
  LoginUserInput,
  TwoFactorLoginInput,
  TwoFactorLoginServiceResponse,
} from "./schema";
import bcrypt from "bcryptjs";
import {
  generateTokens,
  generateTwoFactorToken,
} from "@/services/token.service";
import { LoginUserResponse } from "./schema";
import { findUserByEmail } from "@/helpers/dbCalls/users";
import { HTTP_STATUS } from "@/constants";
import { AppError } from "@/utils/error";
import { UAParser } from "ua-parser-js";
import { TwoFactorType } from "@prisma/client";
import { sendTwoFactorCodeEmail } from "@/services/email.service";

//Function to validate credentials
const validateCredentials = async (email: string, password: string) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password!);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(
      "Please verify your email first",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  return user;
};

// Function to Create and send Tokens and session
const createAndSendTokensAndSession = async (
  userId: string,
  userEmail: string,
  ipAddress: string,
  uaParser: UAParser.IResult,
  existingRefreshToken: string
) => {
  const { accessToken, refreshToken } = generateTokens(userId, userEmail);

  let session;

  if (existingRefreshToken) {
    // Find existing session by refresh token
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        refreshToken: {
          token: existingRefreshToken,
        },
      },
    });

    if (existingSession) {
      // Update session with new token and expiry
      session = await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          lastUsed: new Date(),
          refreshToken: {
            update: {
              token: refreshToken,
              expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
            },
          },
        },
        include: {
          user: true,
          refreshToken: true,
        },
      });
    }
  } else {
    // If no existing refresh token, check for existing session with same IP and user agent
    const existingSession = await prisma.session.findFirst({
      where: {
        userId,
        ipAddress,
        userAgent: uaParser.ua,
      },
    });

    if (existingSession) {
      // Update session with new token and expiry
      session = await prisma.session.update({
        where: { id: existingSession.id },
        data: {
          lastUsed: new Date(),
          refreshToken: {
            update: {
              token: refreshToken,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            },
          },
        },
        include: {
          user: true,
          refreshToken: true,
        },
      });
    }
  }

  if (!session) {
    session = await prisma.session.create({
      data: {
        userId,
        ipAddress,
        userAgent: uaParser.ua,
        deviceType: uaParser.device.type || null,
        deviceName: uaParser.device.model || null,
        browser: uaParser.browser.name || null,
        os: uaParser.os.name || null,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        refreshToken: {
          create: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 days
          },
        },
      },
      include: {
        user: true,
        refreshToken: true,
      },
    });
  }

  const user = session?.user;

  return {
    user,
    session: {
      id: session.id,
      ipAddress: session.ipAddress,
      deviceType: session.deviceType,
      deviceName: session.deviceName,
      browser: session.browser,
      os: session.os,
      accessToken,
      refreshToken: session.refreshToken!.token,
    },
  };
};

export const loginUserService = async (
  data: LoginUserInput,
  ipAddress: string,
  uaParser: UAParser.IResult,
  existingRefreshToken: string
): Promise<
  | (LoginServiceResponse & { responseType: "LOGIN" })
  | (TwoFactorLoginServiceResponse & { responseType: "TWO_FACTOR" })
  | undefined
> => {
  // Find user by email
  const user = await validateCredentials(data.email, data.password);

  // If 2FA not enabled, we will generate the tokens and return the response
  if (!user.isTwoFactorEnabled) {
    const response = await createAndSendTokensAndSession(
      user.id,
      user.email,
      ipAddress,
      uaParser,
      existingRefreshToken
    );

    return {
      user: { ...response.user },
      session: { ...response.session },
      responseType: "LOGIN",
    };
  }

  // IF 2FA is enabled, we will initiate the 2FA process
  if (user.isTwoFactorEnabled) {
    const response = await initiateTwoFactorLogin(user.id, user.email);

    return {
      ...response,
      responseType: "TWO_FACTOR",
    };
  }

  return undefined;
};

const initiateTwoFactorLogin = async (
  userId: string,
  userEmail: string
): Promise<TwoFactorLoginServiceResponse> => {
  // Generate a new 2FA code
  const { code, expiresAt } = generateTwoFactorToken(6);

  // Save the code to the database
  await prisma.twoFactorToken.upsert({
    where: { userId_type: { userId, type: TwoFactorType.LOGIN } },
    create: {
      code,
      type: TwoFactorType.LOGIN,
      expiresAt,
      userId,
    },
    update: {
      code,
      expiresAt,
    },
  });

  // Send the code to the user's email
  await sendTwoFactorCodeEmail({
    to: userEmail,
    code,
    expiresAt,
  });

  return {
    code,
    userId,
    type: TwoFactorType.LOGIN,
  };
};

export const verifyTwoFactorService = async (
  data: TwoFactorLoginInput,
  ipAddress: string,
  uaParser: UAParser.IResult,
  existingRefreshToken: string
) => {
  const { userId, code } = data;

  const twoFactorToken = await prisma.twoFactorToken.findFirst({
    where: { userId, type: TwoFactorType.LOGIN },
    include: {
      user: true,
    },
  });

  if (!twoFactorToken) {
    throw new AppError("Invalid 2FA code", HTTP_STATUS.UNAUTHORIZED);
  }

  if (twoFactorToken.code !== code) {
    throw new AppError("Invalid 2FA code", HTTP_STATUS.UNAUTHORIZED);
  }

  if (twoFactorToken.expiresAt < new Date()) {
    throw new AppError("2FA code expired", HTTP_STATUS.UNAUTHORIZED);
  }

  const response = await createAndSendTokensAndSession(
    userId,
    twoFactorToken.user.email,
    ipAddress,
    uaParser,
    existingRefreshToken
  );

  // Delete the 2FA token
  await prisma.twoFactorToken.delete({
    where: { id: twoFactorToken.id },
  });

  return {
    user: { ...response.user },
    session: { ...response.session },
    responseType: "LOGIN",
  };
};
