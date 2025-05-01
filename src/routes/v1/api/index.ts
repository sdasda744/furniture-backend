import Router from "express"
import { changeLanguage, testPermission } from "../../../controllers/api/profileController";
import { auth } from "../../../middlewares/auth";


const router = Router();

router.post("/change-language", changeLanguage);
router.get("/test-permission", auth, testPermission)

export default router;