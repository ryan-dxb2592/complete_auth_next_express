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
  console.log("Sending verification email to:", payload.to);
  console.log("User ID:", payload.userId);
  console.log("Token:", payload.token);
  console.log("Expires in:", payload.expiresIn);
  try {
    const template = await loadTemplate("verify-email");
    const verificationLink = `${process.env.CLIENT_URL}/auth/verify-email/${payload.userId}/${payload.token}`;

    const html = template({
      verificationLink,
      expiresIn: payload.expiresIn,
      email: payload.to,
    });
    console.log("HTML:", html);
    console.log("Transporter:", transporter);

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
