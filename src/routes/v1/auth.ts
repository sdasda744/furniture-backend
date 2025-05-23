import express from "express";
import {
  register,
  verifyOtp,
  confirmPassword,
  login,
  logout,
  forgotPassword,
  verifyOtpForResetPassword,
  confirmResetPassword,
} from "../../controllers/authController";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/confirm-password", confirmPassword);
router.post("/login", login);

router.post("/logout", logout);

router.post("/forgot-password", forgotPassword);
router.post("/verifyOtp-forgot-password", verifyOtpForResetPassword);
router.post("/reset-password", confirmResetPassword)

export default router;
