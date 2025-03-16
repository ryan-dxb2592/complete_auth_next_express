import nodemailer from "nodemailer";
import { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } from "@/constants";

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
  var transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: parseInt(MAIL_PORT),
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS,
    },
  });

  return transporter;
}
