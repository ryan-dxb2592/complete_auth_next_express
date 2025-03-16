import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  verifyTwoFactor,
  refreshToken,
} from "@/controllers";
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
router.post("/verify-two-factor", verifyTwoFactor);
router.post("/refresh-token", refreshToken);

export default router;
