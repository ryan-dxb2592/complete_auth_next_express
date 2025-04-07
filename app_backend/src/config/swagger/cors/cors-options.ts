import { CorsOptions } from "cors";
import allowedOrigins from "./allowed-origins";

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // In development, log the origin for debugging
    console.log("Request origin:", origin);
    
    if (allowedOrigins.indexOf(origin!) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  exposedHeaders: ["set-cookie", "authorization", "x-access-token", "x-refresh-token"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "x-access-token", "x-refresh-token"],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

export default corsOptions;