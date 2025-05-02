import Router from "express";

import { auth } from "../../middlewares/auth";
import { authorize } from "../../middlewares/authorize";
import authRoutes from "./auth";
import userRoutes from "./api";
import adminRoutes from "./admin";
import { maintenanceMode } from "../../middlewares/maintenance";

const router = Router();

// router.use("/api/v1", authRoutes);
// router.use("/api/v1/users", userRoutes);
// router.use("/api/v1/admins", auth, authorize(true, "ADMIN"), adminRoutes);

router.use("/api/v1",maintenanceMode, authRoutes);
router.use("/api/v1/users",maintenanceMode, userRoutes);
router.use("/api/v1/admins", maintenanceMode, auth, authorize(true, "ADMIN"), adminRoutes);

export default router;
