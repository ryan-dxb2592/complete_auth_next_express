import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  verifyLoginTwoFactor,
  refreshToken,
  logout,
  logoutAllSessions,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyChangePassword,
  toggleTwoFactor,
  verifyTwoFactor,
} from "@/controllers";
import { authMiddleware } from "@/middlewares/auth-middleware";
import {
  loginLimiter,
  sendVerificationEmailLimiter,
} from "@/utils/rate-limiters";
import { Router } from "express";

const router = Router();

router.post("/register", registerUser);
router.post("/verify-email/:userId/:token", verifyEmail);
router.post(
  "/resend-verification",
  sendVerificationEmailLimiter,
  resendVerification
);
router.post("/login", loginLimiter, loginUser);
router.post("/verify-login-two-factor", verifyLoginTwoFactor);
router.post("/refresh-token", refreshToken);
router.post("/logout", authMiddleware, logout);
router.post("/logout-all-sessions", authMiddleware, logoutAllSessions);
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/change-password", authMiddleware, changePassword);
router.post("/verify-change-password", authMiddleware, verifyChangePassword);
router.post("/toggle-two-factor", authMiddleware, toggleTwoFactor);
router.post("/verify-two-factor", authMiddleware, verifyTwoFactor);
export default router;
