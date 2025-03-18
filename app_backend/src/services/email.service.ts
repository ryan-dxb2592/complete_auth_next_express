import { HTTP_STATUS } from "@/constants";
import { createEmailTransport } from "@/helpers/createEmailTransport";
import loadTemplate from "@/helpers/loadTemplates";
import { AppError } from "@/utils/error";
import { logger } from "@/utils/logger";

// Send Verification Email
export const sendVerificationEmail = async (payload: {
  to: string;
  userId: string;
  token: string;
  expiresIn: string;
}) => {
  try {
    const transporter = await createEmailTransport();
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
    const transporter = await createEmailTransport();
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

// Send 2FA Code Email for Login
export const sendTwoFactorCodeEmail = async (payload: {
  to: string;
  code: string;
  expiresAt: Date;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("two-factor-login");

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

// Send Enable 2FA Code Email
export const sendEnableTwoFactorEmail = async (payload: {
  to: string;
  code: string;
  expiresAt: Date;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("enable-two-factor");

    const html = template({
      code: payload.code,
      expiryTime: payload.expiresAt,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Enable Two-Factor Authentication",
      html,
    });

    logger.info(`Enable 2FA code sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending enable 2FA code email:", error);
    throw new AppError(
      "Failed to send enable 2FA code email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send Disable 2FA Code Email
export const sendDisableTwoFactorEmail = async (payload: {
  to: string;
  code: string;
  expiresAt: Date;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("disable-two-factor");

    const html = template({
      code: payload.code,
      expiryTime: payload.expiresAt,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Disable Two-Factor Authentication",
      html,
    });

    logger.info(`Disable 2FA code sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending disable 2FA code email:", error);
    throw new AppError(
      "Failed to send disable 2FA code email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send Password Change 2FA Code Email
export const sendPasswordChangeTwoFactorEmail = async (payload: {
  to: string;
  code: string;
  expiresAt: Date;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("password-two-factor");

    const html = template({
      code: payload.code,
      expiryTime: payload.expiresAt,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Password Change Verification",
      html,
    });

    logger.info(`Password change 2FA code sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending password change 2FA code email:", error);
    throw new AppError(
      "Failed to send password change 2FA code email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send 2FA Status Update Email
export const sendTwoFactorStatusEmail = async (payload: {
  to: string;
  action: "enabled" | "disabled";
  timestamp: string;
  device: string;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("two-factor-status");

    const html = template({
      action: payload.action,
      timestamp: payload.timestamp,
      device: payload.device,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Two-Factor Authentication Status Update",
      html,
    });

    logger.info(`2FA status update email sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending 2FA status update email:", error);
    throw new AppError(
      "Failed to send 2FA status update email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send Password Reset Email
export const sendPasswordResetEmail = async (payload: {
  to: string;
  userId: string;
  token: string;
  expiresAt: Date;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("reset-password");
    const resetLink = `${process.env.CLIENT_URL}/auth/reset-password/${payload.userId}/${payload.token}`;

    const html = template({
      resetLink: resetLink,
      expiryTime: payload.expiresAt,
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Password Reset Request",
      html,
    });

    logger.info(`Password reset email sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending password reset email:", error);
    throw new AppError(
      "Failed to send password reset email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};

// Send Password Change Complete Email
export const sendPasswordChangeCompleteEmail = async (payload: {
  to: string;
}) => {
  try {
    const transporter = await createEmailTransport();
    const template = await loadTemplate("change-password-complete");

    const html = template({
      email: payload.to,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: payload.to,
      subject: "Password Change Complete",
      html,
    });

    logger.info(`Password change complete email sent to ${payload.to}`);
  } catch (error) {
    logger.error("Error sending password change complete email:", error);
    throw new AppError(
      "Failed to send password change complete email",
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
};
