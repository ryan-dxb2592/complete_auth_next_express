import nodemailer from "nodemailer";

/**
 * Creates an email transport using nodemailer
 * Uses MailDev in development and TODO in production
 */
export function createEmailTransport() {
  // if (process.env.NODE_ENV === "production") {
  //   // TODO: Configure production email transport
  //   throw new Error("Production email transport not configured");
  // }

  // Development transport using MailDev
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "ivory.ullrich45@ethereal.email",
      pass: "M2xAg1syYaRmSfunNS",
    },
  });

  return transporter;
}
