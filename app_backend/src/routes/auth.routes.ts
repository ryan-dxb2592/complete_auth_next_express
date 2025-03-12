import {
  registerUser,
  verifyEmail,
  resendVerification,
  loginUser,
  verifyTwoFactor,
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

export default router;
