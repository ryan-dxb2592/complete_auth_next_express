import { HTTP_STATUS } from "@/constants";
import { createEmailTransport } from "@/helpers/createEmailTransport";
import loadTemplate from "@/helpers/loadTemplates";
import { AppError } from "@/utils/error";
import { logger } from "@/utils/logger";

const transporter = createEmailTransport();

// Send Verification Email
export const sendVerificationEmail = async (payload: {
  to: string;
  userId: string;
  token: string;
  expiresIn: string;
}) => {
  try {
    const template = await loadTemplate("verify-email");
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${payload.userId}/${payload.token}`;

    const html = template({
      verificationLink,
      expiresIn: payload.expiresIn,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Verify your email address",
      html,
    });

    logger.info(`Verification email sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending verification email:", error);
    throw new AppError(
      "Failed to send verification email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send Verification Complete Email
export const sendVerifiedEmail = async (payload: { to: string }) => {
  try {
    const template = await loadTemplate("verification-complete");

    const html = template({
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Email Verification Complete",
      html,
    });

    logger.info(`Verification complete email sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending verification complete email:", error);
    throw new AppError(
      "Failed to send verification complete email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send 2FA Code Email
export const sendTwoFactorCodeEmail = async (payload: {
  to: string;
  code: string;
  expiresAt: Date;
}) => {
  try {
    const template = await loadTemplate("two-factor");

    const html = template({
      code: payload.code,
      expiryTime: payload.expiresAt,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Two-Factor Authentication Code",
      html,
    });

    logger.info(`Two-Factor authentication code sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending two-factor authentication code email:", error);
    throw new AppError(
      "Failed to send two-factor authentication code email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};
