import express from "express";

import { getAllUsers } from "../../../controllers/admin/userController";
import { setMaintenanceMode } from "../../../controllers/admin/systemController";

// admin routes

const router = express.Router();

router.get("/get-users", getAllUsers);
router.post("/maintenance-mode", setMaintenanceMode);

export default router;
