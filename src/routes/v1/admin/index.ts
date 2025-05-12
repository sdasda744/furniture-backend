import express from "express";

import { getAllUsers } from "../../../controllers/admin/userController";
import { setMaintenanceMode } from "../../../controllers/admin/systemController";
import upload from "../../../middlewares/uploadFile";
import { createPost, updatePost, deletePost } from "../../../controllers/admin/postController";

// admin routes

const router = express.Router();

router.get("/get-users", getAllUsers);
router.post("/maintenance-mode", setMaintenanceMode);

// CRUD Posts
router.post("/posts", upload.single("image"), createPost)
router.patch("/posts", upload.single("image"), updatePost);
router.delete("/posts", upload.single("image"), deletePost)

export default router;
