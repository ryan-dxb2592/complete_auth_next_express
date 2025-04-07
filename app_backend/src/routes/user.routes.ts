import { Router } from "express";
import { getMeController } from "@/controllers/userControllers";
import { authMiddleware } from "@/middlewares/auth-middleware";

const router = Router();

router.get("/me", authMiddleware, getMeController);

export default router;

