import nodemailer from "nodemailer";

/**
 * Creates an email transport using nodemailer
 * Uses Mailhog in development and TODO in production
 */
export function createEmailTransport() {
  // if (process.env.NODE_ENV === "production") {
  //   // TODO: Configure production email transport
  //   throw new Error("Production email transport not configured");
  // }

  // Development transport using Mailhog
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "daphney.friesen21@ethereal.email",
      pass: "c5Z9rmZ1nF2tjgRz9W",
    },
  });

  return transporter;
}
