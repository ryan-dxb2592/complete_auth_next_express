import { Response, Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "@/config/swagger/swagger.config";
import { HTTP_STATUS } from "@/constants";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
const router = Router();

// Health Check Route
router.get("/health", (_, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    status: "success",
    message: "OK",
  });
});

// Swagger Documentation Route
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Complete Auth System API",
  })
);

// Auth Routes
router.use("/auth", authRoutes);

// User Routes
router.use("/user", userRoutes);

export default router;
