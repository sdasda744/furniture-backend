import Router from "express";

import { auth } from "../../middlewares/auth";
import { authorize } from "../../middlewares/authorize";
import authRoutes from "./auth";
import userRoutes from "./api";
import adminRoutes from "./admin";

const router = Router();

router.use("/api/v1", authRoutes);
router.use("/api/v1/users", userRoutes);
router.use("/api/v1/admin", auth, authorize(true, "ADMIN"), adminRoutes);

export default router;
