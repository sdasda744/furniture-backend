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
import { getPost, getPostsByPagination, getInfinitePostsByPagination } from "../../../controllers/api/postController";

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

router.get("/posts", auth, getPostsByPagination); // Offset Pagination
router.get("/posts/infinite", auth, getInfinitePostsByPagination); // Cursor-based Pagination
router.get("/posts/:id", auth, getPost);

export default router;
