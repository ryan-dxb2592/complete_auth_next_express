import crypto from "crypto";

// Generate a verification token with a 1 hour expiry
export const generateVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  return { token, expiresAt };
};
