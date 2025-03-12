import rateLimit from "express-rate-limit";

// Rate Limit For send verification email (5 emails per hour)
export const sendVerificationEmailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: {
    status: "error",
    message: "Too many verification emails sent. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limit For login (5 login attempts per hour)
export const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  message: {
    status: "error",
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
