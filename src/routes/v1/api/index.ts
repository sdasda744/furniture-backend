import Router from "express";
import {
  changeLanguage,
  getMyPhoto,
  testPermission,
  uploadMultiplePhoto,
  uploadProfile,
  uploadPhotoOptimize,
} from "../../../controllers/api/profileController";
import { auth } from "../../../middlewares/auth";
import upload, { uploadMemory } from "../../../middlewares/uploadFile";

// user routes

const router = Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission);
router.patch("/profile/upload", auth, upload.single("avatar"), uploadProfile);
router.patch(
  "/profile/upload/optimize",
  auth,
  upload.single("avatar"),
  uploadPhotoOptimize
);
router.patch(
  "/profile/upload/multiple",
  auth,
  upload.array("avatar"),
  uploadMultiplePhoto
);
router.get("/profile/my-photo", getMyPhoto);

export default router;
