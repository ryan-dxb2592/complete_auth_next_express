import http from "http";
import app from "./server";
import { logger } from "./utils/logger";
import { PORT } from "./constants";

const server = http.createServer(app);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception: ", error);
  process.exit(1);
});

// Add graceful shutdown handling
const shutDown = () => {
  logger.info("Received kill signal, shutting down gracefully");
  server.close(() => {
    logger.info("Closed out remaining connections");
    process.exit(0);
  });
};

// Listen for shutdown signals
process.on("SIGTERM", shutDown);
process.on("SIGINT", shutDown);

server.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (error) => {
  logger.error("Unhandled Rejection: ", error);
  process.exit(1);
});
