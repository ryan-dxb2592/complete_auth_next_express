import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import { engine } from "express-handlebars";
import path from "path";
import indexRouter from "@/routes";
import { errorHandler } from "./middlewares/errorHandler";

const app: Express = express();

// View engine setup
app.engine(
  "hbs",
  engine({
    extname: ".hbs",
    defaultLayout: "main",
    layoutsDir: path.join(__dirname, "views/layouts"),
  })
);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(helmet());
app.use(cors({ credentials: true }));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Main page route
app.get("/", (_req, res) => {
  res.render("landing", {
    title: "Complete Auth System",
    description: "Modern Authentication System API",
  });
});

// Routes
app.use("/api/v1", indexRouter);

app.use(errorHandler);

export default app;
