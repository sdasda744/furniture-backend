import express, { Request, Response, NextFunction } from "express";
import morgan from "morgan";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";
import cron from "node-cron";

import { limiter } from "./middlewares/rateLimiter";
import routes from "./routes/v1";
import {
  createOrUpdateMaintenanceStatus,
  getMaintenanceStatusByKey,
} from "./services/maintenanceService";
// import { auth } from "./middlewares/auth";
// import authRoutes from "./routes/v1/auth";
// import adminRoutes from "./routes/v1/admin";
// import profileRoutes from "./routes/v1/api/user";
// import { authorize } from "./middlewares/authorise";
// import healthRoutes from "./routes/v1/health";
export const app = express();

var whitelist = ["http://example1.com", "http://localhost:8080"];
var corsOptions = {
  origin: function (
    origin: any,
    callback: (err: Error | null, origin?: any) => void
  ) {
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credential: true, // Allow cookies or authorization header
};

app
  .use(morgan("dev"))
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use(cookieParser())
  .use(cors(corsOptions))
  .use(helmet())
  .use(compression())
  .use(limiter);

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join("src/locales", "{{lng}}", "{{ns}}.json"),
    },
    detection: {
      order: ["querystring", "cookie"],
      caches: ["cookie"],
    },
    fallbackLng: "en",
    preload: ["en", "mm"],
  });

app.use(middleware.handle(i18next));

// app.use("/api/v1", authRoutes);
// app.use("/api/v1/admin", auth, authorize(true, "ADMIN"), adminRoutes);
// app.use("/api/v1", profileRoutes);
app.use(routes);

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const message = error.message || "server error";
  const status = error.status || 500;
  const errorCode = error.code || "Error_CodeFromServer";
  res.status(status).json({ message, error: errorCode });
});

// cron.schedule("* * * * *", async () => {
//   console.log("Cron job is running every minute...");
//   const maintenance = await getMaintenanceStatusByKey("maintenance");
//   if (maintenance?.value === "true") {
//     await createOrUpdateMaintenanceStatus("maintenance", "false");
//     console.log("Maintenance mode is turn off");
//   }
// });
