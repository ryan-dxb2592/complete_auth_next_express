import { registerUser } from "@/controllers";
import { Router } from "express";

const router = Router();

router.post("/register", registerUser);

export default router;
